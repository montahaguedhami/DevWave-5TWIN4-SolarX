"""Minimal SPARQL 1.1 client for Apache Jena Fuseki + safe term builders.

Every value inserted into a SPARQL string MUST go through one of the helpers
below (``iri``, ``string_literal``, ``decimal_literal``, ``datetime_literal``)
to prevent SPARQL injection.
"""

import re
from datetime import datetime
from decimal import Decimal

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

SOLARX_NS = "http://www.semanticweb.org/monta/ontologies/2026/10/SolarX#"

PREFIXES = f"""PREFIX solarx: <{SOLARX_NS}>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
"""

LOCAL_NAME_PATTERN = r"^[A-Za-z][A-Za-z0-9_]{0,99}$"
_LOCAL_NAME_RE = re.compile(LOCAL_NAME_PATTERN)
_DATETIME_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?$")


class FusekiUnavailable(HTTPException):
    def __init__(self, detail: str) -> None:
        super().__init__(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)


def iri(local_name: str) -> str:
    if not _LOCAL_NAME_RE.fullmatch(local_name):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Identifiant invalide : {local_name!r}")
    return f"solarx:{local_name}"


def local_name(uri: str) -> str:
    return uri.removeprefix(SOLARX_NS)


def string_literal(value: str) -> str:
    escaped = (
        value.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
        .replace("\r", "\\r")
    )
    return f'"{escaped}"^^xsd:string'


def decimal_literal(value: float) -> str:
    return f'"{format(Decimal(repr(float(value))), "f")}"^^xsd:decimal'


def datetime_literal(value: str | datetime) -> str:
    text = value.isoformat(timespec="seconds") if isinstance(value, datetime) else value
    if not _DATETIME_RE.fullmatch(text):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Date invalide : {text!r}")
    return f'"{text}"^^xsd:dateTime'


class FusekiClient:
    def __init__(self) -> None:
        self.base_url = f"{settings.FUSEKI_URL.rstrip('/')}/{settings.FUSEKI_DATASET}"
        self.auth = (
            (settings.FUSEKI_USER, settings.FUSEKI_PASSWORD or "")
            if settings.FUSEKI_USER
            else None
        )

    def _post(self, endpoint: str, data: dict[str, str], accept: str | None = None) -> httpx.Response:
        headers = {"Accept": accept} if accept else {}
        try:
            response = httpx.post(
                f"{self.base_url}/{endpoint}",
                data=data,
                headers=headers,
                auth=self.auth,
                timeout=15.0,
            )
        except httpx.HTTPError as exc:
            raise FusekiUnavailable(
                f"Fuseki injoignable ({self.base_url}). Démarrez Fuseki et chargez l'ontologie."
            ) from exc
        if response.status_code >= 400:
            raise FusekiUnavailable(f"Erreur Fuseki {response.status_code} : {response.text[:300]}")
        return response

    def select(self, query: str) -> list[dict[str, str]]:
        response = self._post(
            "query", {"query": PREFIXES + query}, "application/sparql-results+json"
        )
        bindings = response.json()["results"]["bindings"]
        return [{var: cell["value"] for var, cell in row.items()} for row in bindings]

    def ask(self, query: str) -> bool:
        response = self._post(
            "query", {"query": PREFIXES + query}, "application/sparql-results+json"
        )
        return bool(response.json()["boolean"])

    def update(self, update: str) -> None:
        self._post("update", {"update": PREFIXES + update})


def get_fuseki() -> FusekiClient:
    return FusekiClient()
