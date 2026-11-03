"""CRUD helpers for ontology energy sources."""


from fastapi import HTTPException, status

from app.schemas.production import InstallationType, ProductionInstallation, SourceEnergie, SourceType, SourceWrite
from app.services.fuseki import FusekiClient, iri, local_name, string_literal
from app.services.installation_service import InstallationService
from app.services.localisation_service import _slugify

SOURCE_VALUES = " ".join(f"solarx:{item.value}" for item in SourceType)
INSTALLATION_VALUES = " ".join(f"solarx:{item.value}" for item in InstallationType)


class SourceEnergieService:
    def __init__(self, fuseki: FusekiClient) -> None:
        self.fuseki = fuseki
        self.installations = InstallationService(fuseki)

    def _rows(self, source_id: str | None = None, type_name: str | None = None, q: str | None = None):
        filters = []
        if source_id:
            filters.append(f"FILTER(?source = {iri(source_id)})")
        if type_name:
            filters.append(f"FILTER(?type = solarx:{type_name})")
        if q:
            from app.services.fuseki import string_literal
            filters.append(f"FILTER(CONTAINS(LCASE(STR(?nom)), LCASE({string_literal(q)})))")
        query = f"""
        SELECT ?source ?nom ?type (COUNT(DISTINCT ?installation) AS ?count) WHERE {{
          ?source a ?type . VALUES ?type {{ {SOURCE_VALUES} }}
          OPTIONAL {{ ?source solarx:nom ?nom }}
          OPTIONAL {{ {{ ?installation solarx:utiliseSource ?source }} UNION {{ ?installation solarx:produitEnergie ?source }} ?installation a ?it . VALUES ?it {{ {INSTALLATION_VALUES} }} }}
          {' '.join(filters)}
        }} GROUP BY ?source ?nom ?type ORDER BY LCASE(STR(COALESCE(?nom, ?source)))
        """
        return self.fuseki.select(query)

    @staticmethod
    def _convert(row) -> SourceEnergie:
        identifier = local_name(row["source"])
        return SourceEnergie(id=identifier, nom=row.get("nom") or identifier, type=local_name(row["type"]), nombre_installations=int(row.get("count", 0)))

    def list_sources(self, type_name: str | None = None, q: str | None = None) -> list[SourceEnergie]:
        return [self._convert(row) for row in self._rows(type_name=type_name, q=q)]

    def get_source(self, source_id: str) -> SourceEnergie:
        rows = self._rows(source_id=source_id)
        if not rows:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Source introuvable : {source_id}")
        return self._convert(rows[0])

    def create_source(self, data: SourceWrite) -> SourceEnergie:
        identifier = _slugify(data.nom)
        if self.fuseki.ask(f"ASK {{ {{ {iri(identifier)} ?p ?o }} UNION {{ ?s ?p {iri(identifier)} }} }}"):
            raise HTTPException(status.HTTP_409_CONFLICT, f"L'identifiant {identifier} existe déjà dans l'ontologie.")
        subject = iri(identifier)
        self.fuseki.update(f"INSERT DATA {{ {subject} a owl:NamedIndividual, solarx:{data.type.value} ; solarx:nom {string_literal(data.nom)} . }}")
        return self.get_source(identifier)

    def update_source(self, source_id: str, data: SourceWrite) -> SourceEnergie:
        subject = iri(source_id)
        self.get_source(source_id)
        self.fuseki.update(f"DELETE WHERE {{ {subject} solarx:nom ?nom }}")
        self.fuseki.update(f"DELETE {{ {subject} a ?oldType }} WHERE {{ {subject} a ?oldType . VALUES ?oldType {{ {SOURCE_VALUES} }} }}")
        self.fuseki.update(f"INSERT DATA {{ {subject} a solarx:{data.type.value} ; solarx:nom {string_literal(data.nom)} . }}")
        return self.get_source(source_id)

    def delete_source(self, source_id: str) -> None:
        subject = iri(source_id)
        self.get_source(source_id)
        refs = self.fuseki.select(f"SELECT DISTINCT ?s WHERE {{ {{ ?s solarx:utiliseSource {subject} }} UNION {{ ?s solarx:produitEnergie {subject} }} ?s a ?type . VALUES ?type {{ {INSTALLATION_VALUES} }} }} ORDER BY ?s")
        if refs:
            raise HTTPException(status.HTTP_409_CONFLICT, {"message": "Cette source est utilisée par des installations.", "dependances": [local_name(row["s"]) for row in refs]})
        self.fuseki.update(f"DELETE WHERE {{ {subject} ?p ?o }}")

    def installations_for_source(self, source_id: str) -> list[ProductionInstallation]:
        self.get_source(source_id)
        rows = self.fuseki.select(f"SELECT DISTINCT ?installation WHERE {{ {{ ?installation solarx:utiliseSource {iri(source_id)} }} UNION {{ ?installation solarx:produitEnergie {iri(source_id)} }} ?installation a ?type . VALUES ?type {{ {INSTALLATION_VALUES} }} }} ORDER BY ?installation")
        return [self.installations.get_installation(local_name(row["installation"])) for row in rows]
