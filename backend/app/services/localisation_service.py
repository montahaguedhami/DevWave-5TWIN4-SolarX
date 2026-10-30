"""Business logic for the Localisation module (solarx:Ville / solarx:Region).

Villes are linked to their Region with the existing property ``solarx:situeDans``.
"""

import math
import re
import unicodedata

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.localisation import GeocodageInverse, Region, Ville, VilleCreate, VilleUpdate
from app.services.fuseki import (
    FusekiClient,
    decimal_literal,
    iri,
    local_name,
    string_literal,
)

IS_METEO = "a/rdfs:subClassOf* solarx:ConditionMeteo"

_VILLE_QUERY = """
SELECT ?ville ?nom ?lat ?lon ?region ?regionNom ?nbMesures ?nbLiens WHERE {{
  ?ville a solarx:Ville .
  OPTIONAL {{ ?ville solarx:nom ?nom }}
  OPTIONAL {{ ?ville solarx:latitude ?lat }}
  OPTIONAL {{ ?ville solarx:longitude ?lon }}
  OPTIONAL {{
    ?ville solarx:situeDans ?region . ?region a solarx:Region .
    OPTIONAL {{ ?region solarx:nom ?regionNom }}
  }}
  OPTIONAL {{
    SELECT ?ville (COUNT(DISTINCT ?m) AS ?nbMesures) WHERE {{
      ?m solarx:situeDans ?ville ; {is_meteo} .
    }} GROUP BY ?ville
  }}
  OPTIONAL {{
    SELECT ?ville (COUNT(DISTINCT ?s) AS ?nbLiens) WHERE {{
      ?s ?p ?ville .
      FILTER NOT EXISTS {{ ?s {is_meteo} }}
    }} GROUP BY ?ville
  }}
  {filters}
}}
ORDER BY LCASE(STR(COALESCE(?nom, ?ville)))
"""


def _slugify(nom: str) -> str:
    ascii_name = unicodedata.normalize("NFKD", nom).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^A-Za-z0-9]+", "_", ascii_name).strip("_")[:60]
    if not slug or not slug[0].isalpha():
        slug = f"Ville_{slug}".rstrip("_")
    return slug


def _distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi, dlambda = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(a))


def _to_ville(row: dict[str, str]) -> Ville:
    return Ville(
        id=local_name(row["ville"]),
        nom=row.get("nom") or local_name(row["ville"]),
        latitude=float(row["lat"]) if "lat" in row else None,
        longitude=float(row["lon"]) if "lon" in row else None,
        region=local_name(row["region"]) if "region" in row else None,
        regionNom=row.get("regionNom") or (local_name(row["region"]) if "region" in row else None),
        nbMesures=int(row.get("nbMesures", 0)),
        nbLiens=int(row.get("nbLiens", 0)),
    )


class LocalisationService:
    def __init__(self, fuseki: FusekiClient) -> None:
        self.fuseki = fuseki

    # ---- Regions -------------------------------------------------------
    def list_regions(self) -> list[Region]:
        rows = self.fuseki.select(
            """
            SELECT ?region (SAMPLE(?n) AS ?nom) (COUNT(DISTINCT ?v) AS ?nbVilles) WHERE {
              ?region a solarx:Region .
              OPTIONAL { ?region solarx:nom ?n }
              OPTIONAL { ?v a solarx:Ville ; solarx:situeDans ?region }
            } GROUP BY ?region ORDER BY ?nom
            """
        )
        return [
            Region(
                id=local_name(r["region"]),
                nom=r.get("nom") or local_name(r["region"]),
                nbVilles=int(r.get("nbVilles", 0)),
            )
            for r in rows
        ]

    def _ensure_region(self, region_id: str) -> None:
        if not self.fuseki.ask(f"ASK {{ {iri(region_id)} a solarx:Region }}"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Région inconnue : {region_id}")

    # ---- Map click -> pre-filled form ----------------------------------
    def geocodage_inverse(self, latitude: float, longitude: float) -> GeocodageInverse:
        resultat = GeocodageInverse(latitude=round(latitude, 4), longitude=round(longitude, 4))
        try:
            response = httpx.get(
                settings.NOMINATIM_URL,
                params={"format": "jsonv2", "lat": latitude, "lon": longitude, "zoom": 10, "accept-language": "fr"},
                headers={"User-Agent": settings.NOMINATIM_USER_AGENT},
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()
            adresse = data.get("address", {})
            resultat.nom = next(
                (adresse[k] for k in ("city", "town", "village", "municipality", "county", "state") if adresse.get(k)),
                None,
            )
            resultat.adresse = data.get("display_name")
        except (httpx.HTTPError, ValueError):
            pass  # Name stays empty: the user can still type it.

        # Region of the nearest city already in the ontology.
        toutes = self.list_villes()
        villes = [v for v in toutes if v.latitude is not None and v.longitude is not None and v.region]
        if villes:
            proche = min(villes, key=lambda v: _distance_km(latitude, longitude, v.latitude, v.longitude))
            resultat.regionSuggeree = proche.region
            resultat.villeProche = proche.nom
            resultat.distanceKm = round(_distance_km(latitude, longitude, proche.latitude, proche.longitude), 1)
        if resultat.nom:
            slug = _slugify(resultat.nom)
            resultat.villeExistante = next((v.id for v in toutes if v.id == slug), None)
        return resultat

    # ---- Villes --------------------------------------------------------
    def list_villes(self, q: str | None = None, region: str | None = None) -> list[Ville]:
        filters = []
        if q and q.strip():
            filters.append(
                f"FILTER(CONTAINS(LCASE(STR(COALESCE(?nom, ?ville))), LCASE({string_literal(q.strip())})))"
            )
        if region:
            filters.append(f"FILTER(?region = {iri(region)})")
        rows = self.fuseki.select(_VILLE_QUERY.format(is_meteo=IS_METEO, filters="\n  ".join(filters)))
        villes: dict[str, Ville] = {}
        for row in rows:
            ville = _to_ville(row)
            villes.setdefault(ville.id, ville)
        return list(villes.values())

    def get_ville(self, ville_id: str) -> Ville:
        rows = self.fuseki.select(
            _VILLE_QUERY.format(is_meteo=IS_METEO, filters=f"FILTER(?ville = {iri(ville_id)})")
        )
        if not rows:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Ville introuvable : {ville_id}")
        return _to_ville(rows[0])

    def create_ville(self, data: VilleCreate) -> Ville:
        ville_id = _slugify(data.nom)
        ville = iri(ville_id)
        self._ensure_region(data.region)
        if self.fuseki.ask(f"ASK {{ {{ {ville} ?p ?o }} UNION {{ ?s ?p {ville} }} }}"):
            raise HTTPException(
                status.HTTP_409_CONFLICT, f"L'identifiant {ville_id} existe déjà dans l'ontologie."
            )
        self.fuseki.update(
            f"""
            INSERT DATA {{
              {ville} a owl:NamedIndividual, solarx:Ville ;
                solarx:nom {string_literal(data.nom)} ;
                solarx:latitude {decimal_literal(data.latitude)} ;
                solarx:longitude {decimal_literal(data.longitude)} ;
                solarx:situeDans {iri(data.region)} .
            }}
            """
        )
        return self.get_ville(ville_id)

    def update_ville(self, ville_id: str, data: VilleUpdate) -> Ville:
        ville = iri(ville_id)
        self.get_ville(ville_id)
        self._ensure_region(data.region)
        # The IRI never changes, so links created by other modules stay valid.
        self.fuseki.update(
            f"""
            DELETE WHERE {{ {ville} solarx:nom ?n }} ;
            DELETE WHERE {{ {ville} solarx:latitude ?la }} ;
            DELETE WHERE {{ {ville} solarx:longitude ?lo }} ;
            DELETE {{ {ville} solarx:situeDans ?r }} WHERE {{ {ville} solarx:situeDans ?r . ?r a solarx:Region }} ;
            INSERT DATA {{
              {ville} solarx:nom {string_literal(data.nom)} ;
                solarx:latitude {decimal_literal(data.latitude)} ;
                solarx:longitude {decimal_literal(data.longitude)} ;
                solarx:situeDans {iri(data.region)} .
            }}
            """
        )
        return self.get_ville(ville_id)

    def delete_ville(self, ville_id: str, cascade: bool = False) -> dict:
        ville = iri(ville_id)
        self.get_ville(ville_id)
        rows = self.fuseki.select(
            f"""
            SELECT DISTINCT ?s ?meteo ?protege WHERE {{
              ?s ?p {ville} .
              BIND(EXISTS {{ ?s {IS_METEO} }} AS ?meteo)
              BIND(EXISTS {{ ?s ?p2 ?o2 . FILTER(isIRI(?o2) && ?p2 NOT IN (rdf:type, solarx:situeDans)) }}
                   || EXISTS {{ ?x ?p3 ?s }} AS ?protege)
            }}
            """
        )
        is_true = lambda v: v in ("true", "1")  # noqa: E731
        autres = [local_name(r["s"]) for r in rows if not is_true(r["meteo"]) or is_true(r["protege"])]
        mesures = [local_name(r["s"]) for r in rows if is_true(r["meteo"]) and not is_true(r["protege"])]

        if autres:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                {
                    "message": "Suppression refusée : cette ville est utilisée par d'autres éléments de l'ontologie.",
                    "dependances": autres,
                },
            )
        if mesures and not cascade:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                {
                    "message": f"Cette ville possède {len(mesures)} mesure(s) météo. Confirmez pour les supprimer aussi.",
                    "mesures": mesures,
                    "requiresCascade": True,
                },
            )
        operations = [f"DELETE WHERE {{ {iri(m)} ?p ?o }}" for m in mesures]
        operations.append(f"DELETE WHERE {{ {ville} ?p ?o }}")
        self.fuseki.update(" ;\n".join(operations))
        return {"supprimee": ville_id, "mesuresSupprimees": mesures}
