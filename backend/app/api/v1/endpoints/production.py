"""Production installation and energy source endpoints."""

from fastapi import APIRouter, Depends, Response

from app.schemas.production import (
    InstallationType, InstallationWrite, ProductionInstallation, ProductionMeasurement, ProductionMeasurementWrite, ProductionStats,
    ProductionStatsByType, SourceEnergie, SourceType, SourceWrite,
)
from app.services.fuseki import FusekiClient, get_fuseki
from app.services.production_service import ProductionService
from app.services.source_energie_service import SourceEnergieService

router = APIRouter()


def get_service(fuseki: FusekiClient = Depends(get_fuseki)) -> ProductionService:
    return ProductionService(fuseki)


def get_source_service(fuseki: FusekiClient = Depends(get_fuseki)) -> SourceEnergieService:
    return SourceEnergieService(fuseki)


@router.get("/installations", response_model=list[ProductionInstallation])
def list_installations(type: InstallationType | None = None, source: SourceType | None = None, service: ProductionService = Depends(get_service)):
    return service.list_installations(type.value if type else None, source.value if source else None)


@router.get("/mesures", response_model=list[ProductionMeasurement])
def list_production_measurements(service: ProductionService = Depends(get_service)):
    return service.list_measurements()


@router.post("/mesures", response_model=ProductionMeasurement, status_code=201)
def create_production_measurement(data: ProductionMeasurementWrite, service: ProductionService = Depends(get_service)):
    return service.create_measurement(data)


@router.get("/mesures/{measurement_id}", response_model=ProductionMeasurement)
def get_production_measurement(measurement_id: str, service: ProductionService = Depends(get_service)):
    return service.get_measurement(measurement_id)


@router.put("/mesures/{measurement_id}", response_model=ProductionMeasurement)
def update_production_measurement(measurement_id: str, data: ProductionMeasurementWrite, service: ProductionService = Depends(get_service)):
    return service.update_measurement(measurement_id, data)


@router.delete("/mesures/{measurement_id}", status_code=204)
def delete_production_measurement(measurement_id: str, service: ProductionService = Depends(get_service)) -> Response:
    service.delete_measurement(measurement_id)
    return Response(status_code=204)


@router.post("/installations", response_model=ProductionInstallation, status_code=201)
def create_installation(data: InstallationWrite, service: ProductionService = Depends(get_service)):
    return service.installations.create_installation(data)


@router.get("/installations/{installation_id}", response_model=ProductionInstallation)
def get_installation(installation_id: str, service: ProductionService = Depends(get_service)):
    return service.installations.get_installation(installation_id)


@router.put("/installations/{installation_id}", response_model=ProductionInstallation)
def update_installation(installation_id: str, data: InstallationWrite, service: ProductionService = Depends(get_service)):
    return service.installations.update_installation(installation_id, data)


@router.delete("/installations/{installation_id}", status_code=204)
def delete_installation(installation_id: str, service: ProductionService = Depends(get_service)) -> Response:
    service.installations.delete_installation(installation_id)
    return Response(status_code=204)


@router.get("/sources/types", response_model=list[SourceType])
def source_types():
    return list(SourceType)


@router.get("/sources", response_model=list[SourceEnergie])
def list_sources(type: SourceType | None = None, q: str | None = None, service: SourceEnergieService = Depends(get_source_service)):
    return service.list_sources(type.value if type else None, q)


@router.post("/sources", response_model=SourceEnergie, status_code=201)
def create_source(data: SourceWrite, service: SourceEnergieService = Depends(get_source_service)):
    return service.create_source(data)


@router.get("/sources/{source_id}/installations", response_model=list[ProductionInstallation])
def source_installations(source_id: str, service: SourceEnergieService = Depends(get_source_service)):
    return service.installations_for_source(source_id)


@router.get("/sources/{source_id}", response_model=SourceEnergie)
def get_source(source_id: str, service: SourceEnergieService = Depends(get_source_service)):
    return service.get_source(source_id)


@router.put("/sources/{source_id}", response_model=SourceEnergie)
def update_source(source_id: str, data: SourceWrite, service: SourceEnergieService = Depends(get_source_service)):
    return service.update_source(source_id, data)


@router.delete("/sources/{source_id}", status_code=204)
def delete_source(source_id: str, service: SourceEnergieService = Depends(get_source_service)) -> Response:
    service.delete_source(source_id)
    return Response(status_code=204)


@router.get("/stats/par-type", response_model=ProductionStatsByType)
def stats_par_type(service: ProductionService = Depends(get_service)):
    return service.stats_par_type()


@router.get("/stats", response_model=ProductionStats)
def stats(service: ProductionService = Depends(get_service)):
    return service.stats()
