import logging
from functools import lru_cache
from pathlib import Path
from threading import Lock

import httpx
from rdflib import BNode, Graph, Namespace, RDF

from app.core.config import settings
from app.services.fuseki import FusekiUnavailable


logger = logging.getLogger(__name__)
SOLARX = Namespace("http://www.semanticweb.org/monta/ontologies/2026/10/SolarX#")
BOOTSTRAP_GRAPH = "<urn:solarx:bootstrap:localisation-meteo>"
SEED_MARKER = '<urn:solarx:bootstrap:seed> <urn:solarx:bootstrap:version> "1"'
SCHEMA_MARKER = '<urn:solarx:bootstrap:schema> <urn:solarx:bootstrap:version> "1"'
_lock = Lock()
_ready = False


@lru_cache
def module_graphs() -> tuple[Graph, Graph]:
    ontology = Graph().parse(settings.ONTOLOGY_FILE, format="xml")
    schema = Graph()
    pending = [SOLARX[name] for name in (
        "Localisation", "Region", "Ville", "ConditionMeteo", "Temperature",
        "Ensoleillement", "Precipitation", "VitesseVent", "Humidite", "CouvertureNuageuse",
        "latitude", "longitude", "sourceDonnees", "dateRecuperation",
        "situeDans", "contientLocalement", "nom", "valeur", "unite", "dateMesure",
    )]
    visited = set()
    while pending:
        subject = pending.pop()
        if subject in visited:
            continue
        visited.add(subject)
        for triple in ontology.triples((subject, None, None)):
            schema.add(triple)
            if isinstance(triple[2], BNode):
                pending.append(triple[2])

    seeds = Graph()
    subjects = set(ontology.subjects(RDF.type, SOLARX.Region)) | set(ontology.subjects(RDF.type, SOLARX.Ville))
    for subject in subjects:
        for triple in ontology.triples((subject, None, None)):
            seeds.add(triple)
    return schema, seeds


def initialise_module_data(client) -> None:
    schema, seeds = module_graphs()
    named_schema = Graph()
    for subject, predicate, obj in schema:
        if not isinstance(subject, BNode) and not isinstance(obj, BNode):
            named_schema.add((subject, predicate, obj))
    client.update(f"INSERT DATA {{ {named_schema.serialize(format='nt')} }}")
    client.update(f"""
        INSERT {{
            {schema.serialize(format='nt')}
            GRAPH {BOOTSTRAP_GRAPH} {{ {SCHEMA_MARKER} }}
        }} WHERE {{ FILTER NOT EXISTS {{ GRAPH {BOOTSTRAP_GRAPH} {{ {SCHEMA_MARKER} }} }} }}
    """)

    # A persistent marker prevents deleted seed cities from reappearing after a restart.
    operations = []
    for subject in set(seeds.subjects()):
        triples = "\n".join(
            f"{subject.n3()} {predicate.n3()} {obj.n3()} ."
            for predicate, obj in seeds.predicate_objects(subject)
        )
        operations.append(f"""
            INSERT {{ {triples} }} WHERE {{
                FILTER NOT EXISTS {{ GRAPH {BOOTSTRAP_GRAPH} {{ {SEED_MARKER} }} }}
                FILTER NOT EXISTS {{ {subject.n3()} ?predicate ?value }}
            }}
        """)
    operations.append(f"INSERT DATA {{ GRAPH {BOOTSTRAP_GRAPH} {{ {SEED_MARKER} }} }}")
    client.update(" ;\n".join(operations))


def ensure_semantic_modules(client) -> None:
    global _ready
    if _ready:
        return
    with _lock:
        if _ready:
            return
        try:
            client.ask("ASK { ?subject ?predicate ?value }")
        except FusekiUnavailable:
            base = settings.FUSEKI_URL.rstrip("/")
            try:
                response = httpx.post(
                    f"{base}/$/datasets",
                    data={"dbName": settings.FUSEKI_DATASET, "dbType": "tdb2"},
                    auth=client.auth,
                    timeout=10.0,
                )
                if response.status_code not in (200, 201, 409):
                    raise FusekiUnavailable("Impossible de créer le dataset Fuseki. Vérifiez le serveur et ses droits d'accès.")
            except httpx.HTTPError as exc:
                raise FusekiUnavailable("Démarrez Fuseki avec une base persistante pour utiliser Localisation et Météo.") from exc
        try:
            initialise_module_data(client)
        except (OSError, ValueError) as exc:
            raise FusekiUnavailable(f"Impossible de lire l'ontologie configurée : {Path(settings.ONTOLOGY_FILE).name}") from exc
        _ready = True
        logger.info("Modules Localisation et ConditionMeteo initialisés sans remplacement des données.")