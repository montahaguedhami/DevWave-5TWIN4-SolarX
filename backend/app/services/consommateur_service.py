"""CRUD for ontology consumers and household installation records."""

from fastapi import HTTPException, status

from app.schemas.consommateur import Consumer, ConsumerEquipment, ConsumerType, ConsumerWrite
from app.services.fuseki import FusekiClient, decimal_literal, iri, local_name, string_literal
from app.services.localisation_service import _slugify

CONSUMER_TYPES = tuple(item.value for item in ConsumerType)
CONSUMER_VALUES = " ".join(f"solarx:{item}" for item in CONSUMER_TYPES)
LOCATION_VALUES = "solarx:Ville solarx:Region"
EQUIPMENT_VALUES = "solarx:Capteur solarx:CompteurIntelligent solarx:Onduleur solarx:Equipement"


class ConsumerService:
    def __init__(self, fuseki: FusekiClient) -> None:
        self.fuseki = fuseki

    def _rows(self, consumer_id: str | None = None, type_name: str | None = None):
        filters = []
        if consumer_id:
            filters.append(f"FILTER(?consumer = {iri(consumer_id)})")
        if type_name:
            filters.append(f"FILTER(?type = solarx:{type_name})")
        return self.fuseki.select(f"""
            SELECT ?consumer ?nom ?type ?surface ?location ?locationName ?equipment ?equipmentName ?equipmentType WHERE {{
              ?consumer a ?type . VALUES ?type {{ {CONSUMER_VALUES} }}
              OPTIONAL {{ ?consumer solarx:nom ?nom }}
              OPTIONAL {{ ?consumer solarx:surfaceM2 ?surface }}
              OPTIONAL {{ ?consumer solarx:situeDans ?location . ?location a ?locationType . VALUES ?locationType {{ {LOCATION_VALUES} }} OPTIONAL {{ ?location solarx:nom ?locationName }} }}
              OPTIONAL {{ ?consumer solarx:possede ?equipment . ?equipment a ?equipmentType . VALUES ?equipmentType {{ {EQUIPMENT_VALUES} }} OPTIONAL {{ ?equipment solarx:nom ?equipmentName }} }}
              {' '.join(filters)}
            }} ORDER BY ?consumer ?equipment
        """)

    @staticmethod
    def _convert(rows: list[dict[str, str]]) -> Consumer:
        first = rows[0]
        equipment = {}
        for row in rows:
            if row.get("equipment") and row.get("equipmentType"):
                identifier = local_name(row["equipment"])
                equipment[identifier] = ConsumerEquipment(
                    id=identifier,
                    nom=row.get("equipmentName") or identifier,
                    type=local_name(row["equipmentType"]),
                )
        location = None
        if first.get("location"):
            location_id = local_name(first["location"])
            location = {"id": location_id, "nom": first.get("locationName") or location_id}
        identifier = local_name(first["consumer"])
        return Consumer(
            id=identifier,
            nom=first.get("nom") or identifier,
            type=local_name(first["type"]),
            surface_m2=float(first["surface"]) if first.get("surface") else None,
            localisation=location,
            equipements=list(equipment.values()),
        )

    def list_consumers(self, type_name: str | None = None) -> list[Consumer]:
        rows = self._rows(type_name=type_name)
        grouped: dict[str, list[dict[str, str]]] = {}
        for row in rows:
            grouped.setdefault(row["consumer"], []).append(row)
        return [self._convert(group) for group in grouped.values()]

    def get_consumer(self, consumer_id: str) -> Consumer:
        rows = self._rows(consumer_id=consumer_id)
        if not rows:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Consommateur introuvable : {consumer_id}")
        return self._convert(rows)

    def list_equipment(self) -> list[ConsumerEquipment]:
        rows = self.fuseki.select(f"""
            SELECT ?equipment ?name ?type WHERE {{
              ?equipment a ?type . VALUES ?type {{ {EQUIPMENT_VALUES} }}
              OPTIONAL {{ ?equipment solarx:nom ?name }}
            }} ORDER BY LCASE(STR(COALESCE(?name, ?equipment)))
        """)
        found = {}
        for row in rows:
            identifier = local_name(row["equipment"])
            found.setdefault(identifier, ConsumerEquipment(
                id=identifier,
                nom=row.get("name") or identifier,
                type=local_name(row["type"]),
            ))
        return list(found.values())

    def _validate_location(self, location_id: str | None) -> str | None:
        if location_id is None:
            return None
        location = iri(location_id)
        if not self.fuseki.ask(f"ASK {{ {location} a ?type . VALUES ?type {{ {LOCATION_VALUES} }} }}"):
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Localisation introuvable : {location_id}")
        return location

    def _validate_equipment(self, equipment_ids: list[str]) -> list[str]:
        validated = []
        for equipment_id in dict.fromkeys(equipment_ids):
            equipment = iri(equipment_id)
            if not self.fuseki.ask(f"ASK {{ {equipment} a ?type . VALUES ?type {{ {EQUIPMENT_VALUES} }} }}"):
                raise HTTPException(status.HTTP_404_NOT_FOUND, f"Équipement introuvable : {equipment_id}")
            validated.append(equipment)
        return validated

    def create_consumer(self, data: ConsumerWrite) -> Consumer:
        identifier = _slugify(data.nom)
        subject = iri(identifier)
        if self.fuseki.ask(f"ASK {{ {{ {subject} ?p ?o }} UNION {{ ?s ?p {subject} }} }}"):
            raise HTTPException(status.HTTP_409_CONFLICT, f"L'identifiant {identifier} existe déjà dans l'ontologie.")
        location = self._validate_location(data.localisation_id)
        equipment = self._validate_equipment(data.equipement_ids)
        triples = [f"{subject} a owl:NamedIndividual, solarx:{data.type.value} ; solarx:nom {string_literal(data.nom)} ."]
        if data.surface_m2 is not None:
            triples.append(f"{subject} solarx:surfaceM2 {decimal_literal(data.surface_m2)} .")
        if location:
            triples.append(f"{subject} solarx:situeDans {location} .")
        triples.extend(f"{subject} solarx:possede {item} ." for item in equipment)
        self.fuseki.update("INSERT DATA { " + " ".join(triples) + " }")
        return self.get_consumer(identifier)

    def update_consumer(self, consumer_id: str, data: ConsumerWrite) -> Consumer:
        subject = iri(consumer_id)
        self.get_consumer(consumer_id)
        location = self._validate_location(data.localisation_id)
        equipment = self._validate_equipment(data.equipement_ids)
        for predicate in ("nom", "surfaceM2"):
            self.fuseki.update(f"DELETE WHERE {{ {subject} solarx:{predicate} ?value }}")
        self.fuseki.update(f"DELETE {{ {subject} solarx:situeDans ?location }} WHERE {{ {subject} solarx:situeDans ?location . ?location a ?type . VALUES ?type {{ {LOCATION_VALUES} }} }}")
        self.fuseki.update(f"DELETE {{ {subject} solarx:possede ?equipment }} WHERE {{ {subject} solarx:possede ?equipment . ?equipment a ?type . VALUES ?type {{ {EQUIPMENT_VALUES} }} }}")
        self.fuseki.update(f"DELETE {{ {subject} a ?oldType }} WHERE {{ {subject} a ?oldType . VALUES ?oldType {{ {CONSUMER_VALUES} }} }}")
        triples = [f"{subject} a solarx:{data.type.value} ; solarx:nom {string_literal(data.nom)} ."]
        if data.surface_m2 is not None:
            triples.append(f"{subject} solarx:surfaceM2 {decimal_literal(data.surface_m2)} .")
        if location:
            triples.append(f"{subject} solarx:situeDans {location} .")
        triples.extend(f"{subject} solarx:possede {item} ." for item in equipment)
        self.fuseki.update("INSERT DATA { " + " ".join(triples) + " }")
        return self.get_consumer(consumer_id)

    def delete_consumer(self, consumer_id: str) -> None:
        subject = iri(consumer_id)
        self.get_consumer(consumer_id)
        refs = self.fuseki.select(f"SELECT DISTINCT ?s WHERE {{ ?s ?p {subject} . FILTER(?s != {subject}) }} ORDER BY ?s")
        if refs:
            raise HTTPException(status.HTTP_409_CONFLICT, {
                "message": "Ce consommateur est référencé par d'autres éléments de l'ontologie.",
                "dependances": [local_name(row["s"]) for row in refs],
            })
        self.fuseki.update(f"DELETE WHERE {{ {subject} ?p ?o }}")
