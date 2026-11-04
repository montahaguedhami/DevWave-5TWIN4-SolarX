"""Aggregate router for API v1."""

from fastapi import APIRouter

from app.api.v1.endpoints import consommation, consommateurs, health, ia, lignes, localisation, meteo, production, reseaux
from app.api.v1.endpoints import equipements, stockage  # module P2
from app.api.v1.endpoints import incidents, maintenances  # module P6 (Maintenance + Incident)
from app.api.v1.endpoints import analytics  # analyse énergétique reliée à Fuseki

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(localisation.router, prefix="/localisation", tags=["localisation"])
api_router.include_router(meteo.router, prefix="/meteo", tags=["meteo"])
api_router.include_router(lignes.router, prefix="/lignes", tags=["lignes"])

api_router.include_router(maintenances.router, prefix="/maintenances", tags=["maintenances"])
# Module Analytics
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


