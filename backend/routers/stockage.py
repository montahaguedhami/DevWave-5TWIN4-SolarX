"""P2 — Stockage : lister Batterie et StockageHydraulique, capacité totale.

Propriétés de l'ontologie utilisées : capaciteKWh, energieStockeeKWh, nom,
situeDans, alimente, alimenteStockage, concerne ; et pour l'état, les
incidents de la partie P6 (Panne / Surcharge / Alerte qui `affecte` le stockage).
"""
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException

from sparql_client import run_query

router = APIRouter(prefix="/api/stockage", tags=["Stockage"])

TypeStockage = Literal["Batterie", "StockageHydraulique"]


def _type_filter(type_: Optional[str]) -> str:
    # Valeur déjà validée par FastAPI (Literal) → pas d'injection possible
    if type_:
        return f"VALUES ?type {{ :{type_} }}"
    return "?type rdfs:subClassOf* :Stockage . FILTER(?type != :Stockage)"


def _stockage_query(extra: str) -> str:
    return f"""
SELECT ?id ?type
       (SAMPLE(?nom_) AS ?nom) (SAMPLE(?tech_) AS ?technologie)
       (SAMPLE(?cap_) AS ?capacite) (SAMPLE(?es_) AS ?energieStockee)
       (SAMPLE(?pmax_) AS ?puissanceMax) (SAMPLE(?etat_) AS ?etatDeclare)
       (SAMPLE(?date_) AS ?dateInstallation)
       (SAMPLE(?locD_) AS ?localisationDirecte) (SAMPLE(?locV_) AS ?localisationAlimente)
WHERE {{
  {extra}
  ?id rdf:type ?type .
  OPTIONAL {{ ?id :nom ?nom_ }}
  OPTIONAL {{ ?id :technologie ?tech_ }}
  OPTIONAL {{ ?id :capaciteKWh ?cap_ }}
  OPTIONAL {{ ?id :energieStockeeKWh ?es_ }}
  OPTIONAL {{ ?id :puissanceMaxKW ?pmax_ }}
  OPTIONAL {{ ?id :etat ?etat_ }}
  OPTIONAL {{ ?id :dateInstallation ?date_ }}
  OPTIONAL {{ ?id :situeDans ?l1 . OPTIONAL {{ ?l1 :nom ?n1 }}
             BIND(COALESCE(?n1, STRAFTER(STR(?l1), "#")) AS ?locD_) }}
  OPTIONAL {{ ?id :alimente ?b . ?b :situeDans ?l2 . OPTIONAL {{ ?l2 :nom ?n2 }}
             BIND(COALESCE(?n2, STRAFTER(STR(?l2), "#")) AS ?locV_) }}
}}
GROUP BY ?id ?type
ORDER BY ?type ?id
"""


def _liens() -> dict:
    """Relations du stockage, en requêtes séparées (plusieurs valeurs possibles)."""
    sources: dict[str, list[str]] = {}
    for r in run_query("""
SELECT ?s ?inst WHERE {
  { ?inst :alimenteStockage ?s } UNION { ?s :estAlimenteParProduction ?inst }
} ORDER BY ?inst"""):
        sources.setdefault(r["s"], [])
        if r["inst"] not in sources[r["s"]]:
            sources[r["s"]].append(r["inst"])

    cibles: dict[str, list[str]] = {}
    for r in run_query("""
SELECT ?s ?cible WHERE {
  ?type rdfs:subClassOf* :Stockage .
  ?s rdf:type ?type ; :alimente ?cible .
} ORDER BY ?cible"""):
        cibles.setdefault(r["s"], [])
        if r["cible"] not in cibles[r["s"]]:
            cibles[r["s"]].append(r["cible"])

    incidents: dict[str, list[dict]] = {}
    for r in run_query("""
SELECT ?s ?incident ?typeIncident ?gravite ?date ?description WHERE {
  ?incident :affecte ?s ; rdf:type ?typeIncident .
  ?typeIncident rdfs:subClassOf* :Incident .
  OPTIONAL { ?incident :gravite ?gravite }
  OPTIONAL { ?incident :dateEvenement ?date }
  OPTIONAL { ?incident :description ?description }
} ORDER BY DESC(?date)"""):
        incidents.setdefault(r.pop("s"), []).append(r)
    return {"sources": sources, "cibles": cibles, "incidents": incidents}


def _etat(row: dict, incidents: list[dict]) -> str:
    if row.get("etatDeclare"):
        return row["etatDeclare"]
    types = {i["typeIncident"] for i in incidents}
    if "Panne" in types:
        return "En panne"
    if types:
        return "Alerte"
    return "Fonctionnel"


def _clean(row: dict, liens: dict) -> dict:
    sid = row["id"]
    row["alimentePar"] = liens["sources"].get(sid, [])
    row["alimente"] = liens["cibles"].get(sid, [])
    row["incidents"] = liens["incidents"].get(sid, [])
    row["etat"] = _etat(row, row["incidents"])
    row["localisation"] = row.pop("localisationDirecte", None) or row.pop("localisationAlimente", None)
    row.pop("localisationAlimente", None)
    row.pop("etatDeclare", None)
    cap, es = row.get("capacite"), row.get("energieStockee")
    row["niveauCharge"] = round(es / cap * 100, 1) if cap and es is not None else None
    return row


@router.get("")
def lister_stockages(type: Optional[TypeStockage] = None):
    """Liste des unités de stockage (Batterie, StockageHydraulique)."""
    liens = _liens()
    return [_clean(r, liens) for r in run_query(_stockage_query(_type_filter(type))) if "id" in r]


@router.get("/capacite-totale")
def capacite_totale(type: Optional[TypeStockage] = None):
    """Requête d'agrégation : capacité totale de stockage (kWh), par type et globale."""
    rows = run_query(f"""
SELECT ?type (COUNT(DISTINCT ?s) AS ?nombre) (SUM(?cap) AS ?capacite)
       (SUM(?es) AS ?energieStockee)
WHERE {{
  {_type_filter(type)}
  ?s rdf:type ?type ; :capaciteKWh ?cap .
  OPTIONAL {{ ?s :energieStockeeKWh ?e }}
  BIND(COALESCE(?e, 0) AS ?es)
}}
GROUP BY ?type
ORDER BY DESC(?capacite)
""")
    rows = [r for r in rows if "type" in r]
    total = sum(r.get("capacite", 0) for r in rows)
    stockee = sum(r.get("energieStockee", 0) for r in rows)
    return {
        "capaciteTotale": round(total, 2),
        "energieStockee": round(stockee, 2),
        "tauxRemplissage": round(stockee / total * 100, 1) if total else 0,
        "nombre": sum(r.get("nombre", 0) for r in rows),
        "unite": "kWh",
        "parType": [
            {**r, "capacite": round(r.get("capacite", 0), 2), "energieStockee": round(r.get("energieStockee", 0), 2)}
            for r in rows
        ],
    }


@router.get("/{stockage_id}")
def detail_stockage(stockage_id: str):
    if not stockage_id.replace("_", "").isalnum():
        raise HTTPException(400, "Identifiant invalide")
    rows = run_query(_stockage_query(
        f"BIND(:{stockage_id} AS ?id) ?type rdfs:subClassOf* :Stockage . FILTER(?type != :Stockage)"
    ))
    rows = [r for r in rows if "id" in r]
    if not rows:
        raise HTTPException(404, f"Stockage '{stockage_id}' introuvable")
    item = _clean(rows[0], _liens())
    item["mesures"] = run_query(f"""
SELECT ?mesure ?type ?valeur ?unite ?equipement WHERE {{
  ?mesure :concerne :{stockage_id} ; rdf:type ?type .
  ?type rdfs:subClassOf* :Mesure .
  OPTIONAL {{ ?mesure :valeur ?valeur }}
  OPTIONAL {{ ?mesure :unite ?unite }}
  OPTIONAL {{ {{ ?equipement :produitMesure ?mesure }} UNION {{ ?mesure :estMesureProduitePar ?equipement }} }}
}}""")
    return item
