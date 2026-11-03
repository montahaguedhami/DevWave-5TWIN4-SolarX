"""Business logic for the Consommateur module (solarx:Consommateur and sub-classes)."""

import re
import unicodedata

from fastapi import HTTPException, status

from app.schemas.consommateur import (
    TYPES_CONSOMMATEUR,
    Consommateur,
    ConsommateurCreate,
    ConsommateurUpdate,
)
from app.services.fuseki import (
    FusekiClient,
    decimal_literal,
    iri,
    local_name,
    string_literal,
)

TYPES_SET = set(TYPES_CONSOMMATEUR)


def _slugify(nom: str) -> str:
    ascii_name = unicodedata.normalize("NFKD", nom).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^A-Za-z0-9]+", "_", ascii_name).strip("_")[:60]
    if not slug or not slug[0].isalpha():
        slug = f"Consommateur_{slug}".rstrip("_")
    return slug


def _to_consommateur(row: dict) -> Consommateur:
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

    def _ensure_ville(self, ville_id: str) -> None:
        if not self.fuseki.ask(f"ASK {{ {iri(ville_id)} a solarx:Ville }}"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Ville inconnue : {ville_id}")

    def _ensure_type(self, type_: str) -> None:
        if type_ not in TYPES_SET:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Type de consommateur inconnu : {type_!r}")

    def list_consommateurs(
        self, type_: str | None = None, ville: str | None = None, q: str | None = None,
        skip: int = 0, limit: int = 100,
    ) -> list[Consommateur]:
        filters = []
        if type_:
            self._ensure_type(type_)
            filters.append(f"FILTER(?type = solarx:{type_})")
        if ville:
            filters.append(f"FILTER(?ville = {iri(ville)})")
        if q and q.strip():
            filters.append(
                f"FILTER(CONTAINS(LCASE(STR(COALESCE(?nom, ?c))), LCASE({string_literal(q.strip())})))"
            )
        query = _LIST_QUERY.format(filters="\n  ".join(filters)) + f"\nOFFSET {int(skip)} LIMIT {int(limit)}"
        rows = self.fuseki.select(query)
        result: dict[str, Consommateur] = {}
        for row in rows:
            c = _to_consommateur(row)
            result.setdefault(c.id, c)
        return list(result.values())

    def get_consommateur(self, consommateur_id: str) -> Consommateur:
        rows = self.fuseki.select(
            _LIST_QUERY.format(filters=f"FILTER(?c = {iri(consommateur_id)})")
        )
        if not rows:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Consommateur introuvable : {consommateur_id}")
        return _to_consommateur(rows[0])

    def create_consommateur(self, data: ConsommateurCreate) -> Consommateur:
        self._ensure_type(data.type)
        self._ensure_ville(data.ville)
        base_id = _slugify(data.nom)
        consommateur_id = base_id
        counter = 2
        while self.fuseki.ask(f"ASK {{ {{ {iri(consommateur_id)} ?p ?o }} UNION {{ ?s ?p {iri(consommateur_id)} }} }}"):
            consommateur_id = f"{base_id}_{counter}"
            counter += 1

        triples = [
            f"{iri(consommateur_id)} a owl:NamedIndividual, solarx:{data.type} ;",
            f"  solarx:nom {string_literal(data.nom)} ;",
        ]
        if data.surfaceM2 is not None:
            triples.append(f"  solarx:surfaceM2 {decimal_literal(data.surfaceM2)} ;")
        triples.append(f"  solarx:situeDans {iri(data.ville)} .")
        self.fuseki.update("INSERT DATA { " + "\n".join(triples) + " }")
        return self.get_consommateur(consommateur_id)

    def update_consommateur(self, consommateur_id: str, data: ConsommateurUpdate) -> Consommateur:
        self._ensure_type(data.type)
        self._ensure_ville(data.ville)
        self.get_consommateur(consommateur_id)
        consommateur = iri(consommateur_id)
        # If type changed, we cannot easily change rdf:type via DELETE/INSERT of the class triple without
        # removing the old one; do it explicitly.
        self.fuseki.update(
            f"""
            DELETE WHERE {{ {consommateur} solarx:nom ?n }} ;
            DELETE WHERE {{ {consommateur} solarx:surfaceM2 ?s }} ;
            DELETE {{ {consommateur} solarx:situeDans ?r }} WHERE {{ {consommateur} solarx:situeDans ?r }} ;
            DELETE {{ {consommateur} a ?oldType }} WHERE {{ {consommateur} a ?oldType . ?oldType rdfs:subClassOf* solarx:Consommateur }} ;
            INSERT DATA {{
              {consommateur} a solarx:{data.type} ;
                solarx:nom {string_literal(data.nom)} ;
                solarx:situeDans {iri(data.ville)} .
            }}
            """
        )
        if data.surfaceM2 is not None:
            self.fuseki.update(
                f"INSERT DATA {{ {consommateur} solarx:surfaceM2 {decimal_literal(data.surfaceM2)} . }}"
            )
        return self.get_consommateur(consommateur_id)

    def delete_consommateur(self, consommateur_id: str, cascade: bool = False) -> dict:
        self.get_consommateur(consommateur_id)
        consommateur = iri(consommateur_id)
        rows = self.fuseki.select(
            f"SELECT DISTINCT ?m WHERE {{ ?m solarx:concerne {consommateur} ; a/rdfs:subClassOf* solarx:Mesure }}"
        )
        mesures = [local_name(r["m"]) for r in rows]
        if mesures and not cascade:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                {"message": f"Ce consommateur possède {len(mesures)} mesure(s). Confirmez pour les supprimer aussi.",
                 "mesures": mesures, "requiresCascade": True},
            )
        operations = [f"DELETE WHERE {{ {iri(m)} ?p ?o }}" for m in mesures]
        operations.append(f"DELETE WHERE {{ {consommateur} ?p ?o }}")
        self.fuseki.update(" ;\n".join(operations))
        return {"supprime": consommateur_id, "mesuresSupprimees": mesures}

    def mesures(self, consommateur_id: str) -> list:
        self.get_consommateur(consommateur_id)
        from app.services.mesure_service import MesureService

        return MesureService(self.fuseki).list_mesures(concerne=consommateur_id)

    def stats(self) -> dict:
        rows = self.fuseki.select(
            """
            SELECT ?type (COUNT(DISTINCT ?c) AS ?nb) WHERE {
              ?c a ?type . ?type rdfs:subClassOf* solarx:Consommateur . FILTER(?type != solarx:Consommateur)
            } GROUP BY ?type ORDER BY DESC(?nb)
            """
        )
        total_mesures = self.fuseki.select(
            "SELECT (COUNT(DISTINCT ?m) AS ?n) WHERE { ?m a/rdfs:subClassOf* solarx:Mesure }"
        )
        return {
            "parType": [{"type": local_name(r["type"]), "nombre": int(r["nb"])} for r in rows],
            "totalConsommateurs": sum(int(r["nb"]) for r in rows),
            "totalMesures": int(total_mesures[0]["n"]) if total_mesures else 0,
        }

    def stats_avancees(self) -> dict:
        # Consommation totale par type de consommateur
        par_type_consommation = self.fuseki.select(
            """
            SELECT ?type (SUM(?v) AS ?total) (COUNT(DISTINCT ?m) AS ?nbMesures) WHERE {
              ?m a/rdfs:subClassOf* solarx:MesureConsommation ; solarx:valeur ?v ; solarx:concerne ?c .
              ?c a ?type . ?type rdfs:subClassOf* solarx:Consommateur . FILTER(?type != solarx:Consommateur)
            } GROUP BY ?type ORDER BY DESC(?total)
            """
        )
        # Top consommateurs par consommation totale
        top_rows = self.fuseki.select(
            """
            SELECT ?c ?nom ?type (SUM(?v) AS ?total) (COUNT(?m) AS ?nb) WHERE {
              ?m a/rdfs:subClassOf* solarx:MesureConsommation ; solarx:valeur ?v ; solarx:concerne ?c .
              ?c a ?type . ?type rdfs:subClassOf* solarx:Consommateur . FILTER(?type != solarx:Consommateur)
              OPTIONAL { ?c solarx:nom ?nom }
            } GROUP BY ?c ?nom ?type ORDER BY DESC(?total) LIMIT 5
            """
        )
        # Consommation par ville
        par_ville = self.fuseki.select(
            """
            SELECT ?ville ?villeNom (SUM(?v) AS ?total) WHERE {
              ?m a/rdfs:subClassOf* solarx:MesureConsommation ; solarx:valeur ?v ; solarx:concerne ?c .
              ?c solarx:situeDans ?ville . ?ville a solarx:Ville .
              OPTIONAL { ?ville solarx:nom ?villeNom }
            } GROUP BY ?ville ?villeNom ORDER BY DESC(?total)
            """
        )
        # Production vs consommation
        prod = self.fuseki.select(
            "SELECT (SUM(?v) AS ?total) WHERE { ?m a/rdfs:subClassOf* solarx:MesureProduction ; solarx:valeur ?v }"
        )
        conso = self.fuseki.select(
            "SELECT (SUM(?v) AS ?total) WHERE { ?m a/rdfs:subClassOf* solarx:MesureConsommation ; solarx:valeur ?v }"
        )
        total_prod = float(prod[0]["total"]) if prod and "total" in prod[0] else 0.0
        total_conso = float(conso[0]["total"]) if conso and "total" in conso[0] else 0.0
        return {
            "consommationParType": [
                {"type": local_name(r["type"]), "total": round(float(r["total"]), 2), "nbMesures": int(r["nbMesures"])}
                for r in par_type_consommation
            ],
            "topConsommateurs": [
                {"id": local_name(r["c"]), "nom": r.get("nom") or local_name(r["c"]), "type": local_name(r["type"]),
                 "total": round(float(r["total"]), 2), "nbMesures": int(r["nb"])}
                for r in top_rows
            ],
            "consommationParVille": [
                {"ville": local_name(r["ville"]), "villeNom": r.get("villeNom") or local_name(r["ville"]),
                 "total": round(float(r["total"]), 2)}
                for r in par_ville
            ],
            "productionTotale": round(total_prod, 2),
            "consommationTotale": round(total_conso, 2),
            "tauxAutoconsommation": round((total_prod / total_conso * 100) if total_conso else 0.0, 1),
        }

    def alertes(self, seuil_pct: float = 30.0, jours_sans_mesure: int = 7) -> list[dict]:
        from datetime import datetime, timedelta, timezone

        from app.services.mesure_service import MesureService

        consommateurs = self.list_consommateurs()
        alertes = []
        maintenant = datetime.now(timezone.utc)
        for c in consommateurs:
            mesures = MesureService(self.fuseki).list_mesures(concerne=c.id, type_="MesureConsommation")
            if not mesures:
                alertes.append({
                    "consommateur": c.id, "nom": c.nom, "type": c.type, "ville": c.villeNom or c.ville,
                    "niveau": "warning", "raison": "Aucune mesure de consommation enregistrée.",
                })
                continue
            mesures_triees = sorted(mesures, key=lambda m: m.dateMesure, reverse=True)
            derniere = mesures_triees[0]
            try:
                date_derniere = datetime.fromisoformat(derniere.dateMesure.replace("Z", "+00:00"))
            except ValueError:
                date_derniere = maintenant
            if (maintenant - date_derniere).days >= jours_sans_mesure:
                alertes.append({
                    "consommateur": c.id, "nom": c.nom, "type": c.type, "ville": c.villeNom or c.ville,
                    "niveau": "warning",
                    "raison": f"Aucune mesure depuis { (maintenant - date_derniere).days } jours.",
                    "derniereValeur": derniere.valeur, "dateMesure": derniere.dateMesure,
                })
            if len(mesures_triees) >= 2:
                historique = [m.valeur for m in mesures_triees[1:]]
                moyenne = sum(historique) / len(historique) if historique else 0
                if moyenne > 0 and derniere.valeur > moyenne * (1 + seuil_pct / 100.0):
                    alertes.append({
                        "consommateur": c.id, "nom": c.nom, "type": c.type, "ville": c.villeNom or c.ville,
                        "niveau": "critical",
                        "raison": f"Consommation anormale : {derniere.valeur} kWh vs moyenne {round(moyenne,2)} kWh (+{seuil_pct}%).",
                        "derniereValeur": derniere.valeur, "dateMesure": derniere.dateMesure,
                    })
        return alertes

    def repondre_question(self, question: str) -> dict:
        q = (question or "").lower()
        stats = self.stats_avancees()
        if "top" in q or "plus" in q or "plus grand" in q:
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