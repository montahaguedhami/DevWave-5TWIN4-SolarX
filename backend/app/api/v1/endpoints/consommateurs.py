"""CRUD endpoints for Consommateur."""

from fastapi import APIRouter, Depends, HTTPException, Path, Query

from app.schemas.consommateur import (
    Consommateur,
    ConsommateurCreate,
    ConsommateurUpdate,
)
from app.schemas.mesure import Mesure
from app.services.consommateur_service import ConsommateurService
from app.services.fuseki import FusekiClient, LOCAL_NAME_PATTERN, get_fuseki

router = APIRouter()

ConsommateurId = Path(pattern=LOCAL_NAME_PATTERN, description="Identifiant du consommateur")


def get_service(fuseki: FusekiClient = Depends(get_fuseki)) -> ConsommateurService:
    return ConsommateurService(fuseki)


@router.get("/stats")
def stats(service: ConsommateurService = Depends(get_service)):
    return service.stats()


@router.get("/stats/avancees")
def stats_avancees(service: ConsommateurService = Depends(get_service)):
    return service.stats_avancees()


@router.get("/alertes")
def alertes(service: ConsommateurService = Depends(get_service)):
    return service.alertes()


@router.get("/", response_model=list[Consommateur])
def list_consommateurs(
    type: str | None = Query(None),
    ville: str | None = Query(None, pattern=LOCAL_NAME_PATTERN),
    q: str | None = Query(None, max_length=80),
    service: ConsommateurService = Depends(get_service),
):
    return service.list_consommateurs(type_=type, ville=ville, q=q)


@router.get("/{consommateur_id}", response_model=Consommateur)
def get_consommateur(
    consommateur_id: str = ConsommateurId, service: ConsommateurService = Depends(get_service)
):
    return service.get_consommateur(consommateur_id)


@router.post("/", response_model=Consommateur, status_code=201)
def create_consommateur(
    data: ConsommateurCreate, service: ConsommateurService = Depends(get_service)
):
    return service.create_consommateur(data)


@router.put("/{consommateur_id}", response_model=Consommateur)
def update_consommateur(
    data: ConsommateurUpdate,
    consommateur_id: str = ConsommateurId,
    service: ConsommateurService = Depends(get_service),
):
    return service.update_consommateur(consommateur_id, data)


@router.delete("/{consommateur_id}")
def delete_consommateur(
    consommateur_id: str = ConsommateurId,
    cascade: bool = Query(False),
    service: ConsommateurService = Depends(get_service),
):
    return service.delete_consommateur(consommateur_id, cascade)


@router.get("/{consommateur_id}/mesures", response_model=list[Mesure])
def mesures_du_consommateur(
    consommateur_id: str = ConsommateurId, service: ConsommateurService = Depends(get_service)
):
    return service.mesures(consommateur_id)