"""Query and CRUD helpers for production installations."""


from fastapi import HTTPException, status

from app.schemas.production import InstallationType, InstallationWrite, ProductionInstallation, ProductionSource, SourceType
from app.services.fuseki import FusekiClient, decimal_literal, iri, local_name, string_literal
from app.services.localisation_service import _slugify

INSTALLATION_TYPES = tuple(item.value for item in InstallationType)
SOURCE_TYPES = tuple(item.value for item in SourceType)
_INSTALLATION_VALUES = " ".join(f"solarx:{item}" for item in INSTALLATION_TYPES)
_SOURCE_VALUES = " ".join(f"solarx:{item}" for item in SOURCE_TYPES)
_DEDUCED_SOURCE = {
    "CentraleSolaire": "Solaire",
    "ParcEolien": "Eolienne",
    "CentraleHydraulique": "Hydraulique",
}


class InstallationService:
    """List and retrieve production individuals with incomplete data tolerated."""

    def __init__(self, fuseki: FusekiClient) -> None:
        self.fuseki = fuseki

    def _rows(self, installation_id: str | None = None, type_name: str | None = None) -> list[dict[str, str]]:
        filters = []
        if installation_id:
            filters.append(f"FILTER(?installation = {iri(installation_id)})")
        if type_name:
            if type_name not in INSTALLATION_TYPES:
                raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Type d’installation invalide")
            filters.append(f"FILTER(?type = solarx:{type_name})")
        return self.fuseki.select(
            f"""
            SELECT ?installation ?nom ?type ?power ?ville ?villeNom ?source ?sourceNom ?sourceType WHERE {{
              ?installation a ?type . VALUES ?type {{ {_INSTALLATION_VALUES} }}
              OPTIONAL {{ ?installation solarx:nom ?nom }}
              OPTIONAL {{ ?installation solarx:puissanceKW ?power }}
              OPTIONAL {{
                ?installation solarx:situeDans ?ville . ?ville a solarx:Ville .
                OPTIONAL {{ ?ville solarx:nom ?villeNom }}
              }}
              OPTIONAL {{
                ?installation (solarx:utiliseSource|solarx:produitEnergie) ?source .
                ?source a ?sourceType . VALUES ?sourceType {{ {_SOURCE_VALUES} }}
                OPTIONAL {{ ?source solarx:nom ?sourceNom }}
              }}
              {' '.join(filters)}
            }} ORDER BY ?installation ?source
            """
        )

    @staticmethod
    def _to_installation(rows: list[dict[str, str]]) -> ProductionInstallation:
        first = rows[0]
        installation_type = local_name(first["type"])
        sources: dict[str, ProductionSource] = {}
        for row in rows:
            if "source" in row and "sourceType" in row:
                source_id = local_name(row["source"])
                sources[source_id] = ProductionSource(
                    id=source_id,
                    nom=row.get("sourceNom") or source_id,
                    type=local_name(row["sourceType"]),
                )

        ville = None
        if "ville" in first:
            ville_id = local_name(first["ville"])
            ville = {"id": ville_id, "nom": first.get("villeNom") or ville_id}

        if sources:
            source = next(iter(sources.values()))
            source_deduite = False
        else:
            source = ProductionSource(type=_DEDUCED_SOURCE[installation_type])
            source_deduite = True

        return ProductionInstallation(
            id=local_name(first["installation"]),
            nom=first.get("nom") or local_name(first["installation"]),
            type=installation_type,
            puissance_kw=float(first["power"]) if first.get("power") else None,
            ville=ville,
            source=source,
            source_deduite=source_deduite,
        )

    def list_installations(self, type_name: str | None = None,
                           source_type: str | None = None) -> list[ProductionInstallation]:
        if source_type and source_type not in SOURCE_TYPES:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Type de source invalide")
        rows = self._rows(type_name=type_name)
        grouped: dict[str, list[dict[str, str]]] = {}
        for row in rows:
            grouped.setdefault(row["installation"], []).append(row)
        installations = [self._to_installation(group) for group in grouped.values()]
        if source_type:
            installations = [item for item in installations if item.source.type == source_type]
        return installations

    def get_installation(self, installation_id: str) -> ProductionInstallation:
        rows = self._rows(installation_id=installation_id)
        if not rows:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Installation introuvable : {installation_id}")
        return self._to_installation(rows)

    def _ensure_reference(self, identifier: str | None, class_name: str, label: str) -> str | None:
        if identifier is None:
            return None
        subject = iri(identifier)
        if not self.fuseki.ask(f"ASK {{ {subject} a solarx:{class_name} }}"):
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"{label} introuvable : {identifier}")
        return subject

    def _write(self, identifier: str, data: InstallationWrite, create: bool) -> ProductionInstallation:
        subject = iri(identifier)
        ville = self._ensure_reference(data.ville_id, "Ville", "Ville")
        source = None
        if data.source_id:
            source_iri = iri(data.source_id)
            if not self.fuseki.ask(f"ASK {{ {source_iri} a ?type . VALUES ?type {{ {_SOURCE_VALUES} }} }}"):
                raise HTTPException(status.HTTP_404_NOT_FOUND, f"Source introuvable : {data.source_id}")
            source = source_iri
        if create and self.fuseki.ask(f"ASK {{ {{ {subject} ?p ?o }} UNION {{ ?s ?p {subject} }} }}"):
            raise HTTPException(status.HTTP_409_CONFLICT, f"Identifiant déjà utilisé : {identifier}")
        if not create and not self.fuseki.ask(f"ASK {{ {subject} a ?type . VALUES ?type {{ {_INSTALLATION_VALUES} }} }}"):
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Installation introuvable : {identifier}")
        if not create:
            for predicate in ("nom", "puissanceKW", "situeDans", "utiliseSource", "produitEnergie"):
                self.fuseki.update(f"DELETE WHERE {{ {subject} solarx:{predicate} ?value }}")
            self.fuseki.update(f"DELETE {{ {subject} a ?oldType }} WHERE {{ {subject} a ?oldType . VALUES ?oldType {{ {_INSTALLATION_VALUES} }} }}")
        triples = [f"{subject} a owl:NamedIndividual, solarx:{data.type.value} ; solarx:nom {string_literal(data.nom)} ."]
        if data.puissance_kw is not None:
            triples.append(f"{subject} solarx:puissanceKW {decimal_literal(data.puissance_kw)} .")
        if ville:
            triples.append(f"{subject} solarx:situeDans {ville} .")
        if source:
            triples.append(f"{subject} solarx:utiliseSource {source} .")
        self.fuseki.update("INSERT DATA { " + " ".join(triples) + " }")
        return self.get_installation(identifier)

    def create_installation(self, data: InstallationWrite) -> ProductionInstallation:
        identifier = _slugify(data.nom)
        if self.fuseki.ask(f"ASK {{ {{ {iri(identifier)} ?p ?o }} UNION {{ ?s ?p {iri(identifier)} }} }}"):
            raise HTTPException(status.HTTP_409_CONFLICT, f"L'identifiant {identifier} existe déjà dans l'ontologie.")
        return self._write(identifier, data, True)

    def update_installation(self, installation_id: str, data: InstallationWrite) -> ProductionInstallation:
        return self._write(installation_id, data, False)

    def delete_installation(self, installation_id: str) -> None:
        subject = iri(installation_id)
        if not self.fuseki.ask(f"ASK {{ {subject} a ?type . VALUES ?type {{ {_INSTALLATION_VALUES} }} }}"):
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Installation introuvable : {installation_id}")
        references = self.fuseki.select(f"SELECT DISTINCT ?s WHERE {{ ?s ?p {subject} . FILTER(?s != {subject}) }} ORDER BY ?s")
        if references:
            names = [local_name(row["s"]) for row in references]
            raise HTTPException(status.HTTP_409_CONFLICT, {"message": "Cette installation est référencée.", "dependances": names})
        self.fuseki.update(f"DELETE WHERE {{ {subject} ?p ?o }}")
