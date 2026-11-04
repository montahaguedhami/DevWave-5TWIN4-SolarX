"""Module P6 — Maintenance (solarx:Inspection, solarx:MaintenanceCorrective,
solarx:MaintenancePredictive, solarx:MaintenancePreventive) : lecture, timeline et CRUD SPARQL.
"""

from fastapi import HTTPException, status

from app.services.fuseki import FusekiClient, datetime_literal, iri, string_literal
from app.services.typed_sparql import TypedSparql, term

TYPES_MAINTENANCE = (
    "Inspection",
    "MaintenanceCorrective",
    "MaintenancePredictive",
    "MaintenancePreventive",
)

_PREFIXE_ID = {
    "Inspection": "Inspection",
    "MaintenanceCorrective": "MaintenanceCorrective",
    "MaintenancePredictive": "MaintenancePredictive",
    "MaintenancePreventive": "MaintenancePreventive",
}


def _texte_sparql(valeur: str) -> str:
    v = valeur.strip().lower()[:80]
    v = v.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").replace("\r", " ")
    return f'"{v}"'


class MaintenanceService:
    def __init__(self, sparql: TypedSparql, fuseki: FusekiClient) -> None:
        self.sparql = sparql
        self.fuseki = fuseki
        self.derniere_requete: str = ""

    def list_maintenances(
        self,
        type_: str | None = None,
        equipement_id: str | None = None,
        q: str | None = None,
    ) -> list[dict]:
        """Lister les maintenances avec leur sous-classe, dates, descriptions et équipements ciblés."""
        filtres = []
        if type_:
            if type_ not in TYPES_MAINTENANCE:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST, f"Type de maintenance inconnu : {type_!r}"
                )
            filtres.append(f"FILTER(?type = :{type_})")

        if equipement_id:
            filtres.append(f"FILTER(?equipement = {term(equipement_id)})")

        if q and q.strip():
            t = _texte_sparql(q)
            filtres.append(
                f"FILTER(CONTAINS(LCASE(STR(?id)), {t})"
                f" || (BOUND(?nom) && CONTAINS(LCASE(STR(?nom)), {t}))"
                f" || (BOUND(?description) && CONTAINS(LCASE(STR(?description)), {t}))"
                f" || (BOUND(?equipement) && CONTAINS(LCASE(STR(?equipement)), {t}))"
                f" || (BOUND(?equipementNom) && CONTAINS(LCASE(STR(?equipementNom)), {t})))"
            )

        filtres_str = "\n  ".join(filtres)

        query = f"""
SELECT ?id ?type ?nom ?dateOccurrence ?description ?equipement ?equipementNom ?equipementType
WHERE {{
  ?type rdfs:subClassOf* :Maintenance .
  FILTER(?type != :Maintenance)
  ?id rdf:type ?type .
  OPTIONAL {{ ?id :nom ?nom }}
  OPTIONAL {{ ?id :dateOccurrence ?dateOccurrence }}
  OPTIONAL {{ ?id :description ?description }}
  OPTIONAL {{
    ?id :porteSur ?equipement .
    OPTIONAL {{ ?equipement :nom ?equipementNom }}
    OPTIONAL {{
      ?equipement rdf:type ?equipementType .
      FILTER(?equipementType != owl:NamedIndividual)
    }}
  }}
  {filtres_str}
}} ORDER BY DESC(?dateOccurrence)
"""
        self.derniere_requete = query
        rows = self.sparql.run(query)

        maintenances: dict[str, dict] = {}
        for r in rows:
            mid = r["id"]
            if mid not in maintenances:
                maintenances[mid] = {
                    "id": mid,
                    "type": r.get("type", "Maintenance"),
                    "nom": r.get("nom") or mid,
                    "dateOccurrence": r.get("dateOccurrence"),
                    "description": r.get("description", ""),
                    "equipement": r.get("equipement"),
                    "equipementNom": r.get("equipementNom") or r.get("equipement"),
                    "equipementType": r.get("equipementType"),
                }
        return list(maintenances.values())

    def stats(self) -> dict:
        """Statistiques d'interventions par sous-type."""
        query = """
SELECT ?type (COUNT(DISTINCT ?id) AS ?total)
WHERE {
  ?type rdfs:subClassOf* :Maintenance .
  FILTER(?type != :Maintenance)
  ?id rdf:type ?type .
} GROUP BY ?type
"""
        rows = self.sparql.run(query)
        par_type = {t: 0 for t in TYPES_MAINTENANCE}
        total_global = 0
        for r in rows:
            t = r.get("type")
            cnt = int(r.get("total", 0))
            if t in par_type:
                par_type[t] = cnt
                total_global += cnt

        return {
            "total": total_global,
            "parType": par_type,
        }

    def get_maintenance(self, maintenance_id: str) -> dict:
        rows = self.list_maintenances()
        for m in rows:
            if m["id"] == maintenance_id:
                return m
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"Maintenance {maintenance_id!r} introuvable"
        )

    def create_maintenance(self, data: dict) -> dict:
        type_ = data.get("type", "Inspection")
        if type_ not in TYPES_MAINTENANCE:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, f"Type de maintenance inconnu : {type_!r}"
            )

        mid = data.get("id")
        if not mid:
            existing = {m["id"] for m in self.list_maintenances()}
            prefix = _PREFIXE_ID.get(type_, "Maintenance")
            num = 1
            while f"{prefix}_{num:02d}" in existing or f"Maintenance_{num:02d}" in existing:
                num += 1
            mid = f"{prefix}_{num:02d}"

        m_iri = iri(mid)
        triplets = [f"{m_iri} rdf:type owl:NamedIndividual, solarx:{type_} ."]
        if data.get("nom"):
            triplets.append(f"{m_iri} solarx:nom {string_literal(data['nom'])} .")
        if data.get("description"):
            triplets.append(f"{m_iri} solarx:description {string_literal(data['description'])} .")
        if data.get("dateOccurrence"):
            triplets.append(f"{m_iri} solarx:dateOccurrence {datetime_literal(data['dateOccurrence'])} .")
        if data.get("equipement"):
            triplets.append(f"{m_iri} solarx:porteSur {iri(data['equipement'])} .")

        query = f"INSERT DATA {{\n  " + "\n  ".join(triplets) + "\n}"
        self.fuseki.update(query)
        return self.get_maintenance(mid)

    def update_maintenance(self, maintenance_id: str, data: dict) -> dict:
        current = self.get_maintenance(maintenance_id)
        m_iri = iri(maintenance_id)

        self.fuseki.update(f"DELETE WHERE {{ {m_iri} solarx:nom ?n }}")
        self.fuseki.update(f"DELETE WHERE {{ {m_iri} solarx:description ?d }}")
        self.fuseki.update(f"DELETE WHERE {{ {m_iri} solarx:dateOccurrence ?date }}")
        self.fuseki.update(f"DELETE WHERE {{ {m_iri} solarx:porteSur ?eq }}")

        inserts = []
        nom = data.get("nom", current.get("nom"))
        if nom:
            inserts.append(f"{m_iri} solarx:nom {string_literal(nom)} .")
        desc = data.get("description", current.get("description"))
        if desc:
            inserts.append(f"{m_iri} solarx:description {string_literal(desc)} .")
        date_occ = data.get("dateOccurrence", current.get("dateOccurrence"))
        if date_occ:
            inserts.append(f"{m_iri} solarx:dateOccurrence {datetime_literal(date_occ)} .")
        eq = data.get("equipement", current.get("equipement"))
        if eq:
            inserts.append(f"{m_iri} solarx:porteSur {iri(eq)} .")

        if inserts:
            self.fuseki.update(f"INSERT DATA {{\n  " + "\n  ".join(inserts) + "\n}")

        return self.get_maintenance(maintenance_id)

    def delete_maintenance(self, maintenance_id: str) -> None:
        self.get_maintenance(maintenance_id)
        m_iri = iri(maintenance_id)
        self.fuseki.update(f"DELETE WHERE {{ {m_iri} ?p ?o }}")
        self.fuseki.update(f"DELETE WHERE {{ ?s ?p {m_iri} }}")
