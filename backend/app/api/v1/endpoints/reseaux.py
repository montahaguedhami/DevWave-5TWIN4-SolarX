"""Réseaux électriques : liste et détail (lignes + flux installation -> ligne -> consommateur)."""

from fastapi import APIRouter, Depends, Path

from app.api.v1.endpoints.lignes import get_service
from app.services.fuseki import LOCAL_NAME_PATTERN
from app.services.lignes_service import LignesService

router = APIRouter()


@router.get("")
def list_reseaux(service: LignesService = Depends(get_service)):
    """Réseaux avec leur nombre de lignes, leur longueur totale et les consommateurs desservis."""
    return service.list_reseaux()


@router.get("/{reseau_id}")
def get_reseau(
    reseau_id: str = Path(pattern=LOCAL_NAME_PATTERN, description="Ex. ReseauTransport_01"),
    service: LignesService = Depends(get_service),
):
    return service.get_reseau(reseau_id)
