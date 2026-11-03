"""Réseaux électriques : liste, détail (lignes + flux installation -> ligne -> consommateur), CRUD (SPARQL UPDATE)."""

from typing import Literal

from fastapi import APIRouter, BackgroundTasks, Depends, Path, status
from pydantic import BaseModel, Field

from app.api.v1.endpoints.lignes import Identifiant, get_service
from app.services.fuseki import LOCAL_NAME_PATTERN
from app.services.ia_service import relire_schema
from app.services.lignes_service import LignesService

router = APIRouter()


class ReseauCreate(BaseModel):
    id: Identifiant | None = Field(None, description="Ex. ReseauTransport_02 (généré si vide)")
    type: Literal["ReseauTransport", "ReseauDistribution"]
    nom: str = Field(..., min_length=1, max_length=120)
    lignes: list[Identifiant] = []


class ReseauUpdate(BaseModel):
    nom: str | None = Field(None, min_length=1, max_length=120)
    lignes: list[Identifiant] | None = None


@router.get("")
def list_reseaux(service: LignesService = Depends(get_service)):
    """Réseaux avec leur nombre de lignes, leur longueur totale et les consommateurs desservis."""
    return service.list_reseaux()


@router.get("/stats")
def stats_reseaux(service: LignesService = Depends(get_service)):
    """Totaux sur tous les réseaux, sans compter deux fois une ligne ou un consommateur partagé."""
    return service.stats_reseaux()


@router.get("/{reseau_id}")
def get_reseau(
    reseau_id: str = Path(pattern=LOCAL_NAME_PATTERN, description="Ex. ReseauTransport_01"),
    service: LignesService = Depends(get_service),
):
    return service.get_reseau(reseau_id)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_reseau(body: ReseauCreate, tasks: BackgroundTasks, service: LignesService = Depends(get_service)):
    reseau = service.create_reseau(body.model_dump())
    tasks.add_task(relire_schema)
    return reseau


@router.put("/{reseau_id}")
def update_reseau(
    body: ReseauUpdate,
    tasks: BackgroundTasks,
    reseau_id: str = Path(pattern=LOCAL_NAME_PATTERN),
    service: LignesService = Depends(get_service),
):
    reseau = service.update_reseau(reseau_id, body.model_dump(exclude_unset=True))
    tasks.add_task(relire_schema)
    return reseau


@router.delete("/{reseau_id}")
def delete_reseau(
    tasks: BackgroundTasks,
    reseau_id: str = Path(pattern=LOCAL_NAME_PATTERN),
    service: LignesService = Depends(get_service),
):
    resultat = service.delete_reseau(reseau_id)
    tasks.add_task(relire_schema)
    return resultat
