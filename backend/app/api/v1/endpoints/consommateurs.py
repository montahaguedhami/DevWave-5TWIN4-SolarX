"""CRUD API for consumer sites shown in My Installation."""

from fastapi import APIRouter, Depends, Response

from app.schemas.consommateur import Consumer, ConsumerEquipment, ConsumerType, ConsumerWrite
from app.services.consommateur_service import ConsumerService
from app.services.fuseki import FusekiClient, get_fuseki

router = APIRouter()


def get_service(fuseki: FusekiClient = Depends(get_fuseki)) -> ConsumerService:
    return ConsumerService(fuseki)


@router.get("/types", response_model=list[ConsumerType])
def consumer_types():
    return list(ConsumerType)


@router.get("", response_model=list[Consumer])
def list_consumers(type: ConsumerType | None = None, service: ConsumerService = Depends(get_service)):
    return service.list_consumers(type.value if type else None)


@router.post("", response_model=Consumer, status_code=201)
def create_consumer(data: ConsumerWrite, service: ConsumerService = Depends(get_service)):
    return service.create_consumer(data)


@router.get("/equipements", response_model=list[ConsumerEquipment])
def list_equipment(service: ConsumerService = Depends(get_service)):
    return service.list_equipment()


@router.get("/{consumer_id}", response_model=Consumer)
def get_consumer(consumer_id: str, service: ConsumerService = Depends(get_service)):
    return service.get_consumer(consumer_id)


@router.put("/{consumer_id}", response_model=Consumer)
def update_consumer(consumer_id: str, data: ConsumerWrite, service: ConsumerService = Depends(get_service)):
    return service.update_consumer(consumer_id, data)


@router.delete("/{consumer_id}", status_code=204)
def delete_consumer(consumer_id: str, service: ConsumerService = Depends(get_service)) -> Response:
    service.delete_consumer(consumer_id)
    return Response(status_code=204)
