"""Requêtes SPARQL SELECT avec des valeurs typées (Lignes, Réseaux, IA).

``FusekiClient.select`` renvoie toutes les valeurs en texte. Ici on garde le
type indiqué par Fuseki : les IRI deviennent leur nom local (``Batterie_01``),
les nombres deviennent ``float`` / ``int``. Les requêtes utilisent le préfixe
``:`` à la place de ``solarx:`` (rdflib, utilisé dans les tests, n'accepte pas
deux préfixes pour le même espace de noms).

Même configuration que le reste de l'API (``settings.FUSEKI_URL`` /
``settings.FUSEKI_DATASET``) : on réutilise ``FusekiClient`` sans le modifier.
"""

import json

import httpx
from rdflib import Graph

from app.services.fuseki import PREFIXES as SOLARX_PREFIXES
from app.services.fuseki import FusekiClient, FusekiUnavailable, iri

PREFIXES = SOLARX_PREFIXES.replace("PREFIX solarx:", "PREFIX :", 1)


def term(local_name: str) -> str:
    """Nom local validé (``iri`` refuse tout caractère dangereux) -> ``:Nom``."""
    return ":" + iri(local_name).removeprefix("solarx:")


def convert(binding: dict):
    """Cellule SPARQL JSON -> valeur Python."""
    value = binding["value"]
    if binding["type"] == "uri":
        return value.split("#")[-1].split("/")[-1]
    datatype = binding.get("datatype", "")
    if datatype.endswith(("#decimal", "#double", "#float")):
        return float(value)
    if datatype.endswith(("#integer", "#int", "#long", "#nonNegativeInteger")):
        return int(value)
    return value


def _rows(bindings: list[dict]) -> list[dict]:
    # Un GROUP BY sans résultat renvoie une ligne vide : on l'ignore
    return [{k: convert(v) for k, v in row.items()} for row in bindings if row]


class TypedSparql:
    """``run(query)`` -> liste de lignes ``{variable: valeur typée}``."""

    def __init__(self, fuseki: FusekiClient) -> None:
        self.fuseki = fuseki

    def run(self, query: str) -> list[dict]:
        try:
            response = httpx.post(
                f"{self.fuseki.base_url}/query",
                data={"query": PREFIXES + query},
                headers={"Accept": "application/sparql-results+json"},
                auth=self.fuseki.auth,
                timeout=15.0,
            )
        except httpx.HTTPError as exc:
            raise FusekiUnavailable(
                f"Fuseki injoignable ({self.fuseki.base_url}). Démarrez Fuseki et chargez l'ontologie."
            ) from exc
        if response.status_code >= 400:
            raise FusekiUnavailable(f"Erreur Fuseki {response.status_code} : {response.text[:300]}")
        return _rows(response.json()["results"]["bindings"])


class GraphSparql:
    """Même interface sur un graphe rdflib en mémoire (tests, sans Fuseki)."""

    def __init__(self, graph: Graph) -> None:
        self.graph = graph

    def run(self, query: str) -> list[dict]:
        data = json.loads(self.graph.query(PREFIXES + query).serialize(format="json"))
        return _rows(data["results"]["bindings"])
