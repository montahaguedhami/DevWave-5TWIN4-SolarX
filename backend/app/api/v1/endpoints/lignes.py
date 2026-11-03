"""Lignes de transport : liste (filtres type / réseau, recherche), statistiques, détail, CRUD (SPARQL UPDATE)."""

from typing import Annotated, Literal

from fastapi import APIRouter, BackgroundTasks, Depends, Path, Query, status
from pydantic import BaseModel, Field

from app.services.fuseki import LOCAL_NAME_PATTERN, FusekiClient, get_fuseki
from app.services.ia_service import relire_schema
from app.services.lignes_service import LignesService
from app.services.typed_sparql import TypedSparql

router = APIRouter()

TypeLigne = Literal["LigneBasseTension", "LigneMoyenneTension", "LigneHauteTension"]
Identifiant = Annotated[str, Field(pattern=LOCAL_NAME_PATTERN)]


class LigneCreate(BaseModel):
    id: Identifiant | None = Field(None, description="Ex. LigneHauteTension_04 (généré si vide)")
    type: TypeLigne
    nom: str = Field(..., min_length=1, max_length=120)
    tensionKV: float = Field(..., gt=0)
    longueurKm: float = Field(..., gt=0)
    reseaux: list[Identifiant] = []
    relie: list[Identifiant] = []
    dessert: list[Identifiant] = []


class LigneUpdate(BaseModel):
    nom: str | None = Field(None, min_length=1, max_length=120)
    tensionKV: float | None = Field(None, gt=0)
    longueurKm: float | None = Field(None, gt=0)
    reseaux: list[Identifiant] | None = None
    relie: list[Identifiant] | None = None
    dessert: list[Identifiant] | None = None


def get_service(fuseki: FusekiClient = Depends(get_fuseki)) -> LignesService:
    return LignesService(TypedSparql(fuseki), fuseki)


@router.get("")
def list_lignes(
    type: TypeLigne | None = None,
    reseau: str | None = Query(None, pattern=LOCAL_NAME_PATTERN, description="Ex. ReseauNational_01"),
    q: str | None = Query(None, max_length=80, description="Recherche (nom, identifiant) : FILTER CONTAINS"),
    service: LignesService = Depends(get_service),
):
    """Lignes avec tension, longueur, consommateurs desservis, installations reliées, réseaux et état."""
    return service.list_lignes(type, reseau, q)


@router.get("/stats")
def stats_lignes(service: LignesService = Depends(get_service)):
    """Agrégation SPARQL : nombre de lignes, longueur totale, tensions, par niveau de tension."""
    return service.stats()


@router.get("/referentiel")
def referentiel(service: LignesService = Depends(get_service)):
    """Installations et consommateurs proposés par le formulaire."""
    return service.referentiel()


@router.get("/{ligne_id}")
def get_ligne(
    ligne_id: str = Path(pattern=LOCAL_NAME_PATTERN, description="Ex. LigneHauteTension_01"),
    service: LignesService = Depends(get_service),
):
    return service.get_ligne(ligne_id)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_ligne(body: LigneCreate, tasks: BackgroundTasks, service: LignesService = Depends(get_service)):
    ligne = service.create_ligne(body.model_dump())
    tasks.add_task(relire_schema)
    return ligne


@router.put("/{ligne_id}")
def update_ligne(
    body: LigneUpdate,
    tasks: BackgroundTasks,
    ligne_id: str = Path(pattern=LOCAL_NAME_PATTERN),
    service: LignesService = Depends(get_service),
):
    ligne = service.update_ligne(ligne_id, body.model_dump(exclude_unset=True))
    tasks.add_task(relire_schema)
    return ligne


@router.delete("/{ligne_id}")
def delete_ligne(
    tasks: BackgroundTasks,
    ligne_id: str = Path(pattern=LOCAL_NAME_PATTERN),
    service: LignesService = Depends(get_service),
):
    resultat = service.delete_ligne(ligne_id)
    tasks.add_task(relire_schema)
    return resultat
