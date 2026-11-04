"""Module P6 — Incident (solarx:Alerte, solarx:Panne, solarx:Surcharge) :
lecture, requête pannes par équipement et CRUD SPARQL.
"""

from fastapi import HTTPException, status

from app.services.fuseki import FusekiClient, datetime_literal, iri, string_literal
from app.services.typed_sparql import TypedSparql, term

TYPES_INCIDENT = ("Alerte", "Panne", "Surcharge")
GRAVITES = ("Critique", "Élevée", "Moyenne", "Faible")

_PREFIXE_ID = {
    "Alerte": "Alerte",
    "Panne": "Panne",
    "Surcharge": "Surcharge",
}


def _texte_sparql(valeur: str) -> str:
    v = valeur.strip().lower()[:80]
    v = v.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").replace("\r", " ")
    return f'"{v}"'


class IncidentService:
    def __init__(self, sparql: TypedSparql, fuseki: FusekiClient) -> None:
        self.sparql = sparql
        self.fuseki = fuseki
        self.derniere_requete: str = ""

    def list_incidents(
        self,
        type_: str | None = None,
        gravite: str | None = None,
        equipement_id: str | None = None,
        q: str | None = None,
    ) -> list[dict]:
        """Lister les incidents (Alerte, Panne, Surcharge) avec gravités, équipements affectés et capteurs."""
        filtres = []
        if type_:
            if type_ not in TYPES_INCIDENT:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST, f"Type d'incident inconnu : {type_!r}"
                )
            filtres.append(f"FILTER(?type = :{type_})")

        if gravite:
            if gravite not in GRAVITES:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST, f"Niveau de gravité inconnu : {gravite!r}"
                )
            filtres.append(f'FILTER(STR(?gravite) = "{gravite}")')

        if equipement_id:
            filtres.append(f"FILTER(?affecte = {term(equipement_id)})")

        if q and q.strip():
            t = _texte_sparql(q)
            filtres.append(
                f"FILTER(CONTAINS(LCASE(STR(?id)), {t})"
                f" || (BOUND(?nom) && CONTAINS(LCASE(STR(?nom)), {t}))"
                f" || (BOUND(?description) && CONTAINS(LCASE(STR(?description)), {t}))"
                f" || (BOUND(?affecte) && CONTAINS(LCASE(STR(?affecte)), {t}))"
                f" || (BOUND(?affecteNom) && CONTAINS(LCASE(STR(?affecteNom)), {t})))"
            )

        filtres_str = "\n  ".join(filtres)

        query = f"""
SELECT ?id ?type ?nom ?dateOccurrence ?description ?gravite ?affecte ?affecteNom ?affecteType ?detectePar ?detecteParNom
WHERE {{
  ?type rdfs:subClassOf* :Incident .
  FILTER(?type != :Incident)
  ?id rdf:type ?type .
  OPTIONAL {{ ?id :nom ?nom }}
  OPTIONAL {{ ?id :dateOccurrence ?dateOccurrence }}
  OPTIONAL {{ ?id :description ?description }}
  OPTIONAL {{ ?id :gravite ?gravite }}
  OPTIONAL {{
    ?id :affecte ?affecte .
    OPTIONAL {{ ?affecte :nom ?affecteNom }}
    OPTIONAL {{
      ?affecte rdf:type ?affecteType .
      FILTER(?affecteType != owl:NamedIndividual)
    }}
  }}
  OPTIONAL {{
    ?id :detectePar ?detectePar .
    OPTIONAL {{ ?detectePar :nom ?detecteParNom }}
  }}
  {filtres_str}
}} ORDER BY DESC(?dateOccurrence)
"""
        self.derniere_requete = query
        rows = self.sparql.run(query)

        incidents: dict[str, dict] = {}
        for r in rows:
            iid = r["id"]
            if iid not in incidents:
                incidents[iid] = {
                    "id": iid,
                    "type": r.get("type", "Incident"),
                    "nom": r.get("nom") or iid,
                    "dateOccurrence": r.get("dateOccurrence"),
                    "description": r.get("description", ""),
                    "gravite": r.get("gravite", "Moyenne"),
                    "affecte": r.get("affecte"),
                    "affecteNom": r.get("affecteNom") or r.get("affecte"),
                    "affecteType": r.get("affecteType"),
                    "detectePar": r.get("detectePar"),
                    "detecteParNom": r.get("detecteParNom") or r.get("detectePar"),
                }
        return list(incidents.values())

    def pannes_par_equipement(self) -> list[dict]:
        """Requête demandée : agrégation du nombre de pannes groupées par équipement/composant affecté."""
        query = """
SELECT ?equipement (SAMPLE(?eqNom_) AS ?equipementNom) (SAMPLE(?eqType_) AS ?equipementType)
       (COUNT(?panne) AS ?nbPannes)
       (MAX(?date_) AS ?dernierePanne)
WHERE {
  ?panne rdf:type/rdfs:subClassOf* :Panne .
  ?panne :affecte ?equipement .
  OPTIONAL { ?equipement :nom ?eqNom_ }
  OPTIONAL {
    ?equipement rdf:type ?eqType_ .
    FILTER(?eqType_ != owl:NamedIndividual)
  }
  OPTIONAL { ?panne :dateOccurrence ?date_ }
}
GROUP BY ?equipement
ORDER BY DESC(?nbPannes)
"""
        self.derniere_requete = query
        groupes = self.sparql.run(query)

        toutes_pannes = self.list_incidents(type_="Panne")
        pannes_map: dict[str, list[dict]] = {}
        for p in toutes_pannes:
            eq = p.get("affecte")
            if eq:
                pannes_map.setdefault(eq, []).append(p)

        resultats = []
        for g in groupes:
            eq_id = g["equipement"]
            resultats.append({
                "equipement": eq_id,
                "equipementNom": g.get("equipementNom") or eq_id,
                "equipementType": g.get("equipementType", "Équipement"),
                "nbPannes": int(g.get("nbPannes", 0)),
                "dernierePanne": g.get("dernierePanne"),
                "pannes": pannes_map.get(eq_id, []),
            })

        return resultats

    def stats(self) -> dict:
        """Statistiques d'incidents par type et par gravité."""
        query_type = """
SELECT ?type (COUNT(DISTINCT ?id) AS ?total)
WHERE {
  ?type rdfs:subClassOf* :Incident .
  FILTER(?type != :Incident)
  ?id rdf:type ?type .
} GROUP BY ?type
"""
        rows_type = self.sparql.run(query_type)
        par_type = {t: 0 for t in TYPES_INCIDENT}
        total_global = 0
        for r in rows_type:
            t = r.get("type")
            cnt = int(r.get("total", 0))
            if t in par_type:
                par_type[t] = cnt
                total_global += cnt

        query_gravite = """
SELECT ?gravite (COUNT(DISTINCT ?id) AS ?total)
WHERE {
  ?id rdf:type/rdfs:subClassOf* :Incident .
  ?id :gravite ?gravite .
} GROUP BY ?gravite
"""
        rows_gravite = self.sparql.run(query_gravite)
        par_gravite = {g: 0 for g in GRAVITES}
        for r in rows_gravite:
            g = r.get("gravite")
            if g in par_gravite:
                par_gravite[g] = int(r.get("total", 0))

        return {
            "total": total_global,
            "parType": par_type,
            "parGravite": par_gravite,
        }

    def get_incident(self, incident_id: str) -> dict:
        rows = self.list_incidents()
        for i in rows:
            if i["id"] == incident_id:
                return i
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"Incident {incident_id!r} introuvable"
        )

    def create_incident(self, data: dict) -> dict:
        type_ = data.get("type", "Panne")
        if type_ not in TYPES_INCIDENT:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, f"Type d'incident inconnu : {type_!r}"
            )

        iid = data.get("id")
        if not iid:
            existing = {i["id"] for i in self.list_incidents()}
            prefix = _PREFIXE_ID.get(type_, "Incident")
            num = 1
            while f"{prefix}_{num:02d}" in existing or f"Incident_{num:02d}" in existing:
                num += 1
            iid = f"{prefix}_{num:02d}"

        i_iri = iri(iid)
        triplets = [f"{i_iri} rdf:type owl:NamedIndividual, solarx:{type_} ."]
        if data.get("nom"):
            triplets.append(f"{i_iri} solarx:nom {string_literal(data['nom'])} .")
        if data.get("description"):
            triplets.append(f"{i_iri} solarx:description {string_literal(data['description'])} .")
        if data.get("gravite"):
            triplets.append(f"{i_iri} solarx:gravite {string_literal(data['gravite'])} .")
        if data.get("dateOccurrence"):
            triplets.append(f"{i_iri} solarx:dateOccurrence {datetime_literal(data['dateOccurrence'])} .")
        if data.get("affecte"):
            triplets.append(f"{i_iri} solarx:affecte {iri(data['affecte'])} .")
        if data.get("detectePar"):
            triplets.append(f"{i_iri} solarx:detectePar {iri(data['detectePar'])} .")

        query = f"INSERT DATA {{\n  " + "\n  ".join(triplets) + "\n}"
        self.fuseki.update(query)
        return self.get_incident(iid)

    def update_incident(self, incident_id: str, data: dict) -> dict:
        current = self.get_incident(incident_id)
        i_iri = iri(incident_id)

        self.fuseki.update(f"DELETE WHERE {{ {i_iri} solarx:nom ?n }}")
        self.fuseki.update(f"DELETE WHERE {{ {i_iri} solarx:description ?d }}")
        self.fuseki.update(f"DELETE WHERE {{ {i_iri} solarx:gravite ?g }}")
        self.fuseki.update(f"DELETE WHERE {{ {i_iri} solarx:dateOccurrence ?date }}")
        self.fuseki.update(f"DELETE WHERE {{ {i_iri} solarx:affecte ?aff }}")
        self.fuseki.update(f"DELETE WHERE {{ {i_iri} solarx:detectePar ?det }}")

        inserts = []
        nom = data.get("nom", current.get("nom"))
        if nom:
            inserts.append(f"{i_iri} solarx:nom {string_literal(nom)} .")
        desc = data.get("description", current.get("description"))
        if desc:
            inserts.append(f"{i_iri} solarx:description {string_literal(desc)} .")
        gravite = data.get("gravite", current.get("gravite"))
        if gravite:
            inserts.append(f"{i_iri} solarx:gravite {string_literal(gravite)} .")
        date_occ = data.get("dateOccurrence", current.get("dateOccurrence"))
        if date_occ:
            inserts.append(f"{i_iri} solarx:dateOccurrence {datetime_literal(date_occ)} .")
        aff = data.get("affecte", current.get("affecte"))
        if aff:
            inserts.append(f"{i_iri} solarx:affecte {iri(aff)} .")
        det = data.get("detectePar", current.get("detectePar"))
        if det:
            inserts.append(f"{i_iri} solarx:detectePar {iri(det)} .")

        if inserts:
            self.fuseki.update(f"INSERT DATA {{\n  " + "\n  ".join(inserts) + "\n}")

        return self.get_incident(incident_id)

    def delete_incident(self, incident_id: str) -> None:
        self.get_incident(incident_id)
        i_iri = iri(incident_id)
        self.fuseki.update(f"DELETE WHERE {{ {i_iri} ?p ?o }}")
        self.fuseki.update(f"DELETE WHERE {{ ?s ?p {i_iri} }}")
