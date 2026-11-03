"""Module P2 — Équipement (solarx:Capteur, solarx:CompteurIntelligent, solarx:Onduleur) : lecture + CRUD.

État d'un équipement :
  1. la propriété ``etat`` si elle est déclarée ;
  2. sinon "Maintenance" si une Maintenance (module Incident) ``porteSur`` l'équipement ;
  3. sinon "Fonctionnel".
Localisation = celle du propriétaire (``possede`` | ``^estPossedePar``, puis ``situeDans``).
"""

from fastapi import HTTPException, status

from app.services.fuseki import FusekiClient, decimal_literal, iri, string_literal
from app.services.typed_sparql import TypedSparql, term

TYPES_EQUIPEMENT = ("Capteur", "CompteurIntelligent", "Onduleur")

# État calculé EN SPARQL : propriété etat, sinon "Maintenance" si une Maintenance porteSur l'équipement
ETAT_SPARQL = """BIND(COALESCE(?etat_,
       IF(EXISTS { ?m :porteSur ?id ; rdf:type/rdfs:subClassOf* :Maintenance }, "Maintenance", "Fonctionnel"))
       AS ?etatCalc)"""


def texte_sparql(valeur: str) -> str:
    """Texte de recherche -> littéral SPARQL en minuscules, échappé (anti-injection)."""
    v = valeur.strip().lower()[:80]
    v = v.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").replace("\r", " ")
    return f'"{v}"'


def filtres_sparql(etat=None, q=None, proprietaire=None, localisation=None, marque=None) -> str:
    """Clauses FILTER ajoutées dans le WHERE : le filtrage et la recherche sont faits par Fuseki."""
    f = []
    if etat:
        if etat not in ETATS:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"État inconnu : {etat!r}")
        f.append(f'FILTER(STR(?etatCalc) = "{etat}")')
    if q and q.strip():
        t = texte_sparql(q)
        f.append(
            f"FILTER(CONTAINS(LCASE(STR(?id)), {t})"
            f" || (BOUND(?nom_) && CONTAINS(LCASE(STR(?nom_)), {t}))"
            f" || (BOUND(?marque_) && CONTAINS(LCASE(STR(?marque_)), {t}))"
            f" || (BOUND(?prop_) && CONTAINS(LCASE(STR(?prop_)), {t}))"
            f" || (BOUND(?loc_) && CONTAINS(LCASE(STR(?loc_)), {t})))"
        )
    if marque and marque.strip():
        f.append(f"FILTER(BOUND(?marque_) && LCASE(STR(?marque_)) = {texte_sparql(marque)})")
    if proprietaire:
        f.append(f"FILTER EXISTS {{ ?id (^:possede|:estPossedePar) {term(proprietaire)} }}")
    if localisation:
        f.append(f"FILTER EXISTS {{ ?id (^:possede|:estPossedePar)/:situeDans {term(localisation)} }}")
    return "\n  ".join(f)
ETATS = ("Fonctionnel", "Maintenance", "En panne")
_PREFIXE_ID = {"Capteur": "Capteur", "CompteurIntelligent": "Compteur", "Onduleur": "Onduleur"}


def _type_filter(type_: str | None) -> str:
    if type_:
        if type_ not in TYPES_EQUIPEMENT:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Type d'équipement inconnu : {type_!r}")
        return f"VALUES ?type {{ :{type_} }}"
    return "?type rdfs:subClassOf* :Equipement . FILTER(?type != :Equipement)"


class EquipementService:
    def __init__(self, sparql: TypedSparql, fuseki: FusekiClient) -> None:
        self.sparql = sparql
        self.fuseki = fuseki

    # ------------------------------------------------------------------ lecture
    def _maintenances(self) -> dict[str, list[dict]]:
        out: dict[str, list[dict]] = {}
        for r in self.sparql.run("""
SELECT ?e ?evenement ?typeEvenement ?date ?description WHERE {
  ?evenement :porteSur ?e ; rdf:type ?typeEvenement .
  ?typeEvenement rdfs:subClassOf* :Maintenance .
  OPTIONAL { ?evenement :dateOccurrence ?date }
  OPTIONAL { ?evenement :description ?description }
} ORDER BY DESC(?date)"""):
            out.setdefault(r.pop("e"), []).append(r)
        return out

    def list_equipements(
        self, type_: str | None = None, etat: str | None = None, q: str | None = None,
        proprietaire: str | None = None, localisation: str | None = None, marque: str | None = None,
    ) -> list[dict]:
        """Liste ; état, recherche et filtres sont calculés par Fuseki (BIND / FILTER SPARQL)."""
        query = f"""
SELECT ?id ?type
       (SAMPLE(?nom_) AS ?nom) (SAMPLE(?marque_) AS ?marque) (SAMPLE(?etat_) AS ?etatDeclare)
       (SAMPLE(?etatCalc) AS ?etat)
       (SAMPLE(?pmax_) AS ?puissanceMax) (SAMPLE(?date_) AS ?dateInstallation)
       (SAMPLE(?loc_) AS ?localisation) (SAMPLE(?prop_) AS ?proprietaire) (SAMPLE(?p) AS ?proprietaireId)
       (COUNT(DISTINCT ?mesure) AS ?nbMesures)
WHERE {{
  {_type_filter(type_)}
  ?id rdf:type ?type .
  OPTIONAL {{ ?id :nom ?nom_ }}
  OPTIONAL {{ ?id :marque ?marque_ }}
  OPTIONAL {{ ?id :etat ?etat_ }}
  OPTIONAL {{ ?id :puissanceMaxKW ?pmax_ }}
  OPTIONAL {{ ?id :dateInstallation ?date_ }}
  OPTIONAL {{
    ?id (^:possede|:estPossedePar) ?p .
    OPTIONAL {{ ?p :nom ?pn }}
    BIND(COALESCE(?pn, REPLACE(STRAFTER(STR(?p), "#"), "_", " ")) AS ?prop_)
    OPTIONAL {{ ?p :situeDans ?l . OPTIONAL {{ ?l :nom ?ln }}
               BIND(COALESCE(?ln, STRAFTER(STR(?l), "#")) AS ?loc_) }}
  }}
  OPTIONAL {{ ?id (:produitMesure|^:estMesureProduitePar) ?mesure }}
  {ETAT_SPARQL}
  {filtres_sparql(etat=etat, q=q, proprietaire=proprietaire, localisation=localisation, marque=marque)}
}}
GROUP BY ?id ?type
ORDER BY ?type ?id
"""
        self.derniere_requete = query
        rows = self.sparql.run(query)
        maint = self._maintenances()
        out = []
        for r in rows:
            if "id" not in r:
                continue
            r["evenements"] = maint.get(r["id"], [])
            r.setdefault("etatDeclare", None)
            out.append(r)
        return out

    def stats(self) -> dict:
        """Agrégation SPARQL : nombre d'équipements par type et par état (COUNT + GROUP BY)."""
        rows = self.sparql.run(f"""
SELECT ?type ?etat (COUNT(DISTINCT ?id) AS ?nombre) WHERE {{
  {{ SELECT DISTINCT ?id ?type ?etat WHERE {{
    {_type_filter(None)}
    ?id rdf:type ?type .
    OPTIONAL {{ ?id :etat ?etat_ }}
    {ETAT_SPARQL}
    BIND(STR(?etatCalc) AS ?etat)
  }} }}
}} GROUP BY ?type ?etat""")
        par_etat: dict[str, int] = {}
        par_type: dict[str, int] = {}
        for r in rows:
            if "type" not in r:
                continue
            par_etat[r["etat"]] = par_etat.get(r["etat"], 0) + r["nombre"]
            par_type[r["type"]] = par_type.get(r["type"], 0) + r["nombre"]
        return {"total": sum(par_type.values()), "parEtat": par_etat, "parType": par_type}

    def get_equipement(self, equipement_id: str) -> dict:
        iri(equipement_id)
        for r in self.list_equipements():
            if r["id"] == equipement_id:
                return r
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Équipement '{equipement_id}' introuvable")

    def proprietaires(self) -> list[dict]:
        """Consommateurs et installations qui peuvent posséder un équipement (formulaires)."""
        return self.sparql.run("""
SELECT ?id (SAMPLE(?n) AS ?nom) WHERE {
  VALUES ?racine { :Consommateur :InstallationProduction }
  ?type rdfs:subClassOf* ?racine . ?id rdf:type ?type . FILTER(isIRI(?id))
  OPTIONAL { ?id :nom ?n }
} GROUP BY ?id ORDER BY ?id""")

    # --------------------------------------------------------------- écriture
    def _verifier_proprietaire(self, local: str | None) -> None:
        if local and not self.fuseki.ask(f"""ASK {{
  VALUES ?racine {{ solarx:Consommateur solarx:InstallationProduction }}
  {iri(local)} rdf:type/rdfs:subClassOf* ?racine }}"""):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Propriétaire '{local}' introuvable dans l'ontologie")

    def _prochain_id(self, type_: str) -> str:
        rows = self.sparql.run(f"SELECT ?s WHERE {{ ?s rdf:type :{type_} }}")
        nums = [int(r["s"].rsplit("_", 1)[-1]) for r in rows if r["s"].rsplit("_", 1)[-1].isdigit()]
        return f"{_PREFIXE_ID[type_]}_{max(nums, default=0) + 1:02d}"

    @staticmethod
    def _triplets(eid: str, d: dict) -> list[str]:
        e = iri(eid)
        t = []
        if d.get("nom") is not None:
            t.append(f"{e} solarx:nom {string_literal(d['nom'])} .")
        if d.get("marque"):
            t.append(f"{e} solarx:marque {string_literal(d['marque'])} .")
        if d.get("puissanceMaxKW") is not None:
            t.append(f"{e} solarx:puissanceMaxKW {decimal_literal(d['puissanceMaxKW'])} .")
        if d.get("etat"):
            t.append(f"{e} solarx:etat {string_literal(d['etat'])} .")
        if d.get("proprietaire"):
            t.append(f"{iri(d['proprietaire'])} solarx:possede {e} .")
        return t

    def create(self, data: dict) -> dict:
        """CREATE : INSERT DATA d'un Capteur / CompteurIntelligent / Onduleur."""
        type_ = data["type"]
        _type_filter(type_)
        eid = data.get("id") or self._prochain_id(type_)
        if self.fuseki.ask(f"ASK {{ {iri(eid)} ?p ?o }}"):
            raise HTTPException(status.HTTP_409_CONFLICT, f"'{eid}' existe déjà")
        self._verifier_proprietaire(data.get("proprietaire"))
        triplets = [f"{iri(eid)} rdf:type owl:NamedIndividual, solarx:{type_} ."] + self._triplets(eid, data)
        self.fuseki.update("INSERT DATA {\n  " + "\n  ".join(triplets) + "\n}")
        return self.get_equipement(eid)

    def update(self, equipement_id: str, data: dict) -> dict:
        """UPDATE : DELETE WHERE des anciennes valeurs puis INSERT DATA."""
        self.get_equipement(equipement_id)
        if not data:
            return self.get_equipement(equipement_id)
        self._verifier_proprietaire(data.get("proprietaire"))
        e = iri(equipement_id)
        ops = [f"DELETE WHERE {{ {e} solarx:{p} ?o }}" for p in ("nom", "marque", "puissanceMaxKW", "etat") if p in data]
        if "proprietaire" in data:
            ops.append(f"DELETE WHERE {{ ?p solarx:possede {e} }}")
            ops.append(f"DELETE WHERE {{ {e} solarx:estPossedePar ?p }}")
        triplets = self._triplets(equipement_id, data)
        if triplets:
            ops.append("INSERT DATA {\n  " + "\n  ".join(triplets) + "\n}")
        for op in ops:  # une opération par requête (chacune reçoit les PREFIX)
            self.fuseki.update(op)
        return self.get_equipement(equipement_id)

    def delete(self, equipement_id: str) -> dict:
        """DELETE : supprime l'équipement et toutes les relations qui le citent."""
        self.get_equipement(equipement_id)
        e = iri(equipement_id)
        self.fuseki.update(f"DELETE WHERE {{ {e} ?p ?o }}")
        self.fuseki.update(f"DELETE WHERE {{ ?x ?p {e} }}")
        return {"supprime": equipement_id}
