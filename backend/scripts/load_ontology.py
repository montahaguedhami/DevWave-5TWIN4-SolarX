"""Load database/solarx.owl into the Fuseki dataset.

Usage (from backend/):  python -m scripts.load_ontology [--replace]

* Parses the OWL file with RDFLib (fails fast if the RDF/XML is invalid).
* Creates the Fuseki dataset (TDB2) if it does not exist.
* Uploads the triples into the default graph. Without ``--replace`` the
  triples are merged (POST) so data saved from the app is kept; with
  ``--replace`` the default graph is overwritten (PUT).
"""

import sys
from pathlib import Path

import httpx
from rdflib import BNode, Graph, Namespace, RDFS

from app.core.config import settings

OWL_FILE = Path(__file__).resolve().parents[2] / "database" / "solarx.owl"


def meteo_schema(graph: Graph) -> Graph:
    solarx = Namespace("http://www.semanticweb.org/monta/ontologies/2026/10/SolarX#")
    subjects = {
        solarx.ConditionMeteo,
        solarx.sourceDonnees,
        solarx.dateRecuperation,
        *graph.subjects(RDFS.subClassOf, solarx.ConditionMeteo),
    }
    schema = Graph()
    pending = list(subjects)
    visited = set()
    while pending:
        subject = pending.pop()
        if subject in visited:
            continue
        visited.add(subject)
        for triple in graph.triples((subject, None, None)):
            schema.add(triple)
            if isinstance(triple[2], BNode):
                pending.append(triple[2])
    return schema


def main() -> None:
    replace = "--replace" in sys.argv
    schema_only = "--meteo-schema" in sys.argv
    if schema_only and replace:
        raise SystemExit("--meteo-schema ne peut pas être combiné avec --replace.")
    graph = Graph()
    graph.parse(OWL_FILE, format="xml")
    if schema_only:
        graph = meteo_schema(graph)
    print(f"Ontologie valide : {len(graph)} triplets lus depuis {OWL_FILE.name}")

    base = settings.FUSEKI_URL.rstrip("/")
    auth = (settings.FUSEKI_USER, settings.FUSEKI_PASSWORD or "") if settings.FUSEKI_USER else None

    datasets = httpx.get(f"{base}/$/datasets", auth=auth, timeout=10).json()["datasets"]
    if f"/{settings.FUSEKI_DATASET}" not in {d["ds.name"] for d in datasets}:
        httpx.post(
            f"{base}/$/datasets",
            data={"dbName": settings.FUSEKI_DATASET, "dbType": "tdb2"},
            auth=auth,
            timeout=10,
        ).raise_for_status()
        print(f"Dataset /{settings.FUSEKI_DATASET} créé (TDB2)")

    method = httpx.put if replace else httpx.post
    response = method(
        f"{base}/{settings.FUSEKI_DATASET}/data",
        params={"default": ""},
        content=graph.serialize(format="turtle").encode("utf-8"),
        headers={"Content-Type": "text/turtle; charset=utf-8"},
        auth=auth,
        timeout=30,
    )
    response.raise_for_status()
    print(f"Chargé dans {base}/{settings.FUSEKI_DATASET} ({'remplacement' if replace else 'fusion'})")


if __name__ == "__main__":
    main()
