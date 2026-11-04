"""Run the real SPARQL of the services against an in-memory RDFLib copy of the ontology."""

from pathlib import Path

import pytest
from fastapi import HTTPException
from rdflib import Dataset, Graph

from app.schemas.localisation import VilleCreate, VilleUpdate
from app.services.fuseki import PREFIXES
from app.services.localisation_service import LocalisationService
from app.services.meteo_service import MeteoService

OWL_FILE = Path(__file__).resolve().parents[2] / "database" / "solarx.owl"

OPEN_METEO_FAKE = {
    "timezone": "Africa/Tunis",
    "current": {
        "time": "2026-10-30T13:00", "temperature_2m": 21.5, "shortwave_radiation": 345.0,
        "precipitation": 0.2, "wind_speed_10m": 1.5, "relative_humidity_2m": 65,
        "cloud_cover": 98, "is_day": 1,
    },
    "hourly": {"time": ["2026-10-30T13:00"], "temperature_2m": [21.5], "shortwave_radiation": [345.0],
               "wind_speed_10m": [1.5], "precipitation": [0.2]},
}


class RdflibClient:
    def __init__(self, graph: Graph) -> None:
        self.graph = graph

    def select(self, query: str) -> list[dict[str, str]]:
        return [{k: str(v) for k, v in row.asdict().items()} for row in self.graph.query(PREFIXES + query)]

    def ask(self, query: str) -> bool:
        return bool(self.graph.query(PREFIXES + query).askAnswer)

    def update(self, update: str) -> None:
        self.graph.update(PREFIXES + update)


@pytest.fixture
def client() -> RdflibClient:
    return RdflibClient(Graph().parse(OWL_FILE, format="xml"))


@pytest.fixture
def meteo(client, monkeypatch) -> MeteoService:
    service = MeteoService(client)
    monkeypatch.setattr(service, "_appel_open_meteo", lambda lat, lon: OPEN_METEO_FAKE)
    return service


def test_villes_recherche_et_filtre(client):
    service = LocalisationService(client)
    villes = {v.id: v for v in service.list_villes()}
    assert len(villes) == 13
    assert villes["Tunis"].region == "Nord_Tunisie" and villes["Tunis"].nbLiens >= 3
    assert [v.id for v in service.list_villes(q="sf")] == ["Sfax"]
    assert {v.id for v in service.list_villes(region="Sud_Tunisie")} == {"Djerba", "Gabes", "Gafsa", "Tozeur"}
    assert {r.id for r in service.list_regions()} == {
        "Nord_Tunisie", "Centre_Tunisie", "Sud_Tunisie", "Nord_Ouest_Tunisie", "Sud_Est_Tunisie"
    }


def test_crud_ville(client):
    service = LocalisationService(client)
    ville = service.create_ville(VilleCreate(nom="Sidi Bouzid", region="Centre_Tunisie", latitude=35.04, longitude=9.48))
    assert ville.id == "Sidi_Bouzid" and ville.regionNom == "Centre tunisien"
    with pytest.raises(HTTPException) as exc:
        service.create_ville(VilleCreate(nom="Sidi Bouzid", region="Centre_Tunisie", latitude=35, longitude=9))
    assert exc.value.status_code == 409

    ville = service.update_ville("Sidi_Bouzid", VilleUpdate(nom="Sidi Bouzid Ville", region="Sud_Tunisie", latitude=35.1, longitude=9.5))
    assert (ville.id, ville.nom, ville.region, ville.latitude) == ("Sidi_Bouzid", "Sidi Bouzid Ville", "Sud_Tunisie", 35.1)

    service.delete_ville("Sidi_Bouzid")
    assert not client.ask("ASK { solarx:Sidi_Bouzid ?p ?o }")


def test_suppression_ville_protegee(client):
    with pytest.raises(HTTPException) as exc:
        LocalisationService(client).delete_ville("Tunis")
    assert exc.value.status_code == 409
    assert "Batterie_02" in exc.value.detail["dependances"]


def test_enregistrer_lister_supprimer_mesures(client, meteo):
    resultat = meteo.enregistrer("Sfax")
    assert len(resultat.enregistrees) == 6 and resultat.verifiees == 6
    assert "Temperature_Sfax_20261030" in resultat.enregistrees
    assert sorted(meteo.enregistrer("Sfax").dejaPresentes) == sorted(resultat.enregistrees)

    mesures = meteo.lister_mesures("Sfax")
    assert len(mesures) == 6 and all(m.supprimable and m.source == "Open-Meteo" for m in mesures)

    with pytest.raises(HTTPException) as exc:
        LocalisationService(client).delete_ville("Sfax")
    assert exc.value.detail["requiresCascade"] is True

    assert meteo.supprimer_mesure("Temperature_Sfax_20261030").supprimees
    suppression = meteo.supprimer_releve("Sfax", "2026-10-30T13:00:00")
    assert len(suppression.supprimees) == 5
    assert meteo.lister_mesures("Sfax") == []


def test_une_seule_fois_par_ville_et_par_jour(client, monkeypatch):
    service = MeteoService(client)
    reponses = {}
    monkeypatch.setattr(service, "_appel_open_meteo", lambda lat, lon: reponses["courante"])

    def a(heure: str) -> dict:
        return {**OPEN_METEO_FAKE, "current": {**OPEN_METEO_FAKE["current"], "time": heure}}

    reponses["courante"] = a("2026-10-30T09:00")
    assert len(service.consulter("Gafsa").enregistrement.enregistrees) == 6
    reponses["courante"] = a("2026-10-30T17:30")
    second = service.consulter("Gafsa").enregistrement
    assert second.enregistrees == [] and len(second.dejaPresentes) == 6
    reponses["courante"] = a("2026-10-31T08:00")
    assert len(service.consulter("Gafsa").enregistrement.enregistrees) == 6

    releves = service.historique("2026-10-30", "2026-10-31", "Gafsa")
    assert [r.dateMesure for r in releves] == ["2026-10-31T08:00:00", "2026-10-30T09:00:00"]


def test_nouveaux_releves_de_demonstration(meteo):
    assert meteo.historique("2026-11-03", "2026-11-03") == []
    releves = meteo.historique("2026-11-03", "2026-11-03", source=None)
    assert {releve.ville for releve in releves} == {"Beja", "Monastir", "Tataouine"}
    assert all(len(releve.mesures) == 6 for releve in releves)
    assert all(releve.source == "Données de démonstration" for releve in releves)
    assert all(releve.dateMesure == "2026-11-03T12:00:00" for releve in releves)


def test_mesure_liee_a_une_installation_protegee(meteo):
    with pytest.raises(HTTPException) as exc:
        meteo.supprimer_mesure("Temperature_Djerba")
    assert exc.value.status_code == 409


def test_consulter_enregistre_automatiquement_et_historique(meteo):
    resultat = meteo.consulter("Sousse")
    assert len(resultat.enregistrement.enregistrees) == 6
    assert meteo.consulter("Sousse").enregistrement.dejaPresentes

    releves = meteo.historique("2026-10-30", "2026-10-30")
    assert [(r.ville, r.dateMesure, len(r.mesures)) for r in releves] == [("Sousse", "2026-10-30T13:00:00", 6)]
    assert releves[0].supprimable and releves[0].regionNom == "Centre tunisien"
    assert meteo.historique("2026-10-29", "2026-10-29") == []  # demo data hidden by default
    demo = meteo.historique("2026-10-29", "2026-10-29", source=None)
    assert any(r.ville == "Bizerte" and r.alertes for r in demo)

    assert len(meteo.supprimer_jour("2026-10-30").supprimees) == 6
    assert meteo.historique("2026-10-30", "2026-10-30") == []


def test_historique_apres_restauration_schema_meteo(client, meteo):
    from rdflib import Namespace, RDFS
    from scripts.load_ontology import meteo_schema

    solarx = Namespace("http://www.semanticweb.org/monta/ontologies/2026/10/SolarX#")
    schema = meteo_schema(client.graph)
    meteo.consulter("Sousse")
    for classe in list(client.graph.subjects(RDFS.subClassOf, solarx.ConditionMeteo)):
        client.graph.remove((classe, RDFS.subClassOf, solarx.ConditionMeteo))
    assert meteo.historique("2026-10-30", "2026-10-30") == []

    client.graph += schema
    releves = meteo.historique("2026-10-30", "2026-10-30")
    assert len(releves) == 1
    assert releves[0].ville == "Sousse"
    assert len(releves[0].mesures) == 6
    assert not list(schema.subjects(None, solarx.Sousse))


def test_initialisation_base_neuve_et_historique(monkeypatch):
    from app.services.semantic_bootstrap import initialise_module_data

    monkeypatch.setattr("rdflib.plugins.sparql.SPARQL_DEFAULT_GRAPH_UNION", False)
    client = RdflibClient(Dataset())
    initialise_module_data(client)
    service = LocalisationService(client)
    assert len(service.list_regions()) == 5
    assert len(service.list_villes()) == 13
    meteo = MeteoService(client)
    monkeypatch.setattr(meteo, "_appel_open_meteo", lambda lat, lon: OPEN_METEO_FAKE)
    assert len(meteo.consulter("Sousse").enregistrement.enregistrees) == 6
    assert len(meteo.historique("2026-10-30", "2026-10-30")) == 1


def test_redemarrage_preserve_crud_et_historique(monkeypatch):
    from app.services.semantic_bootstrap import initialise_module_data

    monkeypatch.setattr("rdflib.plugins.sparql.SPARQL_DEFAULT_GRAPH_UNION", False)
    client = RdflibClient(Dataset())
    initialise_module_data(client)
    service = LocalisationService(client)
    service.delete_ville("Bizerte")
    service.update_ville("Tunis", VilleUpdate(nom="Tunis modifiee", region="Nord_Tunisie", latitude=36.81, longitude=10.19))
    meteo = MeteoService(client)
    monkeypatch.setattr(meteo, "_appel_open_meteo", lambda lat, lon: OPEN_METEO_FAKE)
    meteo.consulter("Sousse")
    count = len(client.graph)
    initialise_module_data(client)
    assert len(client.graph) == count
    assert "Bizerte" not in {ville.id for ville in service.list_villes()}
    assert service.get_ville("Tunis").nom == "Tunis modifiee"
    assert len(meteo.historique("2026-10-30", "2026-10-30")) == 1


def test_geocodage_inverse_region_la_plus_proche(client, monkeypatch):
    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"display_name": "Monastir, Tunisie", "address": {"city": "Monastir"}}

    monkeypatch.setattr("app.services.localisation_service.httpx.get", lambda *a, **k: FakeResponse())
    geo = LocalisationService(client).geocodage_inverse(35.7643, 10.8113)
    assert (geo.nom, geo.villeProche, geo.regionSuggeree, geo.villeExistante) == ("Monastir", "Monastir", "Centre_Tunisie", "Monastir")


def test_alertes_depuis_ontologie(meteo):
    alertes = {(a.ville, a.type) for a in meteo.alertes()}
    assert ("Tozeur", "CHALEUR_EXTREME") in alertes
    assert ("Bizerte", "VENT_FORT") in alertes
    assert ("Bizerte", "FAIBLE_ENSOLEILLEMENT") in alertes
