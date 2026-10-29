"""Client SPARQL partagé : envoie les requêtes à Fuseki et renvoie des dicts Python."""
import os

import requests
from dotenv import load_dotenv

load_dotenv()

FUSEKI_URL = os.getenv("FUSEKI_URL", "http://localhost:3030/solarx/sparql")
SOLARX_NS = os.getenv("SOLARX_NS", "http://www.semanticweb.org/monta/ontologies/2026/8/untitled-ontology-10#")

PREFIXES = f"""
PREFIX :     <{SOLARX_NS}>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>
"""


class SparqlError(Exception):
    pass


def _convert(binding: dict):
    value = binding["value"]
    if binding["type"] == "uri":
        # On renvoie le nom local (ex. "Batterie_01") plutôt que l'IRI complète
        return value.split("#")[-1].split("/")[-1]
    datatype = binding.get("datatype", "")
    if datatype.endswith(("#decimal", "#double", "#float")):
        return float(value)
    if datatype.endswith(("#integer", "#int", "#long", "#nonNegativeInteger")):
        return int(value)
    return value


def run_query(query: str) -> list[dict]:
    """Exécute un SELECT et renvoie une liste de lignes {variable: valeur}."""
    try:
        resp = requests.post(
            FUSEKI_URL,
            data={"query": PREFIXES + query},
            headers={"Accept": "application/sparql-results+json"},
            timeout=10,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise SparqlError(f"Fuseki injoignable ou requête invalide : {exc}") from exc

    rows = resp.json()["results"]["bindings"]
    # Un GROUP BY sans résultat renvoie une ligne vide : on l'ignore
    return [{k: _convert(v) for k, v in row.items()} for row in rows if row]
