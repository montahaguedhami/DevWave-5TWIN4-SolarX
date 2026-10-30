"""AI weather assistant: energy potential, impacts on production and advice.

Deterministic indicators (irradiation, wind, estimated production of the
installations located in the city in the ontology) are computed first, then
sent to Gemini. Models from ``GEMINI_MODELS`` are tried in order; if none
answers (no key, quota, outage...) a local rule-based analysis is returned.
"""

import json
import logging

import httpx

from app.core.config import settings
from app.schemas.meteo import (
    AnalyseAssistant,
    IndicateursEnergie,
    InstallationLocale,
    MeteoActuelle,
)
from app.services.fuseki import FusekiClient, iri, local_name
from app.services.meteo_service import MeteoService

logger = logging.getLogger(__name__)

PERFORMANCE_RATIO = 0.8  # typical PV system losses
COEF_TEMPERATURE = 0.004  # PV power loss per °C above 25 °C
VENT_DEMARRAGE, VENT_NOMINAL, VENT_ARRET = 3.0, 12.0, 25.0  # m/s
# Google keeps these aliases pointing to a current model: last-resort fallbacks.
MODELES_ALIAS = ["gemini-flash-lite-latest", "gemini-flash-latest"]
POTENTIELS = {"élevé": "Élevé", "eleve": "Élevé", "fort": "Élevé", "moyen": "Moyen", "modéré": "Moyen", "faible": "Faible"}

SYSTEM_PROMPT = (
    "Tu es l'assistant énergie de SolarX, une plateforme de supervision d'énergie solaire et éolienne "
    "en Tunisie. À partir des données météo et des indicateurs fournis, évalue le potentiel de production "
    "d'énergie, explique les conséquences de la météo sur la production solaire et éolienne, et donne des "
    "conseils concrets (maintenance, stockage batterie, usage des appareils, sécurité). Réponds en français, "
    "de façon courte et précise, en t'appuyant uniquement sur les chiffres fournis. Si l'utilisateur pose "
    "une question hors du sujet énergie/météo, indique poliment que tu ne traites que ce sujet."
)

RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "potentiel": {"type": "STRING", "enum": ["Élevé", "Moyen", "Faible"]},
        "score": {"type": "INTEGER"},
        "resume": {"type": "STRING"},
        "impactsSolaire": {"type": "ARRAY", "items": {"type": "STRING"}},
        "impactsEolien": {"type": "ARRAY", "items": {"type": "STRING"}},
        "conseils": {"type": "ARRAY", "items": {"type": "STRING"}},
        "meilleurCreneau": {"type": "STRING"},
        "reponse": {"type": "STRING"},
    },
    "required": ["potentiel", "score", "resume", "impactsSolaire", "impactsEolien", "conseils"],
}


def _fraction_eolienne(vent: float) -> float:
    if vent < VENT_DEMARRAGE or vent > VENT_ARRET:
        return 0.0
    if vent >= VENT_NOMINAL:
        return 1.0
    return ((vent - VENT_DEMARRAGE) / (VENT_NOMINAL - VENT_DEMARRAGE)) ** 3


class AssistantMeteoService:
    def __init__(self, fuseki: FusekiClient) -> None:
        self.fuseki = fuseki
        self.meteo = MeteoService(fuseki)

    # ---- Indicators ----------------------------------------------------
    def _installations(self, ville_id: str) -> list[dict]:
        rows = self.fuseki.select(
            f"""
            SELECT ?i ?type (SAMPLE(?p) AS ?puissance) WHERE {{
              ?i solarx:situeDans {iri(ville_id)} ; a ?type .
              ?type rdfs:subClassOf solarx:InstallationProduction .
              OPTIONAL {{ ?i solarx:puissanceKW ?p }}
            }} GROUP BY ?i ?type
            """
        )
        return [
            {
                "nom": local_name(r["i"]),
                "type": local_name(r["type"]),
                "puissanceKW": float(r["puissance"]) if r.get("puissance") else None,
            }
            for r in rows
        ]

    def indicateurs(self, meteo: MeteoActuelle) -> IndicateursEnergie:
        previsions = meteo.previsions
        rayonnements = [p.rayonnement or 0.0 for p in previsions]
        vents = [p.vent or 0.0 for p in previsions]
        irradiation = sum(rayonnements) / 1000  # hourly W/m² -> kWh/m²
        pic = max(previsions, key=lambda p: p.rayonnement or 0.0, default=None)
        temperatures_jour = [p.temperature for p in previsions if (p.rayonnement or 0) > 0 and p.temperature is not None]
        temp_moy_jour = sum(temperatures_jour) / len(temperatures_jour) if temperatures_jour else 25.0
        # Cell temperature is roughly 20 °C above air temperature in full sun.
        facteur_temp = max(0.0, 1 - COEF_TEMPERATURE * max(0.0, temp_moy_jour + 20 - 25))

        installations = []
        for inst in self._installations(meteo.ville):
            production = None
            if inst["puissanceKW"]:
                if inst["type"] == "CentraleSolaire":
                    production = inst["puissanceKW"] * irradiation * PERFORMANCE_RATIO * facteur_temp
                elif inst["type"] == "ParcEolien":
                    production = inst["puissanceKW"] * sum(_fraction_eolienne(v) for v in vents)
            installations.append(
                InstallationLocale(**inst, productionEstimeeKWh=round(production, 1) if production is not None else None)
            )

        return IndicateursEnergie(
            irradiation24hKWhM2=round(irradiation, 2),
            picRayonnement=round(pic.rayonnement or 0.0, 0) if pic else 0.0,
            heurePic=pic.time[11:16] if pic and (pic.rayonnement or 0) > 0 else None,
            heuresEnsoleillees=sum(1 for r in rayonnements if r >= 200),
            ventMoyen=round(sum(vents) / len(vents), 1) if vents else 0.0,
            ventMax=round(max(vents), 1) if vents else 0.0,
            heuresVentProductif=sum(1 for v in vents if VENT_DEMARRAGE <= v <= VENT_ARRET),
            installations=installations,
        )

    # ---- Gemini --------------------------------------------------------
    def _prompt(self, meteo: MeteoActuelle, ind: IndicateursEnergie, question: str | None) -> str:
        donnees = {
            "ville": meteo.villeNom,
            "dateMesure": meteo.dateMesure,
            "estJour": meteo.estJour,
            "mesuresActuelles": {m.label: f"{m.valeur} {m.unite}" for m in meteo.mesures},
            "alertes": [a.titre for a in meteo.alertes],
            "previsions24h": [
                {"heure": p.time[11:16], "temp": p.temperature, "rayonnement": p.rayonnement, "vent": p.vent, "pluie": p.precipitation}
                for p in meteo.previsions
            ],
            "indicateurs": ind.model_dump(),
        }
        texte = (
            "Données (JSON) :\n" + json.dumps(donnees, ensure_ascii=False) +
            "\n\nDonne : potentiel (Élevé/Moyen/Faible), score 0-100, résumé (2 phrases), impacts sur le "
            "solaire, impacts sur l'éolien, 3 à 5 conseils, meilleur créneau horaire de production."
        )
        if question:
            texte += f"\n\nQuestion de l'utilisateur (réponds dans le champ 'reponse') : {question}"
        return texte

    def _appel_gemini(self, modele: str, prompt: str) -> dict:
        response = httpx.post(
            f"{settings.GEMINI_API_URL}/models/{modele}:generateContent",
            headers={"x-goog-api-key": settings.GEMINI_API_KEY or ""},
            json={
                "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.4,
                    "maxOutputTokens": 4096,
                    "responseMimeType": "application/json",
                    "responseSchema": RESPONSE_SCHEMA,
                    "thinkingConfig": {"thinkingLevel": "low"},
                },
            },
            timeout=settings.GEMINI_TIMEOUT_SECONDS,
        )
        if response.status_code >= 400:
            message = response.json().get("error", {}).get("message", "") if response.content else ""
            logger.warning("Gemini %s -> HTTP %s : %s", modele, response.status_code, message[:200])
        response.raise_for_status()
        parts = response.json()["candidates"][0]["content"]["parts"]
        return json.loads("".join(p.get("text", "") for p in parts if not p.get("thought")))

    # ---- Local fallback ------------------------------------------------
    def _analyse_locale(self, meteo: MeteoActuelle, ind: IndicateursEnergie, question: str | None) -> dict:
        valeurs = {m.classe: m.valeur for m in meteo.mesures}
        nuages = valeurs.get("CouvertureNuageuse", 0)
        temperature = valeurs.get("Temperature", 20)
        pluie = sum(p.precipitation or 0 for p in meteo.previsions)

        score = min(100, round(ind.irradiation24hKWhM2 / 6.5 * 80 + min(ind.heuresVentProductif, 24) / 24 * 20))
        potentiel = "Élevé" if score >= 65 else "Moyen" if score >= 40 else "Faible"

        solaire = [f"Irradiation prévue sur 24 h : {ind.irradiation24hKWhM2} kWh/m² ({ind.heuresEnsoleillees} h au-dessus de 200 W/m²)."]
        if nuages >= 70:
            solaire.append(f"Ciel très couvert ({nuages:.0f} %) : production photovoltaïque fortement réduite.")
        if temperature > 35:
            solaire.append(f"Forte chaleur ({temperature} °C) : le rendement des panneaux baisse d'environ 0,4 % par °C.")
        if pluie > 0:
            solaire.append(f"{pluie:.1f} mm de pluie prévus : baisse ponctuelle, mais nettoyage naturel des panneaux.")

        eolien = [f"Vent moyen {ind.ventMoyen} m/s, max {ind.ventMax} m/s ; {ind.heuresVentProductif} h dans la plage productive (3-25 m/s)."]
        if ind.ventMax > VENT_ARRET:
            eolien.append("Rafales au-delà de 25 m/s : arrêt de sécurité des éoliennes probable.")
        elif ind.ventMoyen < VENT_DEMARRAGE:
            eolien.append("Vent trop faible pour une production éolienne significative.")

        conseils = []
        if potentiel == "Élevé":
            conseils.append("Programmez les appareils énergivores (pompe, lave-linge, climatisation) autour du pic solaire.")
            conseils.append("Chargez les batteries au maximum pendant la journée.")
        else:
            conseils.append("Préservez la charge des batteries et décalez les usages non essentiels.")
            conseils.append("Prévoyez un appoint réseau pendant les heures de faible production.")
        if temperature > 35:
            conseils.append("Vérifiez la ventilation des onduleurs pour éviter la surchauffe.")
        if ind.ventMax > 20:
            conseils.append("Contrôlez les fixations des panneaux et l'état des éoliennes.")
        if pluie == 0 and nuages < 30:
            conseils.append("Temps sec : surveillez l'empoussièrement des panneaux.")

        return {
            "potentiel": potentiel,
            "score": score,
            "resume": f"Potentiel énergétique {potentiel.lower()} à {meteo.villeNom} pour les prochaines 24 h (analyse automatique).",
            "impactsSolaire": solaire,
            "impactsEolien": eolien,
            "conseils": conseils,
            "meilleurCreneau": f"Autour de {ind.heurePic}" if ind.heurePic else None,
            "reponse": "L'assistant IA est indisponible : réponse détaillée impossible pour le moment." if question else None,
        }

    # ---- Entry point ---------------------------------------------------
    def analyser(self, ville_id: str, question: str | None = None) -> AnalyseAssistant:
        meteo = self.meteo.meteo_actuelle(ville_id)
        ind = self.indicateurs(meteo)
        question = question.strip() if question else None

        if settings.GEMINI_API_KEY:
            prompt = self._prompt(meteo, ind, question)
            modeles = list(dict.fromkeys([*settings.GEMINI_MODELS, *MODELES_ALIAS]))
            for index, modele in enumerate(modeles):
                try:
                    data = self._appel_gemini(modele, prompt)
                    data["score"] = max(0, min(100, int(data.get("score", 0))))
                    data["potentiel"] = POTENTIELS.get(str(data.get("potentiel", "")).strip().lower(), "Moyen")
                    return AnalyseAssistant(**data, modele=modele, secours=index > 0, indicateurs=ind)
                except (httpx.HTTPError, KeyError, IndexError, ValueError, TypeError) as exc:
                    logger.warning("Gemini %s indisponible : %s", modele, type(exc).__name__)

        return AnalyseAssistant(
            **self._analyse_locale(meteo, ind, question), modele="analyse-locale", secours=True, indicateurs=ind
        )
