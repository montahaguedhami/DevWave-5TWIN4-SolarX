"""Module P2 — Stockage : liste, capacité totale (agrégation), détail, CRUD (SPARQL UPDATE)."""

from typing import Literal

from fastapi import APIRouter, Depends, Path, Query, status
from pydantic import BaseModel, Field

from app.services.fuseki import LOCAL_NAME_PATTERN, FusekiClient, get_fuseki
from app.services.stockage_service import StockageService
from app.services.typed_sparql import PREFIXES, TypedSparql

router = APIRouter()

TypeStockage = Literal["Batterie", "StockageHydraulique"]
Etat = Literal["Fonctionnel", "Maintenance", "En panne"]


class StockageCreate(BaseModel):
    id: str | None = Field(None, pattern=LOCAL_NAME_PATTERN, description="Ex. Batterie_08 (généré si vide)")
    type: TypeStockage
    nom: str = Field(..., min_length=1, max_length=120)
    capaciteKWh: float = Field(..., gt=0)
    energieStockeeKWh: float = Field(0, ge=0)
    puissanceMaxKW: float | None = Field(None, gt=0)
    technologie: str | None = Field(None, max_length=120)
    etat: Etat | None = None
    localisation: str | None = Field(None, pattern=LOCAL_NAME_PATTERN, description="Ex. Tunis")
    alimentePar: str | None = Field(None, pattern=LOCAL_NAME_PATTERN, description="Ex. ParcSolaire_Djerba")


class StockageUpdate(BaseModel):
    nom: str | None = Field(None, min_length=1, max_length=120)
    capaciteKWh: float | None = Field(None, gt=0)
    energieStockeeKWh: float | None = Field(None, ge=0)
    puissanceMaxKW: float | None = Field(None, gt=0)
    technologie: str | None = Field(None, max_length=120)
    etat: Etat | None = None
    localisation: str | None = Field(None, pattern=LOCAL_NAME_PATTERN)
    alimentePar: str | None = Field(None, pattern=LOCAL_NAME_PATTERN)


def get_service(fuseki: FusekiClient = Depends(get_fuseki)) -> StockageService:
    return StockageService(TypedSparql(fuseki), fuseki)


@router.get("")
def list_stockages(
    type: TypeStockage | None = None,
    q: str | None = Query(None, max_length=80, description="Recherche (nom, identifiant, technologie) : FILTER CONTAINS"),
    etat: Literal["Fonctionnel", "Maintenance", "En panne", "Alerte"] | None = None,
    localisation: str | None = Query(None, pattern=LOCAL_NAME_PATTERN, description="Ex. Tunis"),
    capacite_min: float | None = Query(None, ge=0, description="kWh"),
    capacite_max: float | None = Query(None, ge=0, description="kWh"),
    niveau_min: float | None = Query(None, ge=0, le=100, description="% de charge"),
    niveau_max: float | None = Query(None, ge=0, le=100, description="% de charge"),
    afficher_sparql: bool = Query(False, description="Renvoie aussi la requête SPARQL exécutée"),
    service: StockageService = Depends(get_service),
):
    """Batteries et stockages hydrauliques. Filtrage et recherche exécutés par Fuseki (FILTER SPARQL)."""
    rows = service.list_stockages(
        type, q=q, etat=etat, localisation=localisation, capacite_min=capacite_min,
        capacite_max=capacite_max, niveau_min=niveau_min, niveau_max=niveau_max,
    )
    if afficher_sparql:
        return {"sparql": PREFIXES.strip() + "\n" + service.derniere_requete.strip(), "resultats": rows}
    return rows


@router.get("/capacite-totale")
def capacite_totale(type: TypeStockage | None = None, service: StockageService = Depends(get_service)):
    """Agrégation SPARQL : capacité totale, énergie stockée et taux de remplissage, par type."""
    return service.capacite_totale(type)


@router.get("/referentiel")
def referentiel(service: StockageService = Depends(get_service)):
    """Localisations et installations existantes (listes des formulaires)."""
    return service.referentiel()


@router.get("/{stockage_id}")
def get_stockage(
    stockage_id: str = Path(pattern=LOCAL_NAME_PATTERN, description="Ex. Batterie_01"),
    service: StockageService = Depends(get_service),
):
    return service.get_stockage(stockage_id)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_stockage(body: StockageCreate, service: StockageService = Depends(get_service)):
    """CREATE — INSERT DATA."""
    return service.create(body.model_dump())


@router.put("/{stockage_id}")
def update_stockage(
    body: StockageUpdate,
    stockage_id: str = Path(pattern=LOCAL_NAME_PATTERN),
    service: StockageService = Depends(get_service),
):
    """UPDATE — DELETE WHERE + INSERT DATA (seuls les champs envoyés sont modifiés)."""
    return service.update(stockage_id, body.model_dump(exclude_unset=True))


@router.delete("/{stockage_id}")
def delete_stockage(
    stockage_id: str = Path(pattern=LOCAL_NAME_PATTERN), service: StockageService = Depends(get_service)
):
    """DELETE — supprime l'individu et les triplets qui le citent."""
    return service.delete(stockage_id)
