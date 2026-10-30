"""Tests du module IA sans Fuseki : l'ontologie est chargée en mémoire avec rdflib.

Les résultats passent par la même conversion que sparql_client.run_query,
pour se comporter exactement comme Fuseki.
"""
import json
import sys
from pathlib import Path

import pytest
from rdflib import Graph

BACKEND = Path(__file__).resolve().parents[1]
ONTOLOGY = BACKEND.parent / "ontology"
sys.path.insert(0, str(BACKEND))

from sparql_client import PREFIXES, SOLARX_NS, _convert  # noqa: E402

from nlp.pipeline import SolarXAssistant  # noqa: E402


def load_graph() -> Graph:
    g = Graph()
    g.parse(ONTOLOGY / "solarx.owl", format="xml")
    for ttl in ONTOLOGY.glob("*.ttl"):
        g.parse(ttl, format="turtle")
    return g


def make_runner(graph: Graph):
    def run(query: str) -> list[dict]:
        data = json.loads(graph.query(PREFIXES + query).serialize(format="json"))
        return [{k: _convert(v) for k, v in row.items()} for row in data["results"]["bindings"] if row]
    return run


@pytest.fixture(scope="session")
def assistant() -> SolarXAssistant:
    return SolarXAssistant(make_runner(load_graph()), PREFIXES, SOLARX_NS)
