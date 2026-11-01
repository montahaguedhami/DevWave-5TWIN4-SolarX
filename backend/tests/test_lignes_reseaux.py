"""Lignes + Réseaux : le vrai SPARQL des services, sur une copie RDFLib en mémoire de l'ontologie.

Lancer (depuis backend/) :  pytest tests/test_lignes_reseaux.py -q
"""

from pathlib import Path

import pytest
from fastapi import HTTPException
from rdflib import Graph

from app.api.v1.endpoints.lignes import get_service
from app.main import app
from app.services.lignes_service import LignesService
from app.services.typed_sparql import GraphSparql

OWL_FILE = Path(__file__).resolve().parents[2] / "database" / "solarx.owl"


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
    assert ids(d["incidents"]) == {"Panne_01"}


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


def test_routes_api(client, service):
    # les routes sont bien enregistrées dans /api/v1 (le service lit le graphe en mémoire)
    app.dependency_overrides[get_service] = lambda: service
    try:
        assert client.get("/api/v1/lignes/stats").json()["nombre"] == 7
        assert len(client.get("/api/v1/lignes", params={"type": "LigneHauteTension"}).json()) == 3
        assert client.get("/api/v1/reseaux/ReseauNational_01").json()["nombreLignes"] == 2
        assert client.get("/api/v1/lignes/inconnue").status_code == 404
        assert client.get("/api/v1/lignes", params={"type": "Autre"}).status_code == 422
    finally:
        app.dependency_overrides.clear()
