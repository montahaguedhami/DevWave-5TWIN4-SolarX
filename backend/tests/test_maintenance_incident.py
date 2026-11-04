"""Module P6 (Maintenance + Incident) : tests unitaires SPARQL sur GraphSparql (RDFLib en mémoire).

Lancer (depuis backend/) : python -m pytest tests/test_maintenance_incident.py -q
"""

import json
from pathlib import Path

import pytest
from rdflib import Graph

from app.services.fuseki import PREFIXES as SOLARX_PREFIXES
from app.services.incident_service import IncidentService
from app.services.maintenance_service import MaintenanceService
from app.services.typed_sparql import GraphSparql

DB = Path(__file__).resolve().parents[2] / "database"


class GraphFuseki:
    """Simulateur FusekiClient pour ask / update sur le graphe rdflib en mémoire."""

    def __init__(self, graph: Graph) -> None:
        self.graph = graph

    def ask(self, query: str) -> bool:
        return bool(json.loads(self.graph.query(SOLARX_PREFIXES + query).serialize(format="json"))["boolean"])

    def update(self, update: str) -> None:
        self.graph.update(SOLARX_PREFIXES + update)


def _graph() -> Graph:
    g = Graph()
    g.parse(DB / "solarx.owl", format="xml")
    return g


@pytest.fixture
def services():
    g = _graph()
    sparql = GraphSparql(g)
    fuseki = GraphFuseki(g)
    return MaintenanceService(sparql, fuseki), IncidentService(sparql, fuseki)


def ids(items):
    return {i["id"] for i in items}


# ------------------------------------------------------------------ Maintenance
def test_lister_toutes_maintenances(services):
    maint_srv, _ = services
    all_m = maint_srv.list_maintenances()
    assert len(all_m) >= 13


def test_lister_sous_classes_maintenance(services):
    maint_srv, _ = services

    inspections = maint_srv.list_maintenances(type_="Inspection")
    assert len(inspections) >= 4
    assert "Inspection_01" in ids(inspections)

    correctives = maint_srv.list_maintenances(type_="MaintenanceCorrective")
    assert len(correctives) >= 4
    assert "Maintenance_01" in ids(correctives)

    predictives = maint_srv.list_maintenances(type_="MaintenancePredictive")
    assert len(predictives) >= 3
    assert "MaintenancePredictive_01" in ids(predictives)

    preventives = maint_srv.list_maintenances(type_="MaintenancePreventive")
    assert len(preventives) >= 3
    assert "MaintenancePreventive_01" in ids(preventives)


def test_stats_maintenances(services):
    maint_srv, _ = services
    s = maint_srv.stats()
    assert s["total"] >= 13
    assert s["parType"]["Inspection"] >= 4
    assert s["parType"]["MaintenanceCorrective"] >= 4
    assert s["parType"]["MaintenancePredictive"] >= 3
    assert s["parType"]["MaintenancePreventive"] >= 3


def test_crud_maintenance(services):
    maint_srv, _ = services
    # Create
    created = maint_srv.create_maintenance({
        "type": "Inspection",
        "nom": "Inspection thermographique semestrielle",
        "description": "Contrôle d'échauffement des connexions",
        "dateOccurrence": "2026-11-04T10:00:00",
        "equipement": "Onduleur_01",
    })
    mid = created["id"]
    assert mid.startswith("Inspection_")
    assert created["nom"] == "Inspection thermographique semestrielle"

    # Read
    detail = maint_srv.get_maintenance(mid)
    assert detail["id"] == mid

    # Update
    updated = maint_srv.update_maintenance(mid, {"nom": "Inspection thermographique mise à jour"})
    assert updated["nom"] == "Inspection thermographique mise à jour"

    # Delete
    maint_srv.delete_maintenance(mid)
    with pytest.raises(Exception):
        maint_srv.get_maintenance(mid)


# ------------------------------------------------------------------ Incident
def test_lister_tous_incidents(services):
    _, inc_srv = services
    all_inc = inc_srv.list_incidents()
    assert len(all_inc) >= 11


def test_lister_sous_classes_incident(services):
    _, inc_srv = services

    alertes = inc_srv.list_incidents(type_="Alerte")
    assert len(alertes) >= 4
    assert "Alerte_01" in ids(alertes)

    pannes = inc_srv.list_incidents(type_="Panne")
    assert len(pannes) >= 5
    assert "Panne_01" in ids(pannes)

    surcharges = inc_srv.list_incidents(type_="Surcharge")
    assert len(surcharges) >= 3
    assert "Surcharge_01" in ids(surcharges)


def test_requete_pannes_par_equipement(services):
    _, inc_srv = services
    groupes = inc_srv.pannes_par_equipement()
    assert len(groupes) >= 2
    # Onduleur_01 has multiple pannes
    eq_ids = {g["equipement"] for g in groupes}
    assert "Onduleur_01" in eq_ids

    onduleur_groupe = next(g for g in groupes if g["equipement"] == "Onduleur_01")
    assert onduleur_groupe["nbPannes"] >= 2
    assert len(onduleur_groupe["pannes"]) >= 2


def test_stats_incidents(services):
    _, inc_srv = services
    s = inc_srv.stats()
    assert s["total"] >= 11
    assert s["parType"]["Panne"] >= 5
    assert s["parType"]["Alerte"] >= 4
    assert s["parType"]["Surcharge"] >= 3
    assert s["parGravite"]["Critique"] >= 2
    assert s["parGravite"]["Élevée"] >= 2


def test_crud_incident(services):
    _, inc_srv = services
    # Create
    created = inc_srv.create_incident({
        "type": "Panne",
        "nom": "Perte de liaison communication",
        "description": "Perte temporaire de trames",
        "gravite": "Moyenne",
        "dateOccurrence": "2026-11-04T10:30:00",
        "affecte": "Compteur_01",
        "detectePar": "Capteur_01",
    })
    iid = created["id"]
    assert iid.startswith("Panne_")

    # Read
    detail = inc_srv.get_incident(iid)
    assert detail["id"] == iid
    assert detail["gravite"] == "Moyenne"

    # Update
    updated = inc_srv.update_incident(iid, {"gravite": "Critique"})
    assert updated["gravite"] == "Critique"

    # Delete
    inc_srv.delete_incident(iid)
    with pytest.raises(Exception):
        inc_srv.get_incident(iid)

