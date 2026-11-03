"""Module P2 (Stockage + Équipement) : le vrai SPARQL des services, sur une copie RDFLib
en mémoire de solarx.owl + database/p2_stockage_equipement.ttl (lecture ET CRUD).

Lancer (depuis backend/) :  pytest tests/test_stockage_equipement.py -q
"""

import json
from pathlib import Path

import pytest
from fastapi import HTTPException
from rdflib import Graph

from app.services.equipement_service import EquipementService
from app.services.fuseki import PREFIXES as SOLARX_PREFIXES
from app.services.stockage_service import StockageService
from app.services.typed_sparql import GraphSparql

DB = Path(__file__).resolve().parents[2] / "database"


class GraphFuseki:
    """Remplace FusekiClient (ask / update) par le graphe rdflib en mémoire."""

    def __init__(self, graph: Graph) -> None:
        self.graph = graph

    def ask(self, query: str) -> bool:
        return bool(json.loads(self.graph.query(SOLARX_PREFIXES + query).serialize(format="json"))["boolean"])

    def update(self, update: str) -> None:
        self.graph.update(SOLARX_PREFIXES + update)


def _graph() -> Graph:
    g = Graph().parse(DB / "solarx.owl", format="xml")
    return g.parse(DB / "p2_stockage_equipement.ttl", format="turtle")


@pytest.fixture
def services():
    g = _graph()
    return StockageService(GraphSparql(g), GraphFuseki(g)), EquipementService(GraphSparql(g), GraphFuseki(g))


def ids(items):
    return {i["id"] for i in items}


# ------------------------------------------------------------------ Stockage
def test_lister_stockages(services):
    st, _ = services
    assert len(st.list_stockages()) == 10
    assert ids(st.list_stockages("StockageHydraulique")) == {
        "StockageHydraulique_01", "StockageHydraulique_02", "StockageHydraulique_03"}


def test_capacite_totale_agregation(services):
    st, _ = services
    t = st.capacite_totale()
    assert t["nombre"] == 10
    assert t["capaciteTotale"] == pytest.approx(10 + 50 + 2000 + 5000 + 40 + 1200 + 13.5 + 60000 + 25000 + 12000)
    assert {p["type"]: p["nombre"] for p in t["parType"]} == {"Batterie": 7, "StockageHydraulique": 3}


def test_stockage_relations_et_etat(services):
    st, _ = services
    b1 = st.get_stockage("Batterie_01")
    assert b1["niveauCharge"] == 70.0
    assert b1["alimente"] == ["Maison_Djerba"]
    assert b1["localisation"] == "Djerba"          # déduite de la maison alimentée
    assert st.get_stockage("Batterie_05")["etat"] == "En panne"
    assert st.get_stockage("Batterie_02")["mesures"][0]["mesure"] == "Mesure_003"


def test_stockage_crud(services):
    st, _ = services
    cree = st.create({"type": "Batterie", "nom": "Test", "capaciteKWh": 100, "energieStockeeKWh": 25,
                      "localisation": "Gabes", "alimentePar": "ParcSolaire_Djerba"})
    assert cree["id"] == "Batterie_08" and cree["niveauCharge"] == 25.0
    assert cree["alimentePar"] == ["ParcSolaire_Djerba"] and cree["localisation"] == "Gabès"
    modifie = st.update("Batterie_08", {"energieStockeeKWh": 80, "etat": "Maintenance"})
    assert modifie["niveauCharge"] == 80.0 and modifie["etat"] == "Maintenance"
    st.delete("Batterie_08")
    with pytest.raises(HTTPException) as e:
        st.get_stockage("Batterie_08")
    assert e.value.status_code == 404


def test_stockage_validation(services):
    st, _ = services
    with pytest.raises(HTTPException) as e:
        st.create({"type": "Batterie", "nom": "X", "capaciteKWh": 10, "energieStockeeKWh": 20})
    assert e.value.status_code == 400
    with pytest.raises(HTTPException) as e:
        st.create({"id": "Batterie_01", "type": "Batterie", "nom": "X", "capaciteKWh": 10})
    assert e.value.status_code == 409


# ---------------------------------------------------------------- Équipement
def test_lister_equipements_et_stats(services):
    _, eq = services
    s = eq.stats()
    assert s["total"] == 15
    assert s["parType"] == {"Capteur": 5, "CompteurIntelligent": 5, "Onduleur": 5}
    assert s["parEtat"] == {"Fonctionnel": 11, "Maintenance": 2, "En panne": 2}


def test_etat_vient_de_la_maintenance(services):
    _, eq = services
    # Maintenance_01 (module Incident) porteSur Onduleur_01
    o1 = eq.get_equipement("Onduleur_01")
    assert o1["etat"] == "Maintenance" and o1["evenements"][0]["evenement"] == "Maintenance_01"


def test_localisation_par_proprietaire(services):
    _, eq = services
    assert eq.get_equipement("Compteur_03")["localisation"] == "Tunis"
    assert ids(eq.list_equipements(etat="En panne")) == {"Capteur_05", "Compteur_04"}


def test_equipement_crud(services):
    _, eq = services
    cree = eq.create({"type": "Capteur", "nom": "Capteur test", "marque": "ABB", "proprietaire": "Hopital_Tunis"})
    assert cree["id"] == "Capteur_06" and cree["localisation"] == "Tunis"
    assert eq.update("Capteur_06", {"etat": "En panne"})["etat"] == "En panne"
    eq.delete("Capteur_06")
    assert "Capteur_06" not in ids(eq.list_equipements())
    with pytest.raises(HTTPException) as e:
        eq.create({"type": "Onduleur", "nom": "X", "proprietaire": "Tunis"})  # une ville n'est pas propriétaire
    assert e.value.status_code == 400


# ------------------------------------------------- filtrage / recherche SPARQL
def test_recherche_et_filtres_stockage(services):
    st, _ = services
    assert ids(st.list_stockages(q="lithium")) == {"Batterie_01", "Batterie_02", "Batterie_03", "Batterie_04", "Batterie_07"}
    assert ids(st.list_stockages(q="SIDI")) == {"StockageHydraulique_01"}
    assert ids(st.list_stockages(capacite_min=10000)) == {
        "StockageHydraulique_01", "StockageHydraulique_02", "StockageHydraulique_03"}
    assert ids(st.list_stockages("Batterie", capacite_max=50)) == {"Batterie_01", "Batterie_02", "Batterie_05", "Batterie_07"}
    assert ids(st.list_stockages(niveau_max=30)) == {"Batterie_05", "StockageHydraulique_03"}
    assert ids(st.list_stockages(localisation="Tunis")) == {"Batterie_02", "Batterie_05", "Batterie_06"}
    assert ids(st.list_stockages(localisation="Djerba")) == {"Batterie_01", "Batterie_03"}  # Batterie_01 via la maison alimentée
    assert ids(st.list_stockages(etat="En panne")) == {"Batterie_05"}
    assert "FILTER" in st.derniere_requete


def test_recherche_et_filtres_equipements(services):
    _, eq = services
    assert ids(eq.list_equipements(q="huawei")) == {"Onduleur_03", "Onduleur_05"}
    assert ids(eq.list_equipements(marque="Itron")) == {"Compteur_02", "Compteur_04"}
    assert ids(eq.list_equipements(proprietaire="Hopital_Tunis")) == {"Capteur_01", "Compteur_03", "Onduleur_04"}
    assert ids(eq.list_equipements("Onduleur", localisation="Djerba")) == {"Onduleur_01", "Onduleur_05"}
    assert ids(eq.list_equipements(etat="Maintenance")) == {"Capteur_04", "Onduleur_01"}
    assert "etatCalc" in eq.derniere_requete
