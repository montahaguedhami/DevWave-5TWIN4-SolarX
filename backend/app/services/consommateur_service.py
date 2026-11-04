"""Business logic for the Consommateur module (merged with installation consumer sites)."""

import re
import unicodedata

from fastapi import HTTPException, status

from app.schemas.consommateur import (
    TYPES_CONSOMMATEUR,
    Consommateur,
    ConsommateurCreate,
    ConsommateurUpdate,
    ConsumerEquipment,
)
from app.services.fuseki import (
    FusekiClient,
    decimal_literal,
    iri,
    local_name,
    string_literal,
)
from app.services.localisation_service import _slugify

TYPES_SET = set(TYPES_CONSOMMATEUR)
CONSUMER_VALUES = " ".join(f"solarx:{item}" for item in TYPES_CONSOMMATEUR)
EQUIPMENT_VALUES = "solarx:Capteur solarx:CompteurIntelligent solarx:Onduleur solarx:Equipement"
LOCATION_VALUES = "solarx:Ville solarx:Region"


def _to_consommateur(row: dict) -> Consommateur:
    equipements = []
    # equipment may be provided separately; keep empty here, filled by get if needed
    return Consommateur(
        id=local_name(row["c"]),
        type=local_name(row["type"]),
        nom=row.get("nom") or local_name(row["c"]),
        surfaceM2=float(row["surface"]) if "surface" in row else None,
        ville=local_name(row["ville"]) if "ville" in row else None,
        villeNom=row.get("villeNom") or (local_name(row["ville"]) if "ville" in row else None),
        latitude=float(row["lat"]) if "lat" in row else None,
        longitude=float(row["lon"]) if "lon" in row else None,
        nbMesures=int(row.get("nbMesures", 0)),
        localisation={"id": local_name(row["ville"]), "nom": row.get("villeNom") or local_name(row["ville"])} if "ville" in row else None,
    )


_LIST_QUERY = """
SELECT ?c ?type ?nom ?surface ?ville ?villeNom ?lat ?lon ?nbMesures WHERE {{
  ?c a ?type .
  ?type rdfs:subClassOf* solarx:Consommateur . FILTER(?type != solarx:Consommateur)
  OPTIONAL {{ ?c solarx:nom ?nom }}
  OPTIONAL {{ ?c solarx:surfaceM2 ?surface }}
  OPTIONAL {{ ?c solarx:situeDans ?ville . ?ville a solarx:Ville .
              OPTIONAL {{ ?ville solarx:nom ?villeNom }}
              OPTIONAL {{ ?ville solarx:latitude ?lat }}
              OPTIONAL {{ ?ville solarx:longitude ?lon }} }}
  OPTIONAL {{ SELECT ?c (COUNT(DISTINCT ?m) AS ?nbMesures) WHERE {{ ?m solarx:concerne ?c ; a/rdfs:subClassOf* solarx:Mesure }} GROUP BY ?c }}
  {filters}
}}
ORDER BY ?type ?nom
"""


class ConsommateurService:
    def __init__(self, fuseki: FusekiClient) -> None:
        self.fuseki = fuseki

    def _ensure_type(self, type_: str) -> None:
        if type_ not in TYPES_SET:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Type de consommateur inconnu : {type_!r}")

    def _ensure_ville(self, ville_id: str) -> None:
        if not self.fuseki.ask(f"ASK {{ {iri(ville_id)} a solarx:Ville }}"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Ville inconnue : {ville_id}")

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

    def list_consumers(self, type_name: str | None = None) -> list[Consommateur]:
        filters = []
        if type_name:
            self._ensure_type(type_name)
            filters.append(f"FILTER(?type = solarx:{type_name})")
        rows = self.fuseki.select(_LIST_QUERY.format(filters="\n  ".join(filters)))
        result: dict[str, Consommateur] = {}
        for row in rows:
            c = _to_consommateur(row)
            result.setdefault(c.id, c)
        # fill equipements
        for c in result.values():
            c.equipements = self._equipements_of(c.id)
        return list(result.values())

    def list_consommateurs(self, type_=None, ville=None, q=None, skip=0, limit=100):
        filters = []
        if type_:
            self._ensure_type(type_)
            filters.append(f"FILTER(?type = solarx:{type_})")
        if ville:
            filters.append(f"FILTER(?ville = {iri(ville)})")
        if q and q.strip():
            filters.append(f"FILTER(CONTAINS(LCASE(STR(COALESCE(?nom, ?c))), LCASE({string_literal(q.strip())})))")
        query = _LIST_QUERY.format(filters="\n  ".join(filters)) + f"\nOFFSET {int(skip)} LIMIT {int(limit)}"
        rows = self.fuseki.select(query)
        result = {}
        for row in rows:
            c = _to_consommateur(row)
            result.setdefault(c.id, c)
        for c in result.values():
            c.equipements = self._equipements_of(c.id)
        return list(result.values())

    def _equipements_of(self, consumer_id: str) -> list[ConsumerEquipment]:
        rows = self.fuseki.select(f"""
            SELECT ?equipment ?name ?type WHERE {{
              {iri(consumer_id)} solarx:possede ?equipment .
              ?equipment a ?type . VALUES ?type {{ {EQUIPMENT_VALUES} }}
              OPTIONAL {{ ?equipment solarx:nom ?name }}
            }}
        """)
        found = {}
        for row in rows:
            identifier = local_name(row["equipment"])
            found.setdefault(identifier, ConsumerEquipment(
                id=identifier, nom=row.get("name") or identifier, type=local_name(row["type"]),
            ))
        return list(found.values())

    def get_consumer(self, consumer_id: str) -> Consommateur:
        items = self.list_consommateurs()  # fallback
        # better: filter
        rows = self.fuseki.select(_LIST_QUERY.format(filters=f"FILTER(?c = {iri(consumer_id)})"))
        if not rows:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Consommateur introuvable : {consumer_id}")
        c = _to_consommateur(rows[0])
        c.equipements = self._equipements_of(consumer_id)
        return c

    def get_consommateur(self, consommateur_id: str) -> Consommateur:
        return self.get_consumer(consommateur_id)

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
                id=identifier, nom=row.get("name") or identifier, type=local_name(row["type"]),
            ))
        return list(found.values())

    def create_consumer(self, data) -> Consommateur:
        return self.create_consommateur(data)

    def create_consommateur(self, data: ConsommateurCreate) -> Consommateur:
        self._ensure_type(data.type)
        self._ensure_ville(data.ville)
        base_id = _slugify(data.nom)
        consommateur_id = base_id
        counter = 2
        while self.fuseki.ask(f"ASK {{ {{ {iri(consommateur_id)} ?p ?o }} UNION {{ ?s ?p {iri(consommateur_id)} }} }}"):
            consommateur_id = f"{base_id}_{counter}"
            counter += 1
        location = self._validate_location(data.ville)
        equipment = self._validate_equipment(data.equipement_ids)
        triples = [f"{iri(consommateur_id)} a owl:NamedIndividual, solarx:{data.type} ; solarx:nom {string_literal(data.nom)} ."]
        if data.surfaceM2 is not None:
            triples.append(f"{iri(consommateur_id)} solarx:surfaceM2 {decimal_literal(data.surfaceM2)} .")
        if location:
            triples.append(f"{iri(consommateur_id)} solarx:situeDans {location} .")
        triples.extend(f"{iri(consommateur_id)} solarx:possede {item} ." for item in equipment)
        self.fuseki.update("INSERT DATA { " + " ".join(triples) + " }")
        return self.get_consommateur(consommateur_id)

    def update_consumer(self, consumer_id: str, data) -> Consommateur:
        return self.update_consommateur(consumer_id, data)

    def update_consommateur(self, consommateur_id: str, data: ConsommateurUpdate) -> Consommateur:
        self._ensure_type(data.type)
        self._ensure_ville(data.ville)
        self.get_consommateur(consommateur_id)
        subject = iri(consommateur_id)
        location = self._validate_location(data.ville)
        equipment = self._validate_equipment(data.equipement_ids)
        for predicate in ("nom", "surfaceM2"):
            self.fuseki.update(f"DELETE WHERE {{ {subject} solarx:{predicate} ?value }}")
        self.fuseki.update(f"DELETE {{ {subject} solarx:situeDans ?location }} WHERE {{ {subject} solarx:situeDans ?location . ?location a ?type . VALUES ?type {{ {LOCATION_VALUES} }} }}")
        self.fuseki.update(f"DELETE {{ {subject} solarx:possede ?equipment }} WHERE {{ {subject} solarx:possede ?equipment . ?equipment a ?type . VALUES ?type {{ {EQUIPMENT_VALUES} }} }}")
        self.fuseki.update(f"DELETE {{ {subject} a ?oldType }} WHERE {{ {subject} a ?oldType . VALUES ?oldType {{ {' '.join('solarx:'+t for t in TYPES_CONSOMMATEUR)} }} }}")
        triples = [f"{subject} a solarx:{data.type} ; solarx:nom {string_literal(data.nom)} ."]
        if data.surfaceM2 is not None:
            triples.append(f"{subject} solarx:surfaceM2 {decimal_literal(data.surfaceM2)} .")
        if location:
            triples.append(f"{subject} solarx:situeDans {location} .")
        triples.extend(f"{subject} solarx:possede {item} ." for item in equipment)
        self.fuseki.update("INSERT DATA { " + " ".join(triples) + " }")
        return self.get_consommateur(consommateur_id)

    def delete_consumer(self, consumer_id: str) -> None:
        self.delete_consommateur(consumer_id)

    def delete_consommateur(self, consommateur_id: str, cascade: bool = False) -> dict:
        self.get_consommateur(consommateur_id)
        subject = iri(consommateur_id)
        refs = self.fuseki.select(f"SELECT DISTINCT ?s WHERE {{ ?s ?p {subject} . FILTER(?s != {subject}) }} ORDER BY ?s")
        if refs and not cascade:
            raise HTTPException(status.HTTP_409_CONFLICT, {
                "message": "Ce consommateur est référencé par d'autres éléments de l'ontologie.",
                "dependances": [local_name(row["s"]) for row in refs],
            })
        # cascade measures
        from app.services.mesure_service import MesureService
        mesures = MesureService(self.fuseki).list_mesures(concerne=consommateur_id)
        mesures_ids = [m.id for m in mesures]
        operations = [f"DELETE WHERE {{ {iri(m)} ?p ?o }}" for m in mesures_ids]
        operations.append(f"DELETE WHERE {{ {subject} ?p ?o }}")
        self.fuseki.update(" ;\n".join(operations))
        return {"supprime": consommateur_id, "mesuresSupprimees": mesures_ids}

    def mesures(self, consommateur_id: str) -> list:
        self.get_consommateur(consommateur_id)
        from app.services.mesure_service import MesureService
        return MesureService(self.fuseki).list_mesures(concerne=consommateur_id)

    def stats(self) -> dict:
        rows = self.fuseki.select("""
            SELECT ?type (COUNT(DISTINCT ?c) AS ?nb) WHERE {
              ?c a ?type . ?type rdfs:subClassOf* solarx:Consommateur . FILTER(?type != solarx:Consommateur)
            } GROUP BY ?type ORDER BY DESC(?nb)
        """)
        total_mesures = self.fuseki.select("SELECT (COUNT(DISTINCT ?m) AS ?n) WHERE { ?m a/rdfs:subClassOf* solarx:Mesure }")
        return {
            "parType": [{"type": local_name(r["type"]), "nombre": int(r["nb"])} for r in rows],
            "totalConsommateurs": sum(int(r["nb"]) for r in rows),
            "totalMesures": int(total_mesures[0]["n"]) if total_mesures else 0,
        }

    def stats_avancees(self) -> dict:
        par_type_consommation = self.fuseki.select("""
            SELECT ?type (SUM(?v) AS ?total) (COUNT(DISTINCT ?m) AS ?nbMesures) WHERE {
              ?m a/rdfs:subClassOf* solarx:MesureConsommation ; solarx:valeur ?v ; solarx:concerne ?c .
              ?c a ?type . ?type rdfs:subClassOf* solarx:Consommateur . FILTER(?type != solarx:Consommateur)
            } GROUP BY ?type ORDER BY DESC(?total)
        """)
        top_rows = self.fuseki.select("""
            SELECT ?c ?nom ?type (SUM(?v) AS ?total) (COUNT(?m) AS ?nb) WHERE {
              ?m a/rdfs:subClassOf* solarx:MesureConsommation ; solarx:valeur ?v ; solarx:concerne ?c .
              ?c a ?type . ?type rdfs:subClassOf* solarx:Consommateur . FILTER(?type != solarx:Consommateur)
              OPTIONAL { ?c solarx:nom ?nom }
            } GROUP BY ?c ?nom ?type ORDER BY DESC(?total) LIMIT 5
        """)
        par_ville = self.fuseki.select("""
            SELECT ?ville ?villeNom (SUM(?v) AS ?total) WHERE {
              ?m a/rdfs:subClassOf* solarx:MesureConsommation ; solarx:valeur ?v ; solarx:concerne ?c .
              ?c solarx:situeDans ?ville . ?ville a solarx:Ville .
              OPTIONAL { ?ville solarx:nom ?villeNom }
            } GROUP BY ?ville ?villeNom ORDER BY DESC(?total)
        """)
        prod = self.fuseki.select("SELECT (SUM(?v) AS ?total) WHERE { ?m a/rdfs:subClassOf* solarx:MesureProduction ; solarx:valeur ?v }")
        conso = self.fuseki.select("SELECT (SUM(?v) AS ?total) WHERE { ?m a/rdfs:subClassOf* solarx:MesureConsommation ; solarx:valeur ?v }")
        total_prod = float(prod[0]["total"]) if prod and "total" in prod[0] else 0.0
        total_conso = float(conso[0]["total"]) if conso and "total" in conso[0] else 0.0
        return {
            "consommationParType": [{"type": local_name(r["type"]), "total": round(float(r["total"]), 2), "nbMesures": int(r["nbMesures"])} for r in par_type_consommation],
            "topConsommateurs": [{"id": local_name(r["c"]), "nom": r.get("nom") or local_name(r["c"]), "type": local_name(r["type"]), "total": round(float(r["total"]), 2), "nbMesures": int(r["nb"])} for r in top_rows],
            "consommationParVille": [{"ville": local_name(r["ville"]), "villeNom": r.get("villeNom") or local_name(r["ville"]), "total": round(float(r["total"]), 2)} for r in par_ville],
            "productionTotale": round(total_prod, 2),
            "consommationTotale": round(total_conso, 2),
            "tauxAutoconsommation": round((total_prod / total_conso * 100) if total_conso else 0.0, 1),
        }

    def alertes(self, seuil_pct: float = 30.0, jours_sans_mesure: int = 7) -> list[dict]:
        from datetime import datetime, timezone
        from app.services.mesure_service import MesureService
        alertes = []
        maintenant = datetime.now(timezone.utc)
        for c in self.list_consommateurs():
            mesures = MesureService(self.fuseki).list_mesures(concerne=c.id, type_="MesureConsommation")
            if not mesures:
                alertes.append({"consommateur": c.id, "nom": c.nom, "type": c.type, "ville": c.villeNom or c.ville, "niveau": "warning", "raison": "Aucune mesure de consommation enregistrée."})
                continue
            mesures_triees = sorted(mesures, key=lambda m: m.dateMesure, reverse=True)
            derniere = mesures_triees[0]
            try:
                date_derniere = datetime.fromisoformat(derniere.dateMesure.replace("Z", "+00:00"))
                if date_derniere.tzinfo is None:
                    date_derniere = date_derniere.replace(tzinfo=timezone.utc)
            except ValueError:
                date_derniere = maintenant
            if (maintenant - date_derniere).days >= jours_sans_mesure:
                alertes.append({"consommateur": c.id, "nom": c.nom, "type": c.type, "ville": c.villeNom or c.ville, "niveau": "warning", "raison": f"Aucune mesure depuis {(maintenant - date_derniere).days} jours.", "derniereValeur": derniere.valeur, "dateMesure": derniere.dateMesure})
            if len(mesures_triees) >= 2:
                historique = [m.valeur for m in mesures_triees[1:]]
                moyenne = sum(historique) / len(historique) if historique else 0
                if moyenne > 0 and derniere.valeur > moyenne * (1 + seuil_pct / 100.0):
                    alertes.append({"consommateur": c.id, "nom": c.nom, "type": c.type, "ville": c.villeNom or c.ville, "niveau": "critical", "raison": f"Consommation anormale : {derniere.valeur} kWh vs moyenne {round(moyenne,2)} kWh (+{seuil_pct}%).", "derniereValeur": derniere.valeur, "dateMesure": derniere.dateMesure})
        return alertes

    def repondre_question(self, question: str) -> dict:
        q = (question or "").lower()
        stats = self.stats_avancees()
        if "top" in q or "plus" in q:
            top = stats["topConsommateurs"]
            if top:
                t = top[0]
                return {"reponse": f"Le plus grand consommateur est {t['nom']} ({t['type']}) avec {t['total']} kWh."}
        if "total" in q or "consommation" in q:
            return {"reponse": f"Consommation totale : {stats['consommationTotale']} kWh ; production : {stats['productionTotale']} kWh ; taux d'autoconsommation : {stats['tauxAutoconsommation']} %."}
        if "ville" in q:
            villes = stats["consommationParVille"]
            if villes:
                v = villes[0]
                return {"reponse": f"Ville la plus consommatrice : {v['villeNom']} avec {v['total']} kWh."}
        if "type" in q:
            types = stats["consommationParType"]
            if types:
                t = types[0]
                return {"reponse": f"Type le plus consommateur : {t['type']} avec {t['total']} kWh."}
        return {"reponse": "Je peux répondre sur : top consommateur, total consommation, ville la plus consommatrice, type le plus consommateur."}