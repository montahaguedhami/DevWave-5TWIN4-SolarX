"""Lignes de transport : liste (filtres type / réseau), statistiques, détail."""

from typing import Literal

from fastapi import APIRouter, Depends, Path, Query

from app.services.fuseki import LOCAL_NAME_PATTERN, FusekiClient, get_fuseki
from app.services.lignes_service import LignesService
from app.services.typed_sparql import TypedSparql

router = APIRouter()

TypeLigne = Literal["LigneBasseTension", "LigneMoyenneTension", "LigneHauteTension"]


def get_service(fuseki: FusekiClient = Depends(get_fuseki)) -> LignesService:
    return LignesService(TypedSparql(fuseki))


@router.get("")
def list_lignes(
    type: TypeLigne | None = None,
    reseau: str | None = Query(None, pattern=LOCAL_NAME_PATTERN, description="Ex. ReseauNational_01"),
    service: LignesService = Depends(get_service),
):
    """Lignes avec tension, longueur, consommateurs desservis, installations reliées, réseaux et état."""
    return service.list_lignes(type, reseau)


@router.get("/stats")
def stats_lignes(service: LignesService = Depends(get_service)):
    """Agrégation SPARQL : nombre de lignes, longueur totale, tensions, par niveau de tension."""
    return service.stats()


@router.get("/{ligne_id}")
def get_ligne(
    ligne_id: str = Path(pattern=LOCAL_NAME_PATTERN, description="Ex. LigneHauteTension_01"),
    service: LignesService = Depends(get_service),
):
    return service.get_ligne(ligne_id)
