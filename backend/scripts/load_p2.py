"""Charge database/p2_stockage_equipement.ttl (module P2) dans le dataset Fuseki.

Usage (depuis backend/) :  python -m scripts.load_p2

À lancer APRÈS ``python -m scripts.load_ontology`` (qui charge solarx.owl).
Les triplets sont fusionnés (POST) : solarx.owl et les données des autres
modules ne sont pas touchés.
"""

from pathlib import Path

import httpx
from rdflib import Graph

from app.core.config import settings

TTL_FILE = Path(__file__).resolve().parents[2] / "database" / "p2_stockage_equipement.ttl"


def main() -> None:
    graph = Graph()
    graph.parse(TTL_FILE, format="turtle")
    print(f"Fichier valide : {len(graph)} triplets lus depuis {TTL_FILE.name}")

    base = settings.FUSEKI_URL.rstrip("/")
    auth = (settings.FUSEKI_USER, settings.FUSEKI_PASSWORD or "") if settings.FUSEKI_USER else None
    response = httpx.post(
        f"{base}/{settings.FUSEKI_DATASET}/data",
        params={"default": ""},
        content=graph.serialize(format="turtle").encode("utf-8"),
        headers={"Content-Type": "text/turtle; charset=utf-8"},
        auth=auth,
        timeout=30,
    )
    response.raise_for_status()
    print(f"Module P2 chargé dans {base}/{settings.FUSEKI_DATASET} (fusion)")


if __name__ == "__main__":
    main()
