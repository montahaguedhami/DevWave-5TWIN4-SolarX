"""Business logic for the Mesure module (solarx:Mesure and sub-classes)."""

from fastapi import HTTPException, status

from app.schemas.mesure import Mesure, MesureCreate
from app.services.fuseki import (
    FusekiClient,
    datetime_literal,
    decimal_literal,
    iri,
    local_name,
    string_literal,
)

TYPES_MESURE = {"MesureConsommation", "MesureProduction", "MesureStockage"}


def _to_mesure(row: dict) -> Mesure:
    return Mesure(
        id=local_name(row["m"]),
        type=local_name(row["type"]),
        valeur=float(row["valeur"]),
        unite=row.get("unite") or "",
        dateMesure=row.get("date") or "",
        concerne=local_name(row["concerne"]) if "concerne" in row else "",
        concerneType=local_name(row["concerneType"]) if "concerneType" in row else None,
        mesureePar=local_name(row["mesureePar"]) if "mesureePar" in row else None,
        sourceDonnees=row.get("source"),
    )


_LIST_QUERY = """
SELECT ?m ?type ?valeur ?unite ?date ?concerne ?concerneType ?mesureePar ?source WHERE {{
  ?m a ?type . ?type rdfs:subClassOf* solarx:Mesure . FILTER(?type != solarx:Mesure)
  ?m solarx:valeur ?valeur .
  OPTIONAL {{ ?m solarx:unite ?unite }}
  OPTIONAL {{ ?m solarx:dateMesure ?date }}
  OPTIONAL {{ ?m solarx:concerne ?concerne }}
  OPTIONAL {{ ?concerne a ?concerneType }}
  OPTIONAL {{ ?m solarx:mesureePar ?mesureePar }}
  OPTIONAL {{ ?m solarx:sourceDonnees ?source }}
  {filters}
}}
ORDER BY DESC(?date) ?m
"""


class MesureService:
    def __init__(self, fuseki: FusekiClient) -> None:
        self.fuseki = fuseki

    def _ensure_type(self, type_: str) -> None:
        if type_ not in TYPES_MESURE:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Type de mesure inconnu : {type_!r}")

    def list_mesures(
        self,
        type_: str | None = None,
        concerne: str | None = None,
        debut: str | None = None,
        fin: str | None = None,
        source: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Mesure]:
        filters = []
        if type_:
            self._ensure_type(type_)
            filters.append(f"FILTER(?type = solarx:{type_})")
        if concerne:
            filters.append(f"FILTER(?concerne = {iri(concerne)})")
        if debut:
            filters.append(f"FILTER(?date >= {datetime_literal(f'{debut}T00:00:00')})")
        if fin:
            filters.append(f"FILTER(?date <= {datetime_literal(f'{fin}T23:59:59')})")
        if source:
            filters.append(f"FILTER(?source = {string_literal(source)})")
        query = _LIST_QUERY.format(filters="\n  ".join(filters)) + f"\nOFFSET {int(skip)} LIMIT {int(limit)}"
        rows = self.fuseki.select(query)
        result: dict[str, Mesure] = {}
        for row in rows:
            m = _to_mesure(row)
            result.setdefault(m.id, m)
        return list(result.values())

    def get_mesure(self, mesure_id: str) -> Mesure:
        rows = self.fuseki.select(_LIST_QUERY.format(filters=f"FILTER(?m = {iri(mesure_id)})"))
        if not rows:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Mesure introuvable : {mesure_id}")
        return _to_mesure(rows[0])

    def create_mesure(self, data: MesureCreate) -> Mesure:
        self._ensure_type(data.type)
        # validate date
        datetime_literal(data.dateMesure if "T" in data.dateMesure else f"{data.dateMesure}T00:00:00")
        # ensure target exists (best-effort: accept any IRI present in the ontology)
        if not self.fuseki.ask(f"ASK {{ {{ {iri(data.concerne)} ?p ?o }} UNION {{ ?s ?p {iri(data.concerne)} }} }}"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Cible inconnue : {data.concerne}")

        mesure_id = f"{data.type}_{data.concerne}".replace(" ", "_")
        # ensure uniqueness
        counter = 1
        base = mesure_id
        while self.fuseki.ask(f"ASK {{ {{ {iri(mesure_id)} ?p ?o }} UNION {{ ?s ?p {iri(mesure_id)} }} }}"):
            mesure_id = f"{base}_{counter}"
            counter += 1

        triples = [
            f"{iri(mesure_id)} a owl:NamedIndividual, solarx:{data.type} ;",
            f"  solarx:valeur {decimal_literal(data.valeur)} ;",
            f"  solarx:unite {string_literal(data.unite)} ;",
            f"  solarx:dateMesure {datetime_literal(data.dateMesure if 'T' in data.dateMesure else f'{data.dateMesure}T00:00:00')} ;",
            f"  solarx:concerne {iri(data.concerne)} .",
        ]
        if data.mesureePar:
            triples[-1] = triples[-1].rstrip(" .") + " ;"
            triples.append(f"  solarx:mesureePar {iri(data.mesureePar)} .")
        if data.sourceDonnees:
            # reopen last triple
            pass
        # Rebuild cleanly to handle optional fields
        triples = [
            f"{iri(mesure_id)} a owl:NamedIndividual, solarx:{data.type} ;",
            f"  solarx:valeur {decimal_literal(data.valeur)} ;",
            f"  solarx:unite {string_literal(data.unite)} ;",
            f"  solarx:dateMesure {datetime_literal(data.dateMesure if 'T' in data.dateMesure else f'{data.dateMesure}T00:00:00')} ;",
            f"  solarx:concerne {iri(data.concerne)}",
        ]
        if data.mesureePar:
            triples[-1] += " ;"
            triples.append(f"  solarx:mesureePar {iri(data.mesureePar)}")
        if data.sourceDonnees:
            triples[-1] += " ;"
            triples.append(f"  solarx:sourceDonnees {string_literal(data.sourceDonnees)}")
        triples[-1] += " ."
        self.fuseki.update("INSERT DATA { " + "\n".join(triples) + " }")
        return self.get_mesure(mesure_id)

    def delete_mesure(self, mesure_id: str) -> dict:
        mesure = iri(mesure_id)
        if not self.fuseki.ask(f"ASK {{ {mesure} a/rdfs:subClassOf solarx:Mesure }}"):
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Mesure introuvable : {mesure_id}")
        self.fuseki.update(f"DELETE WHERE {{ {mesure} ?p ?o }}")
        return {"supprimee": mesure_id}

    def create_mesures_bulk(self, items: list[MesureCreate]) -> list[Mesure]:
        created = []
        for item in items:
            created.append(self.create_mesure(item))
        return created