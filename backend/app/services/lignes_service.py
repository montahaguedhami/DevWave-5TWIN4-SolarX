"""Lignes de transport (solarx:LigneTransport) et réseaux électriques (solarx:ReseauElectrique).

Propriétés de l'ontologie utilisées : nom, tensionKV, longueurKm, dessert
(-> Consommateur), relie (-> InstallationProduction), contient (Réseau -> Ligne) ;
et pour l'état, les incidents de la partie Incident (Panne / Surcharge / Alerte
qui ``affecte`` la ligne). Fuseki n'applique pas owl:inverseOf : chaque relation
est lue dans les deux sens (ex. ``dessert`` | ``^estDesserviPar``).

Écriture (SPARQL UPDATE) : INSERT DATA pour créer, DELETE WHERE puis INSERT DATA
pour modifier, DELETE WHERE pour supprimer.
"""

from fastapi import HTTPException, status

from app.services.fuseki import FusekiClient, decimal_literal, iri, string_literal
from app.services.typed_sparql import TypedSparql, term

TYPES_LIGNE = ("LigneBasseTension", "LigneMoyenneTension", "LigneHauteTension")

# Seuils de tension (kV) : basse < 1, moyenne de 1 à 50, haute > 50
BASSE_MAX_KV, MOYENNE_MAX_KV = 1, 50


def _type_filter(type_: str | None) -> str:
    if type_:
        if type_ not in TYPES_LIGNE:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Type de ligne inconnu : {type_!r}")
        return f"VALUES ?type {{ :{type_} }}"
    return "?type rdfs:subClassOf* :LigneTransport . FILTER(?type != :LigneTransport)"


def _verifier_tension(type_: str, tension: float | None) -> None:
    if tension is None:
        return
    if type_ == "LigneBasseTension" and tension >= BASSE_MAX_KV:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Une ligne basse tension doit être sous {BASSE_MAX_KV} kV")
    if type_ == "LigneMoyenneTension" and not BASSE_MAX_KV <= tension <= MOYENNE_MAX_KV:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            f"Une ligne moyenne tension doit être entre {BASSE_MAX_KV} et {MOYENNE_MAX_KV} kV")
    if type_ == "LigneHauteTension" and tension <= MOYENNE_MAX_KV:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Une ligne haute tension doit dépasser {MOYENNE_MAX_KV} kV")


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


def _un_par_id(rows: list[dict]) -> list[dict]:
    """Garde une seule ligne par (ligne, élément) : un élément situé dans plusieurs lieux localisés
    (ville et région, par ex.) garde le premier."""
    vus, out = set(), []
    for r in rows:
        if (r["ligne"], r["id"]) not in vus:
            vus.add((r["ligne"], r["id"]))
            out.append(r)
    return out


# Lieu localisé (latitude et longitude, partie Localisation) d'une installation ou d'un consommateur
_LIEU = """
  OPTIONAL {
    ?id (:situeDans|^:contientLocalement) ?ville .
    ?ville :latitude ?latitude ; :longitude ?longitude .
    OPTIONAL { ?ville :nom ?villeNom }
  }"""


def _completer_lieux(rows: list[dict], deduits: dict[str, dict]) -> list[dict]:
    """Sans ville dans l'ontologie, un élément prend celle de son stockage (lieu déduit, signalé)."""
    for r in rows:
        if "latitude" not in r and r["id"] in deduits:
            r.update(deduits[r["id"]], lieuDeduit=True)
    return rows


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
    def __init__(self, sparql: TypedSparql, fuseki: FusekiClient | None = None) -> None:
        self.sparql = sparql
        self.fuseki = fuseki  # écriture seulement (ask / update)

    # ---- Lignes --------------------------------------------------------
    def _liens(self) -> dict:
        """Relations des lignes, en requêtes séparées (plusieurs valeurs possibles)."""
        # Lieu déduit : ville du stockage que l'installation alimente, ou qui alimente le consommateur
        deduits: dict[str, dict] = {}
        for r in self.sparql.run("""
SELECT ?id ?stockage ?stockageNom ?ville ?villeNom ?latitude ?longitude WHERE {
  ?id (:alimenteStockage|^:estAlimenteParProduction|^:alimente|:estAlimentePar) ?stockage .
  ?stockage rdf:type/rdfs:subClassOf* :Stockage ; (:situeDans|^:contientLocalement) ?ville .
  ?ville :latitude ?latitude ; :longitude ?longitude .
  OPTIONAL { ?stockage :nom ?stockageNom }
  OPTIONAL { ?ville :nom ?villeNom }
} ORDER BY ?id ?stockage"""):
            deduits.setdefault(r.pop("id"), r)

        consommateurs = _un_par_id(self.sparql.run(f"""
SELECT ?ligne ?id ?type ?nom ?ville ?villeNom ?latitude ?longitude WHERE {{
  ?ligne (:dessert|^:estDesserviPar) ?id .
  ?id rdf:type ?type . ?type rdfs:subClassOf* :Consommateur . FILTER(?type != :Consommateur)
  OPTIONAL {{ ?id :nom ?nom }}{_LIEU}
}} ORDER BY ?id ?ville"""))
        installations = _un_par_id(self.sparql.run(f"""
SELECT ?ligne ?id ?type ?nom ?ville ?villeNom ?latitude ?longitude WHERE {{
  ?ligne (:relie|^:estRelieePar) ?id .
  ?id rdf:type ?type . ?type rdfs:subClassOf* :InstallationProduction .
  FILTER NOT EXISTS {{ ?id rdf:type ?sous . ?sous rdfs:subClassOf+ ?type }}
  OPTIONAL {{ ?id :nom ?nom }}{_LIEU}
}} ORDER BY ?id ?ville"""))
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
            "consommateurs": _grouper(_completer_lieux(consommateurs, deduits), "ligne"),
            "installations": _grouper(_completer_lieux(installations, deduits), "ligne"),
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

    def list_lignes(self, type_: str | None = None, reseau: str | None = None, q: str | None = None) -> list[dict]:
        extra = _type_filter(type_)
        if reseau:
            extra += f"\n  {term(reseau)} (:contient|^:estContenueDans) ?id ."
        if q and q.strip():
            texte = string_literal(q.strip().lower())
            extra += (f"\n  FILTER(CONTAINS(LCASE(STR(?id)), {texte})"
                      f" || CONTAINS(LCASE(COALESCE(STR(?nom_), \"\")), {texte}))")
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

    def referentiel(self) -> dict:
        """Choix proposés par le formulaire : installations et consommateurs de l'ontologie."""
        def liste(classe: str) -> list[dict]:
            return self.sparql.run(f"""
SELECT ?id (SAMPLE(?nom_) AS ?nom) WHERE {{
  ?id rdf:type/rdfs:subClassOf* :{classe} .
  OPTIONAL {{ ?id :nom ?nom_ }}
}} GROUP BY ?id ORDER BY ?id""")
        return {"installations": liste("InstallationProduction"), "consommateurs": liste("Consommateur")}

    # ---- Écriture : outils communs -------------------------------------
    def _existe(self, local: str) -> bool:
        return self.fuseki.ask(f"ASK {{ {iri(local)} ?p ?o }}")

    def _verifier_refs(self, locaux: list[str] | None, classe: str, libelle: str) -> None:
        for local in locaux or []:
            if not self.fuseki.ask(f"ASK {{ {iri(local)} rdf:type/rdfs:subClassOf* solarx:{classe} }}"):
                raise HTTPException(status.HTTP_400_BAD_REQUEST, f"{libelle} '{local}' introuvable dans l'ontologie")

    def _prochain_id(self, type_: str) -> str:
        rows = self.sparql.run(f"SELECT ?s WHERE {{ ?s rdf:type :{type_} }}")
        nums = [int(r["s"].rsplit("_", 1)[-1]) for r in rows if r["s"].rsplit("_", 1)[-1].isdigit()]
        return f"{type_}_{max(nums, default=0) + 1:02d}"

    def _nouvel_id(self, type_: str, demande: str | None) -> str:
        nouveau = demande or self._prochain_id(type_)
        iri(nouveau)  # valide l'identifiant
        if self._existe(nouveau):
            raise HTTPException(status.HTTP_409_CONFLICT, f"'{nouveau}' existe déjà")
        return nouveau

    def _ecrire(self, ops: list[str], triplets: list[str]) -> None:
        if triplets:
            ops = [*ops, "INSERT DATA {\n  " + "\n  ".join(triplets) + "\n}"]
        for op in ops:  # une opération par requête (chacune reçoit les PREFIX)
            self.fuseki.update(op)

    # ---- Écriture : lignes ---------------------------------------------
    @staticmethod
    def _triplets_ligne(lid: str, d: dict) -> list[str]:
        s = iri(lid)
        t = []
        if d.get("nom") is not None:
            t.append(f"{s} solarx:nom {string_literal(d['nom'])} .")
        for prop in ("tensionKV", "longueurKm"):
            if d.get(prop) is not None:
                t.append(f"{s} solarx:{prop} {decimal_literal(d[prop])} .")
        t += [f"{iri(r)} solarx:contient {s} ." for r in d.get("reseaux") or []]
        t += [f"{s} solarx:relie {iri(i)} ." for i in d.get("relie") or []]
        t += [f"{s} solarx:dessert {iri(c)} ." for c in d.get("dessert") or []]
        return t

    def _verifier_liens_ligne(self, d: dict) -> None:
        self._verifier_refs(d.get("reseaux"), "ReseauElectrique", "Réseau")
        self._verifier_refs(d.get("relie"), "InstallationProduction", "Installation")
        self._verifier_refs(d.get("dessert"), "Consommateur", "Consommateur")

    def create_ligne(self, data: dict) -> dict:
        """CREATE : INSERT DATA d'une nouvelle ligne."""
        type_ = data["type"]
        _type_filter(type_)
        _verifier_tension(type_, data.get("tensionKV"))
        self._verifier_liens_ligne(data)
        lid = self._nouvel_id(type_, data.get("id"))
        self._ecrire([], [f"{iri(lid)} rdf:type owl:NamedIndividual, solarx:{type_} .", *self._triplets_ligne(lid, data)])
        return self.get_ligne(lid)

    def update_ligne(self, ligne_id: str, data: dict) -> dict:
        """UPDATE : DELETE WHERE des valeurs modifiées (dans les deux sens) puis INSERT DATA."""
        actuelle = self.get_ligne(ligne_id)
        _verifier_tension(actuelle["type"], data.get("tensionKV"))
        self._verifier_liens_ligne(data)
        s = iri(ligne_id)
        ops = [f"DELETE WHERE {{ {s} solarx:{p} ?o }}" for p in ("nom", "tensionKV", "longueurKm") if p in data]
        if "reseaux" in data:
            ops += [f"DELETE WHERE {{ ?r solarx:contient {s} }}", f"DELETE WHERE {{ {s} solarx:estContenueDans ?r }}"]
        if "relie" in data:
            ops += [f"DELETE WHERE {{ {s} solarx:relie ?i }}", f"DELETE WHERE {{ ?i solarx:estRelieePar {s} }}"]
        if "dessert" in data:
            ops += [f"DELETE WHERE {{ {s} solarx:dessert ?c }}", f"DELETE WHERE {{ ?c solarx:estDesserviPar {s} }}"]
        self._ecrire(ops, self._triplets_ligne(ligne_id, data))
        return self.get_ligne(ligne_id)

    def delete_ligne(self, ligne_id: str) -> dict:
        """DELETE : refusé si un incident ou une maintenance cite la ligne (partie Incident, à ne pas casser)."""
        self.get_ligne(ligne_id)
        s = iri(ligne_id)
        if self.fuseki.ask(f"ASK {{ ?e (solarx:affecte|^solarx:estAffectePar|solarx:porteSur) {s} }}"):
            raise HTTPException(status.HTTP_409_CONFLICT,
                                "Suppression impossible : un incident ou une maintenance concerne cette ligne")
        self.fuseki.update(f"DELETE WHERE {{ {s} ?p ?o }}")
        self.fuseki.update(f"DELETE WHERE {{ ?x ?p {s} }}")
        return {"supprime": ligne_id}

    # ---- Réseaux -------------------------------------------------------
    def list_reseaux(self) -> list[dict]:
        """Réseaux avec leur nombre de lignes, leur longueur totale et les consommateurs desservis."""
        return [_reseau(r) for r in self.sparql.run(_reseau_query()) if "id" in r]

    def stats_reseaux(self) -> dict:
        """Totaux sur tous les réseaux, avec COUNT(DISTINCT) : une ligne ou un consommateur
        présent dans deux réseaux n'est compté qu'une fois."""
        reseaux = self.sparql.run("""
SELECT (COUNT(DISTINCT ?r) AS ?n) WHERE { ?r rdf:type/rdfs:subClassOf* :ReseauElectrique }""")
        lignes = self.sparql.run("""
SELECT (COUNT(DISTINCT ?l) AS ?n) (SUM(?long) AS ?km) WHERE {
  { SELECT DISTINCT ?l ?long WHERE {
    ?r rdf:type/rdfs:subClassOf* :ReseauElectrique ; (:contient|^:estContenueDans) ?l .
    OPTIONAL { ?l :longueurKm ?lg }
    BIND(COALESCE(?lg, 0) AS ?long)
  } }
}""")
        consommateurs = self.sparql.run("""
SELECT (COUNT(DISTINCT ?c) AS ?n) WHERE {
  ?r rdf:type/rdfs:subClassOf* :ReseauElectrique ; (:contient|^:estContenueDans) ?l .
  ?l (:dessert|^:estDesserviPar) ?c .
}""")
        return {
            "nombre": reseaux[0].get("n", 0) if reseaux else 0,
            "lignes": lignes[0].get("n", 0) if lignes else 0,
            "longueurTotaleKm": round(lignes[0].get("km", 0), 2) if lignes else 0,
            "consommateursDesservis": consommateurs[0].get("n", 0) if consommateurs else 0,
        }

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

    # ---- Écriture : réseaux --------------------------------------------
    @staticmethod
    def _triplets_reseau(rid: str, d: dict) -> list[str]:
        s = iri(rid)
        t = [f"{s} solarx:nom {string_literal(d['nom'])} ."] if d.get("nom") is not None else []
        return t + [f"{s} solarx:contient {iri(l)} ." for l in d.get("lignes") or []]

    def create_reseau(self, data: dict) -> dict:
        """CREATE : INSERT DATA d'un nouveau réseau, avec ses lignes."""
        type_ = data["type"]
        self._verifier_refs(data.get("lignes"), "LigneTransport", "Ligne")
        rid = self._nouvel_id(type_, data.get("id"))
        self._ecrire([], [f"{iri(rid)} rdf:type owl:NamedIndividual, solarx:{type_} .", *self._triplets_reseau(rid, data)])
        return self.get_reseau(rid)

    def update_reseau(self, reseau_id: str, data: dict) -> dict:
        """UPDATE : nom et liste des lignes (la liste envoyée remplace l'ancienne)."""
        self.get_reseau(reseau_id)
        self._verifier_refs(data.get("lignes"), "LigneTransport", "Ligne")
        s = iri(reseau_id)
        ops = [f"DELETE WHERE {{ {s} solarx:nom ?o }}"] if "nom" in data else []
        if "lignes" in data:
            ops += [f"DELETE WHERE {{ {s} solarx:contient ?l }}", f"DELETE WHERE {{ ?l solarx:estContenueDans {s} }}"]
        self._ecrire(ops, self._triplets_reseau(reseau_id, data))
        return self.get_reseau(reseau_id)

    def delete_reseau(self, reseau_id: str) -> dict:
        """DELETE : refusé tant que le réseau contient des lignes."""
        self.get_reseau(reseau_id)
        s = iri(reseau_id)
        if self.fuseki.ask(f"ASK {{ {s} (solarx:contient|^solarx:estContenueDans) ?l }}"):
            raise HTTPException(status.HTTP_409_CONFLICT,
                                "Suppression impossible : ce réseau contient encore des lignes. Retirez-les d'abord.")
        self.fuseki.update(f"DELETE WHERE {{ {s} ?p ?o }}")
        self.fuseki.update(f"DELETE WHERE {{ ?x ?p {s} }}")
        return {"supprime": reseau_id}
