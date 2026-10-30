"""Localisation endpoints (CRUD on solarx:Ville, list of solarx:Region)."""

from fastapi import APIRouter, Depends, Path, Query

from app.schemas.localisation import GeocodageInverse, Region, Ville, VilleCreate, VilleUpdate
from app.services.fuseki import LOCAL_NAME_PATTERN, FusekiClient, get_fuseki
from app.services.localisation_service import LocalisationService

router = APIRouter()

VilleId = Path(pattern=LOCAL_NAME_PATTERN, description="Nom local de l'individu Ville (ex. Tunis)")


def get_service(fuseki: FusekiClient = Depends(get_fuseki)) -> LocalisationService:
    return LocalisationService(fuseki)


@router.get("/regions", response_model=list[Region])
def list_regions(service: LocalisationService = Depends(get_service)):
    return service.list_regions()


@router.get("/geocodage-inverse", response_model=GeocodageInverse)
def geocodage_inverse(
    lat: float = Query(ge=-90, le=90),
    lon: float = Query(ge=-180, le=180),
    service: LocalisationService = Depends(get_service),
):
    return service.geocodage_inverse(lat, lon)


@router.get("/villes", response_model=list[Ville])
def list_villes(
    q: str | None = Query(None, max_length=80, description="Recherche par nom"),
    region: str | None = Query(None, pattern=LOCAL_NAME_PATTERN),
    service: LocalisationService = Depends(get_service),
):
    return service.list_villes(q, region)


@router.get("/villes/{ville_id}", response_model=Ville)
def get_ville(ville_id: str = VilleId, service: LocalisationService = Depends(get_service)):
    return service.get_ville(ville_id)


@router.post("/villes", response_model=Ville, status_code=201)
def create_ville(data: VilleCreate, service: LocalisationService = Depends(get_service)):
    return service.create_ville(data)


@router.put("/villes/{ville_id}", response_model=Ville)
def update_ville(
    data: VilleUpdate, ville_id: str = VilleId, service: LocalisationService = Depends(get_service)
):
    return service.update_ville(ville_id, data)


@router.delete("/villes/{ville_id}")
def delete_ville(
    ville_id: str = VilleId,
    cascade: bool = Query(False, description="Supprimer aussi les mesures météo de la ville"),
    service: LocalisationService = Depends(get_service),
):
    return service.delete_ville(ville_id, cascade)
