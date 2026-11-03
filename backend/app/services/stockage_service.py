"""Module P2 — Stockage (solarx:Batterie, solarx:StockageHydraulique) : lecture + CRUD.

Propriétés de l'ontologie : capaciteKWh, energieStockeeKWh, nom, situeDans,
alimente (-> Consommateur), alimenteStockage (InstallationProduction -> Stockage) ;
propriétés ajoutées par P2 (database/p2_stockage_equipement.ttl) : puissanceMaxKW,
technologie, dateInstallation, etat.

État : la propriété ``etat`` si elle existe, sinon déduit des incidents
(Panne -> "En panne", Surcharge / Alerte -> "Alerte"), sinon "Fonctionnel".
Fuseki n'applique pas owl:inverseOf : chaque relation est lue dans les deux sens.
"""

from fastapi import HTTPException, status

from app.services.fuseki import FusekiClient, decimal_literal, iri, string_literal
from app.services.typed_sparql import TypedSparql, term

TYPES_STOCKAGE = ("Batterie", "StockageHydraulique")


def _type_filter(type_: str | None) -> str:
    if type_:
        if type_ not in TYPES_STOCKAGE:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Type de stockage inconnu : {type_!r}")
        return f"VALUES ?type {{ :{type_} }}"
    return "?type rdfs:subClassOf* :Stockage . FILTER(?type != :Stockage)"


def texte_sparql(valeur: str) -> str:
    """Texte de recherche -> littéral SPARQL en minuscules, échappé (anti-injection)."""
    v = valeur.strip().lower()[:80]
    v = v.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").replace("\r", " ")
    return f'"{v}"'


def nombre_sparql(valeur: float) -> str:
    return repr(float(valeur))


# État calculé EN SPARQL : propriété etat, sinon incidents (Panne -> En panne, autre -> Alerte)
ETAT_SPARQL = """BIND(COALESCE(?etat_,
       IF(EXISTS { ?inc (:affecte|^:estAffectePar) ?id ; rdf:type :Panne }, "En panne",
       IF(EXISTS { ?inc2 (:affecte|^:estAffectePar) ?id ; rdf:type/rdfs:subClassOf* :Incident }, "Alerte",
          "Fonctionnel"))) AS ?etatCalc)"""


def filtres_sparql(
    q: str | None = None, etat: str | None = None, localisation: str | None = None,
    capacite_min: float | None = None, capacite_max: float | None = None,
    niveau_min: float | None = None, niveau_max: float | None = None,
) -> str:
    """Clauses FILTER ajoutées dans le WHERE (filtrage et recherche faits par Fuseki)."""
    f = []
    if q and q.strip():
        t = texte_sparql(q)
        f.append(
            f"FILTER(CONTAINS(LCASE(STR(?id)), {t})"
            f" || (BOUND(?nom_) && CONTAINS(LCASE(STR(?nom_)), {t}))"
            f" || (BOUND(?tech_) && CONTAINS(LCASE(STR(?tech_)), {t})))"
        )
    if localisation:
        loc = term(localisation)
        f.append(f"FILTER EXISTS {{ {{ ?id :situeDans {loc} }} UNION "
                 f"{{ ?id (:alimente|^:estAlimentePar) ?bb . ?bb :situeDans {loc} }} }}")
    if capacite_min is not None:
        f.append(f"FILTER(?cap_ >= {nombre_sparql(capacite_min)})")
    if capacite_max is not None:
        f.append(f"FILTER(?cap_ <= {nombre_sparql(capacite_max)})")
    if niveau_min is not None:
        f.append(f"FILTER(BOUND(?es_) && ?es_ * 100 / ?cap_ >= {nombre_sparql(niveau_min)})")
    if niveau_max is not None:
        f.append(f"FILTER(BOUND(?es_) && ?es_ * 100 / ?cap_ <= {nombre_sparql(niveau_max)})")
    if etat:
        if etat not in ("Fonctionnel", "Maintenance", "En panne", "Alerte"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"État inconnu : {etat!r}")
        f.append(ETAT_SPARQL)
        f.append(f'FILTER(STR(?etatCalc) = "{etat}")')
    return "\n  ".join(f)


def _stockage_query(extra: str, filtres: str = "") -> str:
    return f"""
SELECT ?id ?type
       (SAMPLE(?nom_) AS ?nom) (SAMPLE(?tech_) AS ?technologie)
       (SAMPLE(?cap_) AS ?capacite) (SAMPLE(?es_) AS ?energieStockee)
       (SAMPLE(?pmax_) AS ?puissanceMax) (SAMPLE(?etat_) AS ?etatDeclare)
       (SAMPLE(?date_) AS ?dateInstallation)
       (SAMPLE(?locD_) AS ?localisationDirecte) (SAMPLE(?locV_) AS ?localisationAlimente)
       (SAMPLE(?l1) AS ?localisationId)
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
  OPTIONAL {{ ?id (:alimente|^:estAlimentePar) ?b . ?b :situeDans ?l2 . OPTIONAL {{ ?l2 :nom ?n2 }}
             BIND(COALESCE(?n2, STRAFTER(STR(?l2), "#")) AS ?locV_) }}
  {filtres}
}}
GROUP BY ?id ?type
ORDER BY ?type ?id
"""


def _grouper(rows: list[dict], cle: str) -> dict[str, list]:
    out: dict[str, list] = {}
    for r in rows:
        k = r.pop(cle)
        valeur = r if len(r) > 1 else next(iter(r.values()))
        if valeur not in out.setdefault(k, []):
            out[k].append(valeur)
    return out


class StockageService:
    def __init__(self, sparql: TypedSparql, fuseki: FusekiClient) -> None:
        self.sparql = sparql
        self.fuseki = fuseki

    # ------------------------------------------------------------------ lecture
    def _liens(self) -> dict:
        sources = self.sparql.run("""
SELECT DISTINCT ?s ?inst WHERE {
  ?type rdfs:subClassOf* :Stockage . ?s rdf:type ?type .
  ?s (^:alimenteStockage|:estAlimenteParProduction) ?inst .
} ORDER BY ?inst""")
        cibles = self.sparql.run("""
SELECT DISTINCT ?s ?cible WHERE {
  ?type rdfs:subClassOf* :Stockage . ?s rdf:type ?type .
  ?s (:alimente|^:estAlimentePar) ?cible .
} ORDER BY ?cible""")
        incidents = self.sparql.run("""
SELECT ?s ?incident ?typeIncident ?gravite ?date ?description WHERE {
  ?incident (:affecte|^:estAffectePar) ?s ; rdf:type ?typeIncident .
  ?typeIncident rdfs:subClassOf* :Incident . FILTER(?typeIncident != :Incident)
  ?stype rdfs:subClassOf* :Stockage . ?s rdf:type ?stype .
  OPTIONAL { ?incident :gravite ?gravite }
  OPTIONAL { ?incident :dateOccurrence ?date }
  OPTIONAL { ?incident :description ?description }
} ORDER BY DESC(?date)""")
        return {
            "sources": _grouper(sources, "s"),
            "cibles": _grouper(cibles, "s"),
            "incidents": _grouper(incidents, "s"),
        }

    @staticmethod
    def _etat(declare: str | None, incidents: list[dict]) -> str:
        if declare:
            return declare
        types = {i["typeIncident"] for i in incidents}
        if "Panne" in types:
            return "En panne"
        return "Alerte" if types else "Fonctionnel"

    def _clean(self, row: dict, liens: dict) -> dict:
        sid = row["id"]
        row["alimentePar"] = liens["sources"].get(sid, [])
        row["alimente"] = liens["cibles"].get(sid, [])
        row["incidents"] = liens["incidents"].get(sid, [])
        row["etatDeclare"] = row.get("etatDeclare")
        row["etat"] = self._etat(row["etatDeclare"], row["incidents"])
        direct, via = row.pop("localisationDirecte", None), row.pop("localisationAlimente", None)
        row["localisation"] = direct or via
        cap, es = row.get("capacite"), row.get("energieStockee")
        row["niveauCharge"] = round(es / cap * 100, 1) if cap and es is not None else None
        return row

    def list_stockages(self, type_: str | None = None, **filtres) -> list[dict]:
        """Liste ; les filtres (q, etat, localisation, capacite_min/max, niveau_min/max)
        sont traduits en FILTER SPARQL et exécutés par Fuseki."""
        liens = self._liens()
        query = _stockage_query(_type_filter(type_), filtres_sparql(**filtres))
        self.derniere_requete = query
        return [self._clean(r, liens) for r in self.sparql.run(query) if "id" in r]

    def capacite_totale(self, type_: str | None = None) -> dict:
        """Agrégation SPARQL (SUM / COUNT / GROUP BY) : capacité et énergie stockée par type."""
        rows = self.sparql.run(f"""
SELECT ?type (COUNT(DISTINCT ?s) AS ?nombre) (SUM(?cap) AS ?capacite) (SUM(?es) AS ?energieStockee)
WHERE {{
  {{ SELECT DISTINCT ?s ?type ?cap ?es WHERE {{
    {_type_filter(type_)}
    ?s rdf:type ?type ; :capaciteKWh ?cap .
    OPTIONAL {{ ?s :energieStockeeKWh ?e }}
    BIND(COALESCE(?e, 0) AS ?es)
  }} }}
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

    def get_stockage(self, stockage_id: str) -> dict:
        rows = self.sparql.run(_stockage_query(f"BIND({term(stockage_id)} AS ?id) {_type_filter(None)}"))
        rows = [r for r in rows if "id" in r]
        if not rows:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Stockage '{stockage_id}' introuvable")
        item = self._clean(rows[0], self._liens())
        item["mesures"] = self.sparql.run(f"""
SELECT ?mesure ?type ?valeur ?unite ?equipement WHERE {{
  ?mesure (:concerne|^:estConcerneePar) {term(stockage_id)} ; rdf:type ?type .
  ?type rdfs:subClassOf* :Mesure . FILTER(?type != :Mesure)
  OPTIONAL {{ ?mesure :valeur ?valeur }}
  OPTIONAL {{ ?mesure :unite ?unite }}
  OPTIONAL {{ ?equipement (:produitMesure|^:estMesureProduitePar) ?mesure }}
}}""")
        return item

    def referentiel(self) -> dict:
        """Listes pour les formulaires : localisations et installations existantes."""
        def liste(classe: str) -> list[dict]:
            return self.sparql.run(f"""
SELECT ?id (SAMPLE(?n) AS ?nom) WHERE {{
  ?type rdfs:subClassOf* :{classe} . ?id rdf:type ?type . FILTER(isIRI(?id))
  OPTIONAL {{ ?id :nom ?n }}
}} GROUP BY ?id ORDER BY ?id""")
        return {"localisations": liste("Localisation"), "installations": liste("InstallationProduction")}

    # --------------------------------------------------------------- écriture
    def _existe(self, local: str) -> bool:
        return self.fuseki.ask(f"ASK {{ {iri(local)} ?p ?o }}")

    def _verifier_ref(self, local: str | None, classe: str, libelle: str) -> None:
        if local and not self.fuseki.ask(
            f"ASK {{ {iri(local)} rdf:type/rdfs:subClassOf* solarx:{classe} }}"
        ):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"{libelle} '{local}' introuvable dans l'ontologie")

    def _prochain_id(self, type_: str) -> str:
        rows = self.sparql.run(f"SELECT ?s WHERE {{ ?s rdf:type :{type_} }}")
        nums = [int(r["s"].rsplit("_", 1)[-1]) for r in rows if r["s"].rsplit("_", 1)[-1].isdigit()]
        return f"{type_}_{max(nums, default=0) + 1:02d}"

    @staticmethod
    def _triplets(sid: str, d: dict) -> list[str]:
        s = iri(sid)
        t = []
        if d.get("nom") is not None:
            t.append(f"{s} solarx:nom {string_literal(d['nom'])} .")
        for prop in ("capaciteKWh", "energieStockeeKWh", "puissanceMaxKW"):
            if d.get(prop) is not None:
                t.append(f"{s} solarx:{prop} {decimal_literal(d[prop])} .")
        if d.get("technologie"):
            t.append(f"{s} solarx:technologie {string_literal(d['technologie'])} .")
        if d.get("etat"):
            t.append(f"{s} solarx:etat {string_literal(d['etat'])} .")
        if d.get("localisation"):
            t.append(f"{s} solarx:situeDans {iri(d['localisation'])} .")
        if d.get("alimentePar"):
            t.append(f"{iri(d['alimentePar'])} solarx:alimenteStockage {s} .")
        return t

    def create(self, data: dict) -> dict:
        """CREATE : INSERT DATA d'un nouvel individu Batterie / StockageHydraulique."""
        type_ = data["type"]
        _type_filter(type_)
        sid = data.get("id") or self._prochain_id(type_)
        iri(sid)  # valide l'identifiant
        if self._existe(sid):
            raise HTTPException(status.HTTP_409_CONFLICT, f"'{sid}' existe déjà")
        if (data.get("energieStockeeKWh") or 0) > data["capaciteKWh"]:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "L'énergie stockée ne peut pas dépasser la capacité")
        self._verifier_ref(data.get("localisation"), "Localisation", "Localisation")
        self._verifier_ref(data.get("alimentePar"), "InstallationProduction", "Installation")
        triplets = [f"{iri(sid)} rdf:type owl:NamedIndividual, solarx:{type_} ."] + self._triplets(sid, data)
        self.fuseki.update("INSERT DATA {\n  " + "\n  ".join(triplets) + "\n}")
        return self.get_stockage(sid)

    def update(self, stockage_id: str, data: dict) -> dict:
        """UPDATE : DELETE WHERE des anciennes valeurs puis INSERT DATA des nouvelles."""
        actuel = self.get_stockage(stockage_id)
        if not data:
            return actuel
        cap = data.get("capaciteKWh", actuel.get("capacite"))
        es = data.get("energieStockeeKWh", actuel.get("energieStockee"))
        if cap is not None and es is not None and es > cap:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "L'énergie stockée ne peut pas dépasser la capacité")
        self._verifier_ref(data.get("localisation"), "Localisation", "Localisation")
        self._verifier_ref(data.get("alimentePar"), "InstallationProduction", "Installation")
        s = iri(stockage_id)
        ops = [f"DELETE WHERE {{ {s} solarx:{p} ?o }}"
               for p in ("nom", "capaciteKWh", "energieStockeeKWh", "puissanceMaxKW", "technologie", "etat")
               if p in data]
        if "localisation" in data:
            ops.append(f"DELETE WHERE {{ {s} solarx:situeDans ?o }}")
        if "alimentePar" in data:
            ops.append(f"DELETE WHERE {{ ?i solarx:alimenteStockage {s} }}")
            ops.append(f"DELETE WHERE {{ {s} solarx:estAlimenteParProduction ?i }}")
        triplets = self._triplets(stockage_id, data)
        if triplets:
            ops.append("INSERT DATA {\n  " + "\n  ".join(triplets) + "\n}")
        for op in ops:  # une opération par requête (chacune reçoit les PREFIX)
            self.fuseki.update(op)
        return self.get_stockage(stockage_id)

    def delete(self, stockage_id: str) -> dict:
        """DELETE : supprime l'individu et tous les triplets qui le citent."""
        self.get_stockage(stockage_id)
        s = iri(stockage_id)
        self.fuseki.update(f"DELETE WHERE {{ {s} ?p ?o }}")
        self.fuseki.update(f"DELETE WHERE {{ ?x ?p {s} }}")
        return {"supprime": stockage_id}
