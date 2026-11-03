"""CRUD coverage for production installations and energy sources."""

from pathlib import Path

import pytest
from fastapi import HTTPException
from rdflib import Graph

from app.schemas.production import InstallationWrite, SourceWrite
from app.services.fuseki import PREFIXES
from app.services.installation_service import InstallationService
from app.services.production_service import ProductionService
from app.services.source_energie_service import SourceEnergieService

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


def test_installation_create_update_and_stats_recompute(fuseki):
    service = InstallationService(fuseki)
    source_service = SourceEnergieService(fuseki)
    first_source = source_service.create_source(SourceWrite(nom="CRUD source one", type="Solaire"))
    second_source = source_service.create_source(SourceWrite(nom="CRUD source two", type="Eolienne"))
    before = ProductionService(fuseki).stats().total.nombre_installations
    item = service.create_installation(InstallationWrite(nom="CRUD Test Solar", type="CentraleSolaire", puissance_kw=12.5, source_id=first_source.id))
    assert service.get_installation(item.id).id == item.id
    assert item.id == "CRUD_Test_Solar"
    assert item.source_deduite is False and item.source.id == first_source.id
    assert ProductionService(fuseki).stats().total.nombre_installations == before + 1
    updated = service.update_installation(item.id, InstallationWrite(nom="Updated", type="ParcEolien", puissance_kw=None, source_id=second_source.id))
    assert updated.type.value == "ParcEolien"
    assert updated.puissance_kw is None
    assert updated.source.id == second_source.id
    service.delete_installation(item.id)
    assert ProductionService(fuseki).stats().total.nombre_installations == before


def test_source_create_update_and_link_conflicts(fuseki):
    sources = SourceEnergieService(fuseki)
    installations = InstallationService(fuseki)
    source = sources.create_source(SourceWrite(nom="CRUD Source", type="Solaire"))
    assert sources.get_source(source.id).id == source.id
    installation = installations.create_installation(InstallationWrite(nom="CRUD Plant", type="CentraleSolaire", source_id=source.id))
    assert sources.get_source(source.id).nombre_installations == 1
    assert [item.id for item in sources.installations_for_source(source.id)] == [installation.id]
    with pytest.raises(HTTPException) as conflict:
        sources.delete_source(source.id)
    assert conflict.value.status_code == 409
    assert installation.id in conflict.value.detail["dependances"]
    renamed = sources.update_source(source.id, SourceWrite(nom='Name "quoted"', type="Eolienne"))
    assert renamed.nom == 'Name "quoted"'
    installations.delete_installation(installation.id)
    sources.delete_source(source.id)
    with pytest.raises(HTTPException) as missing:
        sources.get_source(source.id)
    assert missing.value.status_code == 404


@pytest.mark.parametrize("payload", [
    {"nom": "  ", "type": "CentraleSolaire"},
    {"nom": "bad", "type": "Unknown"},
    {"nom": "bad", "type": "CentraleSolaire", "puissance_kw": -1},
    {"nom": "bad", "type": "CentraleSolaire", "puissance_kw": 0},
])
def test_invalid_installation_payloads_rejected(payload):
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        InstallationWrite(**payload)


def test_missing_installation_and_reference_return_404(fuseki):
    service = InstallationService(fuseki)
    with pytest.raises(HTTPException) as missing:
        service.get_installation("NoSuchInstallation")
    assert missing.value.status_code == 404
    with pytest.raises(HTTPException) as reference:
        service.create_installation(InstallationWrite(nom="Bad ref", type="CentraleSolaire", source_id="MissingSource"))
    assert reference.value.status_code == 404
    with pytest.raises(HTTPException) as city:
        service.create_installation(InstallationWrite(nom="Bad city", type="CentraleSolaire", ville_id="MissingCity"))
    assert city.value.status_code == 404


def test_delete_installation_with_incoming_reference_conflicts(fuseki):
    service = InstallationService(fuseki)
    item = service.create_installation(InstallationWrite(nom="Referenced Plant", type="CentraleSolaire"))
    subject = f"solarx:TestRef_{item.id}"
    fuseki.update(f"INSERT DATA {{ {subject} solarx:concerne {f'solarx:{item.id}'} . }}")
    with pytest.raises(HTTPException) as conflict:
        service.delete_installation(item.id)
    assert conflict.value.status_code == 409
    assert f"TestRef_{item.id}" in conflict.value.detail["dependances"]


def test_literals_with_sparql_fragments_are_stored_verbatim(fuseki):
    name = 'Quote " and slash \\ } ; INSERT DATA { solarx:Injected a solarx:CentraleSolaire } #'
    item = InstallationService(fuseki).create_installation(InstallationWrite(nom=name, type="CentraleSolaire"))
    assert InstallationService(fuseki).get_installation(item.id).nom == name
    assert not fuseki.ask("ASK { solarx:Injected a solarx:CentraleSolaire }")


def test_source_delete_detects_legacy_producesource_link(fuseki):
    source = SourceEnergieService(fuseki).create_source(SourceWrite(nom="Legacy link source", type="Solaire"))
    plant = InstallationService(fuseki).create_installation(InstallationWrite(nom="Legacy linked plant", type="CentraleSolaire"))
    fuseki.update(f"INSERT DATA {{ solarx:{plant.id} solarx:produitEnergie solarx:{source.id} }}")
    with pytest.raises(HTTPException) as conflict:
        SourceEnergieService(fuseki).delete_source(source.id)
    assert conflict.value.status_code == 409
    assert plant.id in conflict.value.detail["dependances"]
