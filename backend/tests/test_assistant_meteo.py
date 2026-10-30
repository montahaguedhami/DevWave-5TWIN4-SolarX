"""AI weather assistant: Gemini model fallback chain and local analysis (no network)."""

from pathlib import Path

import httpx
import pytest
from rdflib import Graph

from app.core.config import settings
from app.services.assistant_meteo_service import AssistantMeteoService
from tests.test_services_sparql import RdflibClient

OWL_FILE = Path(__file__).resolve().parents[2] / "database" / "solarx.owl"

HEURES = [f"2026-10-30T{h:02d}:00" for h in range(24)]
RAYONNEMENT = [0] * 7 + [100, 300, 500, 700, 800, 850, 800, 700, 500, 300, 100] + [0] * 6
OPEN_METEO_FAKE = {
    "timezone": "Africa/Tunis",
    "current": {
        "time": "2026-10-30T12:00", "temperature_2m": 26.0, "shortwave_radiation": 850.0,
        "precipitation": 0.0, "wind_speed_10m": 8.0, "relative_humidity_2m": 40,
        "cloud_cover": 5, "is_day": 1,
    },
    "hourly": {"time": HEURES, "temperature_2m": [24.0] * 24, "shortwave_radiation": RAYONNEMENT,
               "wind_speed_10m": [8.0] * 24, "precipitation": [0.0] * 24},
}
REPONSE_GEMINI = {
    "potentiel": "Élevé", "score": 140, "resume": "Très bonne journée.",
    "impactsSolaire": ["Fort ensoleillement"], "impactsEolien": ["Vent régulier"],
    "conseils": ["Chargez les batteries"], "meilleurCreneau": "11:00-14:00",
}


@pytest.fixture
def assistant(monkeypatch) -> AssistantMeteoService:
    service = AssistantMeteoService(RdflibClient(Graph().parse(OWL_FILE, format="xml")))
    monkeypatch.setattr(service.meteo, "_appel_open_meteo", lambda lat, lon: OPEN_METEO_FAKE)
    return service


def test_indicateurs_et_production_des_installations_de_la_ville(assistant):
    ind = assistant.indicateurs(assistant.meteo.meteo_actuelle("Djerba"))
    assert ind.irradiation24hKWhM2 == 5.65 and ind.heurePic == "12:00" and ind.heuresVentProductif == 24
    parc = next(i for i in ind.installations if i.nom == "ParcSolaire_Djerba")
    assert parc.type == "CentraleSolaire" and 400 < parc.productionEstimeeKWh < 524


def test_sans_cle_analyse_locale(assistant, monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", None)
    analyse = assistant.analyser("Djerba")
    assert analyse.modele == "analyse-locale" and analyse.secours and analyse.potentiel == "Élevé"
    assert analyse.conseils


def test_modele_de_secours_gemini(assistant, monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test")
    monkeypatch.setattr(settings, "GEMINI_MODELS", ["modele-a", "modele-b"])
    appels = []

    def fake(modele, prompt):
        appels.append(modele)
        if modele == "modele-a":
            raise httpx.HTTPStatusError("503", request=httpx.Request("POST", "x"), response=httpx.Response(503))
        return dict(REPONSE_GEMINI)

    monkeypatch.setattr(assistant, "_appel_gemini", fake)
    analyse = assistant.analyser("Tunis", "Puis-je lancer la pompe ?")
    assert appels == ["modele-a", "modele-b"]
    assert (analyse.modele, analyse.secours, analyse.score) == ("modele-b", True, 100)


def test_tous_les_modeles_echouent(assistant, monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test")
    monkeypatch.setattr(assistant, "_appel_gemini", lambda m, p: (_ for _ in ()).throw(httpx.ConnectError("x")))
    analyse = assistant.analyser("Tunis", "Question ?")
    assert analyse.modele == "analyse-locale" and analyse.reponse
