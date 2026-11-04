"""Consumer CRUD and consumption measurement CRUD against an ontology graph."""
from pathlib import Path

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from rdflib import Graph

from app.schemas.consommateur import ConsommateurCreate
from app.schemas.mesure import MesureCreate
from app.services.consommateur_service import ConsommateurService
from app.services.consommation_service import ConsumptionService
from app.services.fuseki import PREFIXES
from app.services.mesure_service import MesureService

OWL_FILE = Path(__file__).resolve().parents[2] / "database" / "solarx.owl"


class MemoryFuseki:
    def __init__(self):
        self.graph = Graph().parse(OWL_FILE, format="xml")

    def select(self, query):
        return [{key: str(value) for key, value in row.asdict().items()}
                for row in self.graph.query(PREFIXES + query)]

    def ask(self, query):
        return bool(self.graph.query(PREFIXES + query).askAnswer)

    def update(self, update):
        self.graph.update(PREFIXES + update)


@pytest.fixture
def fuseki():
    return MemoryFuseki()


def test_consumer_crud(fuseki):
    consumers = ConsommateurService(fuseki)
    home = consumers.create_consommateur(
        ConsommateurCreate(
            nom="CRUD House Example",
            type="Maison",
            surfaceM2=83,
            ville="Tunis",
            equipement_ids=["Compteur_01"],
        )
    )
    assert consumers.get_consommateur(home.id).ville == "Tunis"
    assert home.surfaceM2 == 83
    assert [equipment.id for equipment in home.equipements] == ["Compteur_01"]
    updated = consumers.update_consommateur(
        home.id,
        ConsommateurCreate(nom="Renamed house", type="Maison", surfaceM2=None, ville="Tunis"),
    )
    assert updated.nom == "Renamed house" and updated.surfaceM2 is None
    assert updated.equipements == []
    consumers.delete_consommateur(home.id)
    with pytest.raises(HTTPException) as missing:
        consumers.get_consommateur(home.id)
    assert missing.value.status_code == 404


def test_measurements_are_read_from_the_ontology(fuseki):
    service = ConsumptionService(fuseki)
    original = next(item for item in service.list_measurements() if item.id == "Mesure_002")
    assert original.consommateur_id == "Maison_Djerba"
    assert original.valeur == 9


def test_measurement_crud(fuseki):
    mesures = MesureService(fuseki)
    created = mesures.create_mesure(
        MesureCreate(
            type="MesureConsommation",
            valeur=12.5,
            unite="kWh",
            dateMesure="2026-10-01",
            concerne="Maison_Djerba",
        )
    )
    assert created.concerne == "Maison_Djerba"
    assert created.valeur == 12.5
    assert created.dateMesure.startswith("2026-10-01")

    updated = mesures.update_mesure(
        created.id,
        MesureCreate(
            type="MesureConsommation",
            valeur=20,
            unite="kWh",
            dateMesure="2026-10-02",
            concerne="Maison_Djerba",
            sourceDonnees="Test",
        ),
    )
    assert updated.valeur == 20
    assert updated.dateMesure.startswith("2026-10-02")
    assert updated.sourceDonnees == "Test"

    listed = mesures.list_mesures(concerne="Maison_Djerba")
    assert any(item.id == created.id and item.valeur == 20 for item in listed)

    mesures.delete_mesure(created.id)
    with pytest.raises(HTTPException) as missing:
        mesures.get_mesure(created.id)
    assert missing.value.status_code == 404


def test_alerts_handle_naive_measurement_dates(fuseki):
    alerts = ConsommateurService(fuseki).alertes()
    assert isinstance(alerts, list)
    assert any(item["consommateur"] == "Maison_Djerba" for item in alerts)


def test_measurement_validation(fuseki):
    mesures = MesureService(fuseki)
    with pytest.raises(HTTPException) as unknown_target:
        mesures.create_mesure(
            MesureCreate(
                type="MesureConsommation",
                valeur=1,
                unite="kWh",
                dateMesure="2026-10-01",
                concerne="NoSuchConsumer",
            )
        )
    assert unknown_target.value.status_code == 400


@pytest.mark.parametrize("payload", [
    {"nom": " ", "type": "Maison", "ville": "Tunis"},
    {"nom": "Invalid type", "type": "Unknown", "ville": "Tunis"},
    {"nom": "Invalid surface", "type": "Maison", "surfaceM2": -5, "ville": "Tunis"},
])
def test_consumer_validation(payload):
    with pytest.raises(ValidationError):
        ConsommateurCreate(**payload)


def test_missing_consumer_references(fuseki):
    consumers = ConsommateurService(fuseki)
    with pytest.raises(HTTPException) as unknown_location:
        consumers.create_consommateur(
            ConsommateurCreate(nom="Bad location", type="Maison", ville="NoSuchVille")
        )
    assert unknown_location.value.status_code == 400
    with pytest.raises(HTTPException) as unknown_equipment:
        consumers.create_consommateur(
            ConsommateurCreate(
                nom="Bad equipment",
                type="Maison",
                ville="Tunis",
                equipement_ids=["NoSuchEquipment"],
            )
        )
    assert unknown_equipment.value.status_code == 404
