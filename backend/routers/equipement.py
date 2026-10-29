"""P2 — Équipement : lister Capteur, CompteurIntelligent, Onduleur avec leur état.

L'état vient de l'ontologie :
  1. la propriété `etat` si elle est déclarée ;
  2. sinon "Maintenance" si une Maintenance (P6) `porteSur` l'équipement ;
  3. sinon "Fonctionnel".
La localisation d'un équipement est celle de son propriétaire (`possede` → `situeDans`).
"""
from typing import Literal, Optional

from fastapi import APIRouter

from sparql_client import run_query

router = APIRouter(prefix="/api/equipements", tags=["Équipement"])

TypeEquipement = Literal["Capteur", "CompteurIntelligent", "Onduleur"]
Etat = Literal["Fonctionnel", "Maintenance", "En panne"]


def _type_filter(type_: Optional[str]) -> str:
    if type_:
        return f"VALUES ?type {{ :{type_} }}"
    return "?type rdfs:subClassOf* :Equipement . FILTER(?type != :Equipement)"


def _maintenances() -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {}
    for r in run_query("""
SELECT ?e ?evenement ?typeEvenement ?date ?description WHERE {
  ?evenement :porteSur ?e ; rdf:type ?typeEvenement .
  ?typeEvenement rdfs:subClassOf* :Maintenance .
  OPTIONAL { ?evenement :dateEvenement ?date }
  OPTIONAL { ?evenement :description ?description }
} ORDER BY DESC(?date)"""):
        out.setdefault(r.pop("e"), []).append(r)
    return out


def _equipements(type_: Optional[str]) -> list[dict]:
    rows = run_query(f"""
SELECT ?id ?type
       (SAMPLE(?nom_) AS ?nom) (SAMPLE(?marque_) AS ?marque) (SAMPLE(?etat_) AS ?etatDeclare)
       (SAMPLE(?pmax_) AS ?puissanceMax) (SAMPLE(?date_) AS ?dateInstallation)
       (SAMPLE(?loc_) AS ?localisation) (SAMPLE(?prop_) AS ?proprietaire)
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
    {{ ?p :possede ?id }} UNION {{ ?id :estPossedePar ?p }}
    OPTIONAL {{ ?p :nom ?pn }}
    BIND(COALESCE(?pn, STRAFTER(STR(?p), "#")) AS ?prop_)
    OPTIONAL {{ ?p :situeDans ?l . OPTIONAL {{ ?l :nom ?ln }}
               BIND(COALESCE(?ln, STRAFTER(STR(?l), "#")) AS ?loc_) }}
  }}
  OPTIONAL {{ {{ ?id :produitMesure ?mesure }} UNION {{ ?mesure :estMesureProduitePar ?id }} }}
}}
GROUP BY ?id ?type
ORDER BY ?type ?id
""")
    maint = _maintenances()
    out = []
    for r in rows:
        if "id" not in r:
            continue
        r["evenements"] = maint.get(r["id"], [])
        declare = r.pop("etatDeclare", None)
        r["etat"] = declare or ("Maintenance" if r["evenements"] else "Fonctionnel")
        out.append(r)
    return out


@router.get("")
def lister_equipements(type: Optional[TypeEquipement] = None, etat: Optional[Etat] = None):
    """Liste des équipements, avec propriétaire (possede), localisation, mesures et maintenances."""
    rows = _equipements(type)
    return [r for r in rows if r["etat"] == etat] if etat else rows


@router.get("/stats")
def stats_equipements():
    """Nombre d'équipements par état et par type (pour les badges et KPI)."""
    par_etat, par_type = {}, {}
    rows = _equipements(None)
    for r in rows:
        par_etat[r["etat"]] = par_etat.get(r["etat"], 0) + 1
        par_type[r["type"]] = par_type.get(r["type"], 0) + 1
    return {"total": len(rows), "parEtat": par_etat, "parType": par_type}
