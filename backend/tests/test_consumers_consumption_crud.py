"""Consumer CRUD and read-only consumption queries against an ontology graph."""
from pathlib import Path

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from rdflib import Graph

from app.schemas.consommateur import ConsumerWrite
from app.services.consommateur_service import ConsumerService
from app.services.consommation_service import ConsumptionService
from app.services.fuseki import PREFIXES

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
    consumers = ConsumerService(fuseki)
    home = consumers.create_consumer(ConsumerWrite(nom="CRUD House Example", type="Maison", surface_m2=83, localisation_id="Tunis", equipement_ids=["Compteur_01"]))
    assert consumers.get_consumer(home.id).localisation == {"id": "Tunis", "nom": "Tunis"}
    assert home.surface_m2 == 83
    assert [equipment.id for equipment in home.equipements] == ["Compteur_01"]
    updated = consumers.update_consumer(home.id, ConsumerWrite(nom="Renamed house", type="Maison", surface_m2=None, localisation_id=None))
    assert updated.nom == "Renamed house" and updated.surface_m2 is None and updated.localisation is None
    assert updated.equipements == []
    consumers.delete_consumer(home.id)
    with pytest.raises(HTTPException) as missing:
        consumers.get_consumer(home.id)
    assert missing.value.status_code == 404


def test_measurements_are_read_from_the_ontology(fuseki):
    service = ConsumptionService(fuseki)
    original = next(item for item in service.list_measurements() if item.id == "Mesure_002")
    assert original.consommateur_id == "Maison_Djerba"
    assert original.valeur == 9


@pytest.mark.parametrize("payload", [
    {"nom": " ", "type": "Maison"},
    {"nom": "Invalid type", "type": "Unknown"},
    {"nom": "Invalid surface", "type": "Maison", "surface_m2": 0},
])
def test_consumer_validation(payload):
    with pytest.raises(ValidationError):
        ConsumerWrite(**payload)


def test_missing_consumer_references(fuseki):
    consumers = ConsumerService(fuseki)
    with pytest.raises(HTTPException) as unknown_location:
        consumers.create_consumer(ConsumerWrite(nom="Bad location", type="Maison", localisation_id="NoSuchVille"))
    assert unknown_location.value.status_code == 404
    with pytest.raises(HTTPException) as unknown_equipment:
        consumers.create_consumer(ConsumerWrite(nom="Bad equipment", type="Maison", equipement_ids=["NoSuchEquipment"]))
    assert unknown_equipment.value.status_code == 404
