"""Endpoints API pour l'analyse énergétique (Analytics) reliée à l'ontologie solarx.owl."""

from fastapi import APIRouter, Depends

from app.services.analytics_service import AnalyticsService
from app.services.fuseki import FusekiClient, get_fuseki
from app.services.typed_sparql import TypedSparql

router = APIRouter()


def get_service(fuseki: FusekiClient = Depends(get_fuseki)) -> AnalyticsService:
    return AnalyticsService(TypedSparql(fuseki), fuseki)


@router.get("/overview")
def get_overview(service: AnalyticsService = Depends(get_service)) -> dict:
    """Bilan énergétique global consolidé à partir des données RDF Fuseki."""
    return service.get_overview()


@router.get("/monthly")
def get_monthly(service: AnalyticsService = Depends(get_service)) -> list[dict]:
    """Dynamique mensuelle calculée à partir des relevés de production et profils saisonniers."""
    return service.get_monthly_dynamics()

