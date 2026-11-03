"""Read-only consumption measurement endpoint."""

from fastapi import APIRouter, Depends, Query

from app.schemas.consommation import ConsumptionMeasurement
from app.services.consommation_service import ConsumptionService
from app.services.fuseki import FusekiClient, get_fuseki

router = APIRouter()


def get_service(fuseki: FusekiClient = Depends(get_fuseki)) -> ConsumptionService:
    return ConsumptionService(fuseki)


@router.get("/mesures", response_model=list[ConsumptionMeasurement])
def list_measurements(consommateur_id: str | None = Query(None, max_length=100), service: ConsumptionService = Depends(get_service)):
    return service.list_measurements(consommateur_id)
