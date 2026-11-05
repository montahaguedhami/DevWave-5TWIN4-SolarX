"""Lignes + Réseaux : le vrai SPARQL des services, sur une copie RDFLib en mémoire de l'ontologie.

Lancer (depuis backend/) :  pytest tests/test_lignes_reseaux.py -q
"""

import json
from pathlib import Path

import pytest
from fastapi import HTTPException
from rdflib import Graph

from app.api.v1.endpoints.lignes import get_service
from app.main import app
from app.services.fuseki import PREFIXES as SOLARX_PREFIXES
from app.services.lignes_service import LignesService
from app.services.typed_sparql import GraphSparql

OWL_FILE = Path(__file__).resolve().parents[2] / "database" / "solarx.owl"
P2_FILE = OWL_FILE.with_name("p2_stockage_equipement.ttl")


@pytest.fixture(autouse=True)
def date_fixe(monkeypatch):
    # l'état d'une ligne dépend de la date du jour : les tests ne doivent pas changer avec le temps
    monkeypatch.setattr("app.nlp.vocabulary.debut_etat_recent", lambda: "2026-10-06")


@pytest.fixture(scope="module")
def service() -> LignesService:
    return LignesService(GraphSparql(Graph().parse(OWL_FILE, format="xml")))


def ids(items):
    return {i["id"] for i in items}


def test_lister_toutes_les_lignes(service):
    assert ids(service.list_lignes()) == {
        "LigneBasseTension_01", "LigneBasseTension_02", "LigneMoyenneTension_01", "LigneMoyenneTension_02",
        "LigneHauteTension_01", "LigneHauteTension_02", "LigneHauteTension_03"}


def test_filtre_par_type(service):
    assert ids(service.list_lignes("LigneHauteTension")) == {
        "LigneHauteTension_01", "LigneHauteTension_02", "LigneHauteTension_03"}


def test_filtre_par_reseau(service):
    assert ids(service.list_lignes(reseau="ReseauNational_01")) == {"LigneHauteTension_02", "LigneHauteTension_03"}


def test_ligne_en_panne(service):
    # Panne_01 (partie Incident) affecte LigneHauteTension_01
    etats = {l["id"]: l["etat"] for l in service.list_lignes()}
    assert etats["LigneHauteTension_01"] == "En panne"
    assert etats["LigneMoyenneTension_02"] == "Fonctionnel"


def test_stats_agregation(service):
    s = service.stats()
    assert s["nombre"] == 7
    assert s["longueurTotaleKm"] == pytest.approx(2.5 + 1.2 + 12 + 8 + 35 + 150 + 85)
    assert s["lignesEnPanne"] == 1
    # Ecole_Tunis, Maison_Djerba, Ecole_01, Maison_01, Hopital_Tunis, Usine_Tunis
    assert s["consommateursDesservis"] == 6
    par_type = {r["type"]: r for r in s["parType"]}
    assert par_type["LigneHauteTension"]["nombre"] == 3
    assert par_type["LigneHauteTension"]["longueurKm"] == pytest.approx(270)
    assert par_type["LigneHauteTension"]["tensionMaxKV"] == 225


def test_detail_ligne(service):
    d = service.get_ligne("LigneHauteTension_01")
    assert d["tensionKV"] == 90 and d["longueurKm"] == 35
    assert ids(d["dessert"]) == {"Usine_Tunis"}
    assert ids(d["relie"]) == {"ParcEolien_Tunis"}
    assert ids(d["reseaux"]) == {"ReseauTransport_01"}
    assert "Panne_01" in ids(d["incidents"])


def test_etat_selon_les_incidents_recents(service, monkeypatch):
    etats = lambda: {l["id"]: l["etat"] for l in service.list_lignes()}
    # panne le 29 octobre ; surcharge le 19 octobre, mais pas de panne récente
    assert etats()["LigneHauteTension_01"] == "En panne"
    assert etats()["LigneMoyenneTension_01"] == "Alerte"
    assert service.stats()["lignesEnPanne"] == 1
    # plus d'un mois après le dernier incident : l'historique reste, l'état redevient normal
    monkeypatch.setattr("app.nlp.vocabulary.debut_etat_recent", lambda: "2026-12-01")
    assert etats()["LigneHauteTension_01"] == "Fonctionnel"
    assert service.get_ligne("LigneHauteTension_01")["incidents"]
    assert service.stats()["lignesEnPanne"] == 0


def test_incidents_du_plus_recent_au_plus_ancien(service):
    dates = [i["date"] for i in service.get_ligne("LigneHauteTension_01")["incidents"]]
    assert len(dates) > 3 and dates == sorted(dates, reverse=True)


def test_detail_ligne_introuvable(service):
    with pytest.raises(HTTPException) as e:
        service.get_ligne("Batterie_01")
    assert e.value.status_code == 404


def test_identifiant_invalide(service):
    with pytest.raises(HTTPException) as e:
        service.get_ligne("x } DROP ALL")
    assert e.value.status_code == 400


def test_lister_reseaux(service):
    r = {x["id"]: x for x in service.list_reseaux()}
    assert set(r) == {"ReseauDistribution_01", "ReseauNational_01", "ReseauTransport_01"}
    assert r["ReseauDistribution_01"]["nombreLignes"] == 4
    assert r["ReseauDistribution_01"]["longueurTotaleKm"] == pytest.approx(2.5 + 12 + 8 + 1.2)
    assert r["ReseauDistribution_01"]["consommateursDesservis"] == 5
    assert r["ReseauNational_01"]["longueurTotaleKm"] == pytest.approx(235)


def test_detail_reseau_et_flux(service):
    d = service.get_reseau("ReseauTransport_01")
    assert ids(d["lignes"]) == {"LigneHauteTension_01"}
    assert {"installation": "ParcEolien_Tunis", "ligne": "LigneHauteTension_01",
            "consommateur": "Usine_Tunis"} in d["flux"]


def test_stats_reseaux_sans_double_comptage(service):
    s = service.stats_reseaux()
    assert s == {"nombre": 3, "lignes": 7, "longueurTotaleKm": pytest.approx(293.7), "consommateursDesservis": 6}


def test_lieu_des_extremites(service):
    # ville et coordonnées (partie Localisation) des installations et consommateurs, pour la carte
    d = service.get_ligne("LigneBasseTension_01")
    lieux = {c["id"]: (c.get("ville"), c.get("latitude")) for c in d["dessert"]}
    assert lieux == {"Ecole_Tunis": ("Tunis", 36.8065), "Maison_Djerba": ("Djerba", 33.8076)}
    # une installation sans situeDans reste listée, sans coordonnées
    assert "latitude" not in service.get_ligne("LigneHauteTension_02")["relie"][0]


def test_lieu_deduit_du_stockage():
    # avec les données P2 : une installation sans ville prend celle du stockage qu'elle alimente
    graph = Graph().parse(OWL_FILE, format="xml").parse(P2_FILE, format="turtle")
    service = LignesService(GraphSparql(graph))

    centrale = service.get_ligne("LigneHauteTension_02")["relie"][0]
    assert (centrale["ville"], centrale["lieuDeduit"], centrale["stockage"]) == ("Tozeur", True, "Batterie_04")
    assert service.get_ligne("LigneHauteTension_03")["relie"][0]["ville"] == "Bizerte"

    lieux = {c["id"]: c.get("ville") for c in service.get_ligne("LigneBasseTension_02")["dessert"]}
    assert lieux == {"Ecole_01": None, "Maison_01": "Sousse"}

    # une vraie relation situeDans n'est jamais remplacée
    parc = service.get_ligne("LigneMoyenneTension_01")["relie"][0]
    assert parc["ville"] == "Djerba" and "lieuDeduit" not in parc


def test_routes_api(client, service):
    # les routes sont bien enregistrées dans /api/v1 (le service lit le graphe en mémoire)
    app.dependency_overrides[get_service] = lambda: service
    try:
        assert client.get("/api/v1/lignes/stats").json()["nombre"] == 7
        assert len(client.get("/api/v1/lignes", params={"type": "LigneHauteTension"}).json()) == 3
        assert client.get("/api/v1/reseaux/ReseauNational_01").json()["nombreLignes"] == 2
        assert client.get("/api/v1/reseaux/stats").json()["lignes"] == 7
        assert client.get("/api/v1/lignes/inconnue").status_code == 404
        assert client.get("/api/v1/lignes", params={"type": "Autre"}).status_code == 422
    finally:
        app.dependency_overrides.clear()


# --- CRUD (SPARQL UPDATE), sur une copie du graphe refaite à chaque test ---------

class GraphFuseki:
    """Remplace FusekiClient (ask / update) par le graphe rdflib en mémoire."""

    def __init__(self, graph: Graph) -> None:
        self.graph = graph

    def ask(self, query: str) -> bool:
        return bool(json.loads(self.graph.query(SOLARX_PREFIXES + query).serialize(format="json"))["boolean"])

    def update(self, update: str) -> None:
        self.graph.update(SOLARX_PREFIXES + update)


@pytest.fixture
def crud() -> LignesService:
    graph = Graph().parse(OWL_FILE, format="xml")
    return LignesService(GraphSparql(graph), GraphFuseki(graph))


NOUVELLE = {"type": "LigneHauteTension", "nom": "Ligne HT test", "tensionKV": 90, "longueurKm": 40,
            "reseaux": ["ReseauNational_01"], "relie": ["ParcSolaire_Djerba"], "dessert": ["Hopital_Tunis"]}


def code_erreur(fn, *args) -> int:
    with pytest.raises(HTTPException) as e:
        fn(*args)
    return e.value.status_code


def test_creer_ligne(crud):
    l = crud.create_ligne(NOUVELLE)
    assert l["id"] == "LigneHauteTension_04" and l["nom"] == "Ligne HT test"
    assert l["tensionKV"] == 90 and l["longueurKm"] == 40 and l["etat"] == "Fonctionnel"
    assert ids(l["reseaux"]) == {"ReseauNational_01"}
    assert ids(l["relie"]) == {"ParcSolaire_Djerba"} and ids(l["dessert"]) == {"Hopital_Tunis"}
    assert crud.stats()["nombre"] == 8


def test_creer_ligne_refus(crud):
    assert code_erreur(crud.create_ligne, {**NOUVELLE, "id": "LigneHauteTension_01"}) == 409
    assert code_erreur(crud.create_ligne, {**NOUVELLE, "relie": ["Batterie_01"]}) == 400
    assert code_erreur(crud.create_ligne, {**NOUVELLE, "reseaux": ["Inconnu"]}) == 400


@pytest.mark.parametrize("type_, tension, accepte", [
    ("LigneBasseTension", 0.4, True), ("LigneBasseTension", 1, False),
    ("LigneMoyenneTension", 1, True), ("LigneMoyenneTension", 50, True), ("LigneMoyenneTension", 51, False),
    ("LigneHauteTension", 50, False), ("LigneHauteTension", 51, True),
])
def test_tension_selon_le_type(crud, type_, tension, accepte):
    data = {**NOUVELLE, "type": type_, "tensionKV": tension}
    if accepte:
        assert crud.create_ligne(data)["tensionKV"] == tension
    else:
        assert code_erreur(crud.create_ligne, data) == 400


def test_modifier_ligne(crud):
    l = crud.update_ligne("LigneBasseTension_01", {"nom": "Nouveau nom", "dessert": ["Hopital_Tunis"]})
    assert l["nom"] == "Nouveau nom" and ids(l["dessert"]) == {"Hopital_Tunis"}
    assert l["longueurKm"] == 2.5 and ids(l["reseaux"]) == {"ReseauDistribution_01"}  # le reste ne change pas
    assert code_erreur(crud.update_ligne, "LigneBasseTension_01", {"tensionKV": 30}) == 400
    assert code_erreur(crud.update_ligne, "Inconnue", {"nom": "x"}) == 404


def test_modifier_ligne_retire_les_relations_inverses(crud):
    crud.fuseki.update("INSERT DATA { solarx:Hopital_Tunis solarx:estDesserviPar solarx:LigneBasseTension_02 }")
    assert "Hopital_Tunis" in ids(crud.get_ligne("LigneBasseTension_02")["dessert"])
    assert crud.update_ligne("LigneBasseTension_02", {"dessert": []})["dessert"] == []


def test_supprimer_ligne(crud):
    assert crud.delete_ligne("LigneMoyenneTension_02") == {"supprime": "LigneMoyenneTension_02"}
    assert code_erreur(crud.get_ligne, "LigneMoyenneTension_02") == 404
    assert "LigneMoyenneTension_02" not in ids(crud.get_reseau("ReseauDistribution_01")["lignes"])


def test_supprimer_ligne_avec_incident_refuse(crud):
    assert code_erreur(crud.delete_ligne, "LigneHauteTension_01") == 409
    assert "Panne_01" in ids(crud.get_ligne("LigneHauteTension_01")["incidents"])  # rien n'a bougé


def test_recherche_ligne(service):
    assert ids(service.list_lignes(q="225")) == {"LigneHauteTension_02"}
    assert len(service.list_lignes(q="  ")) == 7
    assert ids(service.list_lignes(q="LigneMoyenneTension_0")) == {"LigneMoyenneTension_01", "LigneMoyenneTension_02"}
    assert service.list_lignes(q='x" } DROP ALL') == []


def test_referentiel(service):
    r = service.referentiel()
    assert "ParcEolien_Tunis" in ids(r["installations"]) and "Hopital_Tunis" in ids(r["consommateurs"])


def test_crud_reseau(crud):
    r = crud.create_reseau({"type": "ReseauTransport", "nom": "Réseau test", "lignes": ["LigneHauteTension_02"]})
    assert r["id"] == "ReseauTransport_02" and r["nom"] == "Réseau test" and r["nombreLignes"] == 1

    r = crud.update_reseau("ReseauTransport_02", {"nom": "Autre nom"})
    assert r["nom"] == "Autre nom" and r["nombreLignes"] == 1
    assert code_erreur(crud.delete_reseau, "ReseauTransport_02") == 409  # il contient encore une ligne

    assert crud.update_reseau("ReseauTransport_02", {"lignes": []})["nombreLignes"] == 0
    assert crud.delete_reseau("ReseauTransport_02") == {"supprime": "ReseauTransport_02"}
    assert code_erreur(crud.get_reseau, "ReseauTransport_02") == 404


def test_routes_crud(client, crud):
    app.dependency_overrides[get_service] = lambda: crud
    try:
        r = client.post("/api/v1/lignes", json=NOUVELLE)
        assert r.status_code == 201 and r.json()["id"] == "LigneHauteTension_04"
        assert client.put("/api/v1/lignes/LigneHauteTension_04", json={"nom": "Autre"}).json()["nom"] == "Autre"
        assert client.delete("/api/v1/lignes/LigneHauteTension_04").status_code == 200
        assert client.delete("/api/v1/lignes/LigneHauteTension_01").status_code == 409
        assert client.post("/api/v1/lignes", json={**NOUVELLE, "tensionKV": -1}).status_code == 422
        assert "installations" in client.get("/api/v1/lignes/referentiel").json()
        assert len(client.get("/api/v1/lignes", params={"q": "225"}).json()) == 1

        r = client.post("/api/v1/reseaux", json={"type": "ReseauDistribution", "nom": "Test"})
        assert r.status_code == 201
        rid = r.json()["id"]
        assert client.put(f"/api/v1/reseaux/{rid}", json={"nom": "Autre"}).json()["nom"] == "Autre"
        assert client.delete(f"/api/v1/reseaux/{rid}").status_code == 200
    finally:
        app.dependency_overrides.clear()
