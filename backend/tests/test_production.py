"""Production read queries against an in-memory copy of the ontology."""

from pathlib import Path

import pytest
from fastapi import HTTPException
from rdflib import Graph

from app.services.fuseki import PREFIXES
from app.services.installation_service import InstallationService
from app.services.production_service import ProductionService

OWL_FILE = Path(__file__).resolve().parents[2] / "database" / "solarx.owl"


class RdflibClient:
    def __init__(self, graph: Graph) -> None:
        self.graph = graph

    def select(self, query: str) -> list[dict[str, str]]:
        return [{key: str(value) for key, value in row.asdict().items()}
                for row in self.graph.query(PREFIXES + query)]


@pytest.fixture
def client() -> RdflibClient:
    return RdflibClient(Graph().parse(OWL_FILE, format="xml"))


def test_installations_list_includes_incomplete_individuals(client):
    installations = InstallationService(client).list_installations()
    by_id = {item.id: item for item in installations}
    assert {"CentraleSolaire", "ParcEolien"}.issubset({item.type.value for item in installations})
    assert by_id["ParcEolien_01"].nom == "ParcEolien_01"
    assert by_id["ParcEolien_01"].puissance_kw is None
    assert by_id["ParcEolien_01"].ville is None


def test_wind_source_filter_includes_both_deduced_wind_parks(client):
    installations = ProductionService(client).list_installations(source="Eolienne")
    parks = {item.id: item for item in installations}
    assert {"ParcEolien_01", "ParcEolien_Tunis"}.issubset(parks)
    assert all(item.source_deduite for item in parks.values())
    assert all(item.source.type.value == "Eolienne" for item in parks.values())


def test_stats_have_all_source_types_measurements_and_power_shares(client):
    result = ProductionService(client).stats()
    by_source = {item.source.value: item for item in result.sources}
    assert set(by_source) == {"Solaire", "Eolienne", "Hydraulique"}
    assert by_source["Hydraulique"].nombre_installations == 0
    assert by_source["Hydraulique"].puissance_totale_kw == 0
    assert by_source["Solaire"].production_mesuree_kwh == 600
    assert result.total.production_mesuree_kwh == 600
    assert result.total.puissance_totale_kw > 0
    assert sum(item.part_pct for item in result.sources) == pytest.approx(100, abs=0.02)


def test_stats_by_installation_type_and_zero_share_guard(client):
    result = ProductionService(client).stats_par_type()
    by_type = {item.type.value: item for item in result.types}
    assert set(by_type) == {"CentraleSolaire", "ParcEolien", "CentraleHydraulique"}
    assert by_type["CentraleSolaire"].production_mesuree_kwh == 600
    assert by_type["CentraleHydraulique"].nombre_installations == 0
    service = ProductionService(client)
    empty = service._totals([], {})
    assert empty.puissance_totale_kw == 0
    assert empty.part_pct == 0


def test_invalid_type_and_source_return_422(client):
    service = InstallationService(client)
    with pytest.raises(HTTPException) as invalid_type:
        service.list_installations(type_name="Uneolienne")
    assert invalid_type.value.status_code == 422
    with pytest.raises(HTTPException) as invalid_source:
        service.list_installations(source_type="Biomasse")
    assert invalid_source.value.status_code == 422
