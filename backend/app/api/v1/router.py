"""Aggregate router for API v1."""

from fastapi import APIRouter

from app.api.v1.endpoints import health, localisation, meteo

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(localisation.router, prefix="/localisation", tags=["localisation"])
api_router.include_router(meteo.router, prefix="/meteo", tags=["meteo"])

# TODO (team): register routers for new entities here, e.g.
# from app.api.v1.endpoints import notes
# api_router.include_router(notes.router, prefix="/notes", tags=["notes"])