"""Business logic for the ConditionMeteo module.

* Live weather is fetched server-side from Open-Meteo using the coordinates
  stored in Fuseki for the selected solarx:Ville.
* Saved measurements are individuals of the ConditionMeteo sub-classes, linked
  to their Ville with ``solarx:situeDans`` and described with the existing
  ``valeur`` / ``unite`` / ``dateMesure`` properties plus ``sourceDonnees`` and
  ``dateRecuperation``.
"""

from datetime import date, datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.meteo import (
    Alerte,
    EnregistrementResultat,
    MesureEnregistree,
    MesureValeur,
    MeteoActuelle,
    Prevision,
    Releve,
    SuppressionResultat,
)
from app.services.fuseki import (
    FusekiClient,
    datetime_literal,
    decimal_literal,
    iri,
    local_name,
    string_literal,
)
from app.services.localisation_service import LocalisationService

SOURCE_OPEN_METEO = "Open-Meteo"

# Ontology class -> Open-Meteo variable, unit stored in solarx:unite, UI label
VARIABLES: dict[str, tuple[str, str, str]] = {
    "Temperature": ("temperature_2m", "°C", "Température"),
    "Ensoleillement": ("shortwave_radiation", "W/m²", "Rayonnement solaire"),
    "Precipitation": ("precipitation", "mm", "Précipitations"),
    "VitesseVent": ("wind_speed_10m", "m/s", "Vitesse du vent"),
    "Humidite": ("relative_humidity_2m", "%", "Humidité relative"),
    "CouvertureNuageuse": ("cloud_cover", "%", "Couverture nuageuse"),
}

SEUIL_CHALEUR = 40.0  # °C
SEUIL_VENT = 25.0  # m/s
SEUIL_ENSOLEILLEMENT = 200.0  # W/m²


def evaluer_alertes(
    mesures: dict[str, float],
    ville: str,
    ville_nom: str,
    date_mesure: str | None,
    est_jour: bool | None = None,
) -> list[Alerte]:
    """Apply the SolarX weather thresholds to one set of measurements."""
    commun = {"ville": ville, "villeNom": ville_nom, "dateMesure": date_mesure}
    alertes: list[Alerte] = []

    temperature = mesures.get("Temperature")
    if temperature is not None and temperature > SEUIL_CHALEUR:
        alertes.append(Alerte(
            type="CHALEUR_EXTREME", niveau="critical", gravite="Critique",
            titre="Chaleur extrême",
            message=f"{temperature:.1f} °C à {ville_nom} (> {SEUIL_CHALEUR:.0f} °C) : baisse du rendement des panneaux et risque de surchauffe des onduleurs.",
            valeur=temperature, unite="°C", seuil=SEUIL_CHALEUR, **commun,
        ))

    vent = mesures.get("VitesseVent")
    if vent is not None and vent > SEUIL_VENT:
        alertes.append(Alerte(
            type="VENT_FORT", niveau="critical", gravite="Critique",
            titre="Vent fort",
            message=f"{vent:.1f} m/s à {ville_nom} (> {SEUIL_VENT:.0f} m/s) : seuil d'arrêt des éoliennes, vérifier les fixations des panneaux.",
            valeur=vent, unite="m/s", seuil=SEUIL_VENT, **commun,
        ))

    rayonnement = mesures.get("Ensoleillement")
    # At night radiation is always ~0: not a meaningful alert.
    if rayonnement is not None and rayonnement < SEUIL_ENSOLEILLEMENT and est_jour is not False:
        alertes.append(Alerte(
            type="FAIBLE_ENSOLEILLEMENT", niveau="warning", gravite="Modérée",
            titre="Faible ensoleillement",
            message=f"{rayonnement:.0f} W/m² à {ville_nom} (< {SEUIL_ENSOLEILLEMENT:.0f} W/m²) : production solaire réduite.",
            valeur=rayonnement, unite="W/m²", seuil=SEUIL_ENSOLEILLEMENT, **commun,
        ))
    return alertes


def _ordre_niveau(alerte: Alerte) -> int:
    return {"critical": 0, "warning": 1}.get(alerte.niveau, 2)


class MeteoService:
    def __init__(self, fuseki: FusekiClient) -> None:
        self.fuseki = fuseki
        self.localisation = LocalisationService(fuseki)

    # ---- Open-Meteo ----------------------------------------------------
    def _appel_open_meteo(self, latitude: float, longitude: float) -> dict:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": ",".join([v[0] for v in VARIABLES.values()] + ["is_day"]),
            "hourly": "temperature_2m,shortwave_radiation,wind_speed_10m,precipitation",
            "forecast_hours": 24,
            "wind_speed_unit": "ms",
            "timezone": "auto",
        }
        try:
            response = httpx.get(settings.OPEN_METEO_URL, params=params, timeout=15.0)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY, f"Open-Meteo indisponible : {exc}"
            ) from exc
        return response.json()

    def meteo_actuelle(self, ville_id: str) -> MeteoActuelle:
        ville = self.localisation.get_ville(ville_id)
        if ville.latitude is None or ville.longitude is None:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                f"La ville {ville.nom} n'a pas de coordonnées dans l'ontologie.",
            )
        data = self._appel_open_meteo(ville.latitude, ville.longitude)
        current = data.get("current", {})

        mesures = [
            MesureValeur(classe=classe, label=label, valeur=float(current[var]), unite=unite)
            for classe, (var, unite, label) in VARIABLES.items()
            if current.get(var) is not None
        ]
        # Open-Meteo returns local time without seconds (e.g. 2026-10-30T14:00).
        date_mesure = f"{current['time']}:00" if len(current.get("time", "")) == 16 else current.get("time", "")
        est_jour = bool(current["is_day"]) if "is_day" in current else None

        hourly = data.get("hourly", {})

        def serie(name: str, i: int) -> float | None:
            values = hourly.get(name) or []
            return values[i] if i < len(values) else None

        previsions = [
            Prevision(
                time=t,
                temperature=serie("temperature_2m", i),
                rayonnement=serie("shortwave_radiation", i),
                vent=serie("wind_speed_10m", i),
                precipitation=serie("precipitation", i),
            )
            for i, t in enumerate(hourly.get("time", []))
        ]

        alertes = evaluer_alertes(
            {m.classe: m.valeur for m in mesures}, ville.id, ville.nom, date_mesure, est_jour
        )
        return MeteoActuelle(
            ville=ville.id,
            villeNom=ville.nom,
            latitude=ville.latitude,
            longitude=ville.longitude,
            source=SOURCE_OPEN_METEO,
            timezone=data.get("timezone"),
            dateMesure=date_mesure,
            dateRecuperation=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            estJour=est_jour,
            mesures=mesures,
            alertes=alertes,
            previsions=previsions,
        )

    # ---- Persistence in Fuseki ----------------------------------------
    def consulter(self, ville_id: str) -> MeteoActuelle:
        """Fetch the current weather and store it automatically in the ontology."""
        meteo = self.meteo_actuelle(ville_id)
        meteo.enregistrement = self.enregistrer(ville_id, meteo)
        return meteo

    def _mesures_du_jour(self, ville_id: str, jour: str) -> str:
        """SPARQL pattern matching Open-Meteo measurements of a city on a given day."""
        lendemain = (date.fromisoformat(jour) + timedelta(days=1)).isoformat()
        return f"""?m solarx:situeDans {iri(ville_id)} ; solarx:sourceDonnees {string_literal(SOURCE_OPEN_METEO)} ;
                   solarx:dateMesure ?d .
                FILTER(?d >= {datetime_literal(f'{jour}T00:00:00')} && ?d < {datetime_literal(f'{lendemain}T00:00:00')})"""

    def enregistrer(self, ville_id: str, meteo: MeteoActuelle | None = None) -> EnregistrementResultat:
        """Store the weather of a city at most once per day (the first consultation of the day)."""
        # Values always come from a server-side Open-Meteo call, never from the client.
        meteo = meteo or self.meteo_actuelle(ville_id)
        jour = meteo.dateMesure[:10]
        du_jour = self._mesures_du_jour(ville_id, jour)

        existantes = [
            local_name(r["m"]) for r in self.fuseki.select(f"SELECT DISTINCT ?m WHERE {{ {du_jour} }}")
        ]
        if existantes:
            return EnregistrementResultat(
                ville=ville_id, dateMesure=meteo.dateMesure, enregistrees=[], dejaPresentes=existantes, verifiees=0
            )

        suffixe = jour.replace("-", "")  # 20261030
        nouvelles = [f"{mesure.classe}_{ville_id}_{suffixe}" for mesure in meteo.mesures]
        triples = "\n".join(
            f"""{iri(mesure_id)} a owl:NamedIndividual, {iri(mesure.classe)} ;
                  solarx:situeDans {iri(ville_id)} ;
                  solarx:valeur {decimal_literal(mesure.valeur)} ;
                  solarx:unite {string_literal(mesure.unite)} ;
                  solarx:dateMesure {datetime_literal(meteo.dateMesure)} ;
                  solarx:dateRecuperation {datetime_literal(meteo.dateRecuperation)} ;
                  solarx:sourceDonnees {string_literal(SOURCE_OPEN_METEO)} ."""
            for mesure_id, mesure in zip(nouvelles, meteo.mesures)
        )
        # Single conditional insert: two simultaneous consultations cannot both store the day.
        self.fuseki.update(f"INSERT {{ {triples} }} WHERE {{ FILTER NOT EXISTS {{ {du_jour} }} }}")

        verifiees = 0
        if nouvelles:
            values = " ".join(iri(m) for m in nouvelles)
            rows = self.fuseki.select(
                f"""
                SELECT (COUNT(DISTINCT ?m) AS ?n) WHERE {{
                  VALUES ?m {{ {values} }}
                  ?m solarx:situeDans {iri(ville_id)} ; solarx:valeur ?v ; solarx:unite ?u ;
                     solarx:dateMesure ?d ; solarx:sourceDonnees ?s .
                }}
                """
            )
            verifiees = int(rows[0]["n"]) if rows else 0
            if verifiees != len(nouvelles):
                raise HTTPException(
                    status.HTTP_500_INTERNAL_SERVER_ERROR,
                    f"Vérification Fuseki échouée : {verifiees}/{len(nouvelles)} mesures retrouvées.",
                )
        return EnregistrementResultat(
            ville=ville_id,
            dateMesure=meteo.dateMesure,
            enregistrees=nouvelles,
            dejaPresentes=existantes,
            verifiees=verifiees,
        )

    def lister_mesures(self, ville_id: str) -> list[MesureEnregistree]:
        self.localisation.get_ville(ville_id)
        rows = self.fuseki.select(
            f"""
            SELECT ?m ?classe ?valeur ?unite ?date ?source ?recup ?supprimable WHERE {{
              ?m solarx:situeDans {iri(ville_id)} ; a ?classe ; solarx:valeur ?valeur .
              ?classe rdfs:subClassOf solarx:ConditionMeteo .
              OPTIONAL {{ ?m solarx:unite ?unite }}
              OPTIONAL {{ ?m solarx:dateMesure ?date }}
              OPTIONAL {{ ?m solarx:sourceDonnees ?source }}
              OPTIONAL {{ ?m solarx:dateRecuperation ?recup }}
              BIND(NOT EXISTS {{ ?m ?p ?o . FILTER(isIRI(?o) && ?p NOT IN (rdf:type, solarx:situeDans)) }}
                   && NOT EXISTS {{ ?x ?p2 ?m }} AS ?supprimable)
            }}
            ORDER BY DESC(?date) ?classe
            """
        )
        return [
            MesureEnregistree(
                id=local_name(r["m"]),
                classe=local_name(r["classe"]),
                valeur=float(r["valeur"]),
                unite=r.get("unite"),
                dateMesure=r.get("date"),
                source=r.get("source"),
                dateRecuperation=r.get("recup"),
                supprimable=r.get("supprimable") in ("true", "1"),
            )
            for r in rows
        ]

    def supprimer_mesure(self, mesure_id: str) -> SuppressionResultat:
        mesure = iri(mesure_id)
        if not self.fuseki.ask(f"ASK {{ {mesure} a/rdfs:subClassOf solarx:ConditionMeteo }}"):
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Mesure météo introuvable : {mesure_id}")
        protegee = self.fuseki.ask(
            f"""ASK {{
              {{ {mesure} ?p ?o . FILTER(isIRI(?o) && ?p NOT IN (rdf:type, solarx:situeDans)) }}
              UNION {{ ?x ?p2 {mesure} }}
            }}"""
        )
        if protegee:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "Cette mesure est reliée à d'autres éléments (installation, capteur...) : suppression refusée.",
            )
        self.fuseki.update(f"DELETE WHERE {{ {mesure} ?p ?o }}")
        return SuppressionResultat(supprimees=[mesure_id])

    def supprimer_releve(self, ville_id: str, date_mesure: str | None) -> SuppressionResultat:
        """Delete every deletable measurement of a city (optionally one dateMesure only)."""
        mesures = self.lister_mesures(ville_id)
        if date_mesure:
            datetime_literal(date_mesure)
            mesures = [m for m in mesures if m.dateMesure == date_mesure]
        supprimables = [m.id for m in mesures if m.supprimable]
        protegees = [m.id for m in mesures if not m.supprimable]
        if supprimables:
            self.fuseki.update(
                " ;\n".join(f"DELETE WHERE {{ {iri(m)} ?p ?o }}" for m in supprimables)
            )
        return SuppressionResultat(supprimees=supprimables, protegees=protegees)

    # ---- History -------------------------------------------------------
    def historique(
        self,
        debut: str,
        fin: str,
        ville_id: str | None = None,
        source: str | None = SOURCE_OPEN_METEO,
        un_par_jour: bool = True,
    ) -> list[Releve]:
        """Measurements stored between two days (YYYY-MM-DD, inclusive), grouped per city and dateMesure."""
        try:
            date.fromisoformat(debut)
            fin_exclue = (date.fromisoformat(fin) + timedelta(days=1)).isoformat()
        except ValueError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Date invalide (format YYYY-MM-DD)") from exc
        filtres = [
            f"FILTER(?date >= {datetime_literal(f'{debut}T00:00:00')} && ?date < {datetime_literal(f'{fin_exclue}T00:00:00')})"
        ]
        if ville_id:
            filtres.append(f"FILTER(?ville = {iri(ville_id)})")
        if source:
            filtres.append(f"FILTER(?source = {string_literal(source)})")
        rows = self.fuseki.select(
            f"""
            SELECT ?m ?ville ?villeNom ?regionNom ?classe ?valeur ?unite ?date ?source ?recup ?supprimable WHERE {{
              ?m a ?classe ; solarx:situeDans ?ville ; solarx:valeur ?valeur ; solarx:dateMesure ?date .
              ?classe rdfs:subClassOf solarx:ConditionMeteo .
              ?ville a solarx:Ville .
              OPTIONAL {{ ?ville solarx:nom ?villeNom }}
              OPTIONAL {{ ?ville solarx:situeDans ?region . ?region a solarx:Region ; solarx:nom ?regionNom }}
              OPTIONAL {{ ?m solarx:unite ?unite }}
              OPTIONAL {{ ?m solarx:sourceDonnees ?source }}
              OPTIONAL {{ ?m solarx:dateRecuperation ?recup }}
              {" ".join(filtres)}
              BIND(NOT EXISTS {{ ?m ?p ?o . FILTER(isIRI(?o) && ?p NOT IN (rdf:type, solarx:situeDans)) }}
                   && NOT EXISTS {{ ?x ?p2 ?m }} AS ?supprimable)
            }}
            ORDER BY DESC(?date) ?villeNom ?classe
            """
        )
        releves: dict[tuple[str, str], Releve] = {}
        for r in rows:
            ville = local_name(r["ville"])
            releve = releves.setdefault(
                (ville, r["date"]),
                Releve(
                    ville=ville,
                    villeNom=r.get("villeNom") or ville,
                    regionNom=r.get("regionNom"),
                    dateMesure=r["date"],
                    dateRecuperation=r.get("recup"),
                    source=r.get("source"),
                    mesures=[],
                    alertes=[],
                    supprimable=True,
                ),
            )
            if any(m.id == local_name(r["m"]) for m in releve.mesures):
                continue
            mesure = MesureEnregistree(
                id=local_name(r["m"]),
                classe=local_name(r["classe"]),
                valeur=float(r["valeur"]),
                unite=r.get("unite"),
                dateMesure=r["date"],
                source=r.get("source"),
                dateRecuperation=r.get("recup"),
                supprimable=r.get("supprimable") in ("true", "1"),
            )
            releve.mesures.append(mesure)
            releve.supprimable = releve.supprimable and mesure.supprimable

        for releve in releves.values():
            est_jour = 7 <= int(releve.dateMesure[11:13]) < 18
            releve.alertes = evaluer_alertes(
                {m.classe: m.valeur for m in releve.mesures},
                releve.ville, releve.villeNom, releve.dateMesure, est_jour,
            )
        # One entry per city and per day: the first stored consultation of the day.
        if not un_par_jour:
            return list(releves.values())
        par_jour: dict[tuple[str, str], Releve] = {}
        for releve in sorted(releves.values(), key=lambda r: r.dateMesure):
            par_jour.setdefault((releve.ville, releve.dateMesure[:10]), releve)
        return sorted(par_jour.values(), key=lambda r: r.dateMesure, reverse=True)

    def supprimer_jour(
        self, jour: str, ville_id: str | None = None, source: str | None = SOURCE_OPEN_METEO
    ) -> SuppressionResultat:
        mesures = [m for r in self.historique(jour, jour, ville_id, source, un_par_jour=False) for m in r.mesures]
        supprimables = [m.id for m in mesures if m.supprimable]
        if supprimables:
            self.fuseki.update(
                " ;\n".join(f"DELETE WHERE {{ {iri(m)} ?p ?o }}" for m in supprimables)
            )
        return SuppressionResultat(
            supprimees=supprimables, protegees=[m.id for m in mesures if not m.supprimable]
        )

    # ---- Alerts --------------------------------------------------------
    def alertes(self) -> list[Alerte]:
        """Alerts computed from the latest measurement of each type stored for each city."""
        rows = self.fuseki.select(
            """
            SELECT ?ville ?villeNom ?classe ?valeur ?date WHERE {
              ?ville a solarx:Ville .
              OPTIONAL { ?ville solarx:nom ?villeNom }
              VALUES ?classe { solarx:Temperature solarx:VitesseVent solarx:Ensoleillement }
              ?m a ?classe ; solarx:situeDans ?ville ; solarx:valeur ?valeur ; solarx:dateMesure ?date .
              FILTER NOT EXISTS {
                ?m2 a ?classe ; solarx:situeDans ?ville ; solarx:dateMesure ?d2 .
                FILTER(?d2 > ?date)
              }
            }
            """
        )
        par_ville: dict[str, dict] = {}
        for r in rows:
            ville_id = local_name(r["ville"])
            entree = par_ville.setdefault(
                ville_id, {"nom": r.get("villeNom") or ville_id, "mesures": {}, "dates": {}}
            )
            classe = local_name(r["classe"])
            entree["mesures"][classe] = float(r["valeur"])
            entree["dates"][classe] = r["date"]

        alertes: list[Alerte] = []
        for ville_id, entree in par_ville.items():
            date_soleil = entree["dates"].get("Ensoleillement")
            # dateMesure is Open-Meteo local time: approximate daylight as 07:00-18:00.
            est_jour = 7 <= int(date_soleil[11:13]) < 18 if date_soleil else None
            for alerte in evaluer_alertes(entree["mesures"], ville_id, entree["nom"], None, est_jour):
                classe = {"CHALEUR_EXTREME": "Temperature", "VENT_FORT": "VitesseVent"}.get(
                    alerte.type, "Ensoleillement"
                )
                alerte.dateMesure = entree["dates"].get(classe)
                alertes.append(alerte)
        alertes.sort(key=lambda a: a.dateMesure or "", reverse=True)
        alertes.sort(key=_ordre_niveau)
        return alertes
