"""Lignes de transport (solarx:LigneTransport) et réseaux électriques (solarx:ReseauElectrique).

Propriétés de l'ontologie utilisées : nom, tensionKV, longueurKm, dessert
(-> Consommateur), relie (-> InstallationProduction), contient (Réseau -> Ligne) ;
et pour l'état, les incidents de la partie Incident (Panne / Surcharge / Alerte
qui ``affecte`` la ligne). Fuseki n'applique pas owl:inverseOf : chaque relation
est lue dans les deux sens (ex. ``dessert`` | ``^estDesserviPar``).
"""

from fastapi import HTTPException, status

from app.services.typed_sparql import TypedSparql, term

TYPES_LIGNE = ("LigneBasseTension", "LigneMoyenneTension", "LigneHauteTension")


def _type_filter(type_: str | None) -> str:
    if type_:
        if type_ not in TYPES_LIGNE:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Type de ligne inconnu : {type_!r}")
        return f"VALUES ?type {{ :{type_} }}"
    return "?type rdfs:subClassOf* :LigneTransport . FILTER(?type != :LigneTransport)"


def _ligne_query(extra: str) -> str:
    return f"""
SELECT ?id ?type (SAMPLE(?nom_) AS ?nom) (SAMPLE(?tension_) AS ?tensionKV) (SAMPLE(?longueur_) AS ?longueurKm)
WHERE {{
  {extra}
  ?id rdf:type ?type .
  OPTIONAL {{ ?id :nom ?nom_ }}
  OPTIONAL {{ ?id :tensionKV ?tension_ }}
  OPTIONAL {{ ?id :longueurKm ?longueur_ }}
}}
GROUP BY ?id ?type
ORDER BY ?type ?id
"""


def _reseau_query(extra: str = "") -> str:
    # Sous-requêtes séparées : joindre lignes et consommateurs dans la même
    # requête fausserait la somme des longueurs (une ligne compterait une fois par consommateur).
    return f"""
SELECT ?id ?type ?nom ?nombreLignes ?longueurTotaleKm ?consommateursDesservis
WHERE {{
  ?id rdf:type ?type . ?type rdfs:subClassOf* :ReseauElectrique .
  {extra}
  OPTIONAL {{ ?id :nom ?nom }}
  OPTIONAL {{
    SELECT ?id (COUNT(DISTINCT ?l) AS ?nombreLignes) (SUM(?long) AS ?longueurTotaleKm) WHERE {{
      {{ SELECT DISTINCT ?id ?l ?long WHERE {{
        ?id (:contient|^:estContenueDans) ?l .
        OPTIONAL {{ ?l :longueurKm ?lg }}
        BIND(COALESCE(?lg, 0) AS ?long)
      }} }}
    }} GROUP BY ?id
  }}
  OPTIONAL {{
    SELECT ?id (COUNT(DISTINCT ?c) AS ?consommateursDesservis) WHERE {{
      ?id (:contient|^:estContenueDans) ?l2 .
      ?l2 (:dessert|^:estDesserviPar) ?c .
    }} GROUP BY ?id
  }}
}}
ORDER BY ?type ?id
"""


def _grouper(rows: list[dict], cle: str) -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {}
    for r in rows:
        k = r.pop(cle)
        if r not in out.setdefault(k, []):
            out[k].append(r)
    return out


def _etat(incidents: list[dict]) -> str:
    types = {i["type"] for i in incidents}
    if "Panne" in types:
        return "En panne"
    if types:
        return "Alerte"
    return "Fonctionnel"


def _reseau(row: dict) -> dict:
    row["nombreLignes"] = row.get("nombreLignes", 0)
    row["longueurTotaleKm"] = round(row.get("longueurTotaleKm", 0), 2)
    row["consommateursDesservis"] = row.get("consommateursDesservis", 0)
    return row


class LignesService:
    def __init__(self, sparql: TypedSparql) -> None:
        self.sparql = sparql

    # ---- Lignes --------------------------------------------------------
    def _liens(self) -> dict:
        """Relations des lignes, en requêtes séparées (plusieurs valeurs possibles)."""
        consommateurs = self.sparql.run("""
SELECT ?ligne ?id ?type ?nom WHERE {
  ?ligne (:dessert|^:estDesserviPar) ?id .
  ?id rdf:type ?type . ?type rdfs:subClassOf* :Consommateur . FILTER(?type != :Consommateur)
  OPTIONAL { ?id :nom ?nom }
} ORDER BY ?id""")
        installations = self.sparql.run("""
SELECT ?ligne ?id ?type ?nom WHERE {
  ?ligne (:relie|^:estRelieePar) ?id .
  ?id rdf:type ?type . ?type rdfs:subClassOf* :InstallationProduction .
  FILTER NOT EXISTS { ?id rdf:type ?sous . ?sous rdfs:subClassOf+ ?type }
  OPTIONAL { ?id :nom ?nom }
} ORDER BY ?id""")
        reseaux = self.sparql.run("""
SELECT ?ligne ?id ?type ?nom WHERE {
  ?id (:contient|^:estContenueDans) ?ligne ; rdf:type ?type .
  ?type rdfs:subClassOf* :ReseauElectrique .
  OPTIONAL { ?id :nom ?nom }
} ORDER BY ?id""")
        incidents = self.sparql.run("""
SELECT ?ligne ?id ?type ?gravite ?date ?description WHERE {
  ?id (:affecte|^:estAffectePar) ?ligne ; rdf:type ?type .
  ?type rdfs:subClassOf* :Incident .
  FILTER(?type != :Incident)
  OPTIONAL { ?id :gravite ?gravite }
  OPTIONAL { ?id :dateOccurrence ?date }
  OPTIONAL { ?id :description ?description }
} ORDER BY DESC(?date)""")
        return {
            "consommateurs": _grouper(consommateurs, "ligne"),
            "installations": _grouper(installations, "ligne"),
            "reseaux": _grouper(reseaux, "ligne"),
            "incidents": _grouper(incidents, "ligne"),
        }

    @staticmethod
    def _ligne(row: dict, liens: dict) -> dict:
        lid = row["id"]
        row["dessert"] = liens["consommateurs"].get(lid, [])
        row["relie"] = liens["installations"].get(lid, [])
        row["reseaux"] = liens["reseaux"].get(lid, [])
        row["incidents"] = liens["incidents"].get(lid, [])
        row["etat"] = _etat(row["incidents"])
        return row

    def list_lignes(self, type_: str | None = None, reseau: str | None = None) -> list[dict]:
        extra = _type_filter(type_)
        if reseau:
            extra += f"\n  {term(reseau)} (:contient|^:estContenueDans) ?id ."
        liens = self._liens()
        return [self._ligne(r, liens) for r in self.sparql.run(_ligne_query(extra)) if "id" in r]

    def stats(self) -> dict:
        """Agrégation : nombre de lignes, longueur totale et tensions, par niveau de tension."""
        rows = self.sparql.run(f"""
SELECT ?type (COUNT(DISTINCT ?l) AS ?nombre) (SUM(?long) AS ?longueurKm)
       (MIN(?tension) AS ?tensionMinKV) (MAX(?tension) AS ?tensionMaxKV)
WHERE {{
  {{ SELECT DISTINCT ?l ?type ?long ?tension WHERE {{
    {_type_filter(None)}
    ?l rdf:type ?type .
    OPTIONAL {{ ?l :longueurKm ?lg }}
    OPTIONAL {{ ?l :tensionKV ?tension }}
    BIND(COALESCE(?lg, 0) AS ?long)
  }} }}
}}
GROUP BY ?type
ORDER BY DESC(?tensionMaxKV)
""")
        rows = [r for r in rows if "type" in r]
        en_panne = self.sparql.run("""
SELECT (COUNT(DISTINCT ?l) AS ?n) WHERE {
  ?p (:affecte|^:estAffectePar) ?l ; rdf:type :Panne .
  ?l rdf:type/rdfs:subClassOf* :LigneTransport .
}""")
        desservis = self.sparql.run("""
SELECT (COUNT(DISTINCT ?c) AS ?n) WHERE {
  ?l rdf:type/rdfs:subClassOf* :LigneTransport ; (:dessert|^:estDesserviPar) ?c .
}""")
        return {
            "nombre": sum(r.get("nombre", 0) for r in rows),
            "longueurTotaleKm": round(sum(r.get("longueurKm", 0) for r in rows), 2),
            "lignesEnPanne": en_panne[0]["n"] if en_panne else 0,
            "consommateursDesservis": desservis[0]["n"] if desservis else 0,
            "parType": [{**r, "longueurKm": round(r.get("longueurKm", 0), 2)} for r in rows],
        }

    def get_ligne(self, ligne_id: str) -> dict:
        rows = self.sparql.run(_ligne_query(f"BIND({term(ligne_id)} AS ?id) {_type_filter(None)}"))
        rows = [r for r in rows if "id" in r]
        if not rows:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Ligne '{ligne_id}' introuvable")
        return self._ligne(rows[0], self._liens())

    # ---- Réseaux -------------------------------------------------------
    def list_reseaux(self) -> list[dict]:
        """Réseaux avec leur nombre de lignes, leur longueur totale et les consommateurs desservis."""
        return [_reseau(r) for r in self.sparql.run(_reseau_query()) if "id" in r]

    def get_reseau(self, reseau_id: str) -> dict:
        """Un réseau, ses lignes, et le chemin installation -> ligne -> consommateur."""
        rid = term(reseau_id)
        rows = [r for r in self.sparql.run(_reseau_query(f"FILTER(?id = {rid})")) if "id" in r]
        if not rows:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Réseau '{reseau_id}' introuvable")
        item = _reseau(rows[0])

        liens = self._liens()
        lignes = self.sparql.run(f"""
SELECT ?id ?type (SAMPLE(?nom_) AS ?nom) (SAMPLE(?tension_) AS ?tensionKV) (SAMPLE(?longueur_) AS ?longueurKm)
WHERE {{
  {rid} (:contient|^:estContenueDans) ?id .
  ?id rdf:type ?type . ?type rdfs:subClassOf* :LigneTransport . FILTER(?type != :LigneTransport)
  OPTIONAL {{ ?id :nom ?nom_ }}
  OPTIONAL {{ ?id :tensionKV ?tension_ }}
  OPTIONAL {{ ?id :longueurKm ?longueur_ }}
}}
GROUP BY ?id ?type
ORDER BY DESC(?tensionKV)""")
        item["lignes"] = [self._ligne(r, liens) for r in lignes if "id" in r]

        # Chemin dans le graphe : installation --relie--> ligne --dessert--> consommateur
        item["flux"] = self.sparql.run(f"""
SELECT ?installation ?ligne ?consommateur WHERE {{
  {rid} (:contient|^:estContenueDans) ?ligne .
  OPTIONAL {{ ?ligne (:relie|^:estRelieePar) ?installation }}
  OPTIONAL {{ ?ligne (:dessert|^:estDesserviPar) ?consommateur }}
}}
ORDER BY ?ligne ?installation ?consommateur""")
        return item
