"""CRUD endpoints for Mesure."""

from fastapi import APIRouter, Depends, Path, Query

from app.schemas.mesure import Mesure, MesureCreate
from app.services.fuseki import FusekiClient, LOCAL_NAME_PATTERN, get_fuseki
from app.services.mesure_service import MesureService

router = APIRouter()

MesureId = Path(pattern=LOCAL_NAME_PATTERN, description="Identifiant de la mesure")


def get_service(fuseki: FusekiClient = Depends(get_fuseki)) -> MesureService:
    return MesureService(fuseki)


@router.get("/", response_model=list[Mesure])
def list_mesures(
    type: str | None = Query(None),
    concerne: str | None = Query(None, pattern=LOCAL_NAME_PATTERN),
    debut: str | None = Query(None),
    fin: str | None = Query(None),
    source: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    service: MesureService = Depends(get_service),
):
    return service.list_mesures(type_=type, concerne=concerne, debut=debut, fin=fin, source=source, skip=skip, limit=limit)


@router.get("/{mesure_id}", response_model=Mesure)
def get_mesure(mesure_id: str = MesureId, service: MesureService = Depends(get_service)):
    return service.get_mesure(mesure_id)


@router.post("/", response_model=Mesure, status_code=201)
def create_mesure(data: MesureCreate, service: MesureService = Depends(get_service)):
    return service.create_mesure(data)


@router.post("/bulk", response_model=list[Mesure], status_code=201)
def create_mesures_bulk(data: list[MesureCreate], service: MesureService = Depends(get_service)):
    return service.create_mesures_bulk(data)


@router.delete("/{mesure_id}")
def delete_mesure(mesure_id: str = MesureId, service: MesureService = Depends(get_service)):
    return service.delete_mesure(mesure_id)