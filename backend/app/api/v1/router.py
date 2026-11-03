"""Aggregate router for API v1."""

from fastapi import APIRouter

from app.api.v1.endpoints import consommateurs, health, ia, lignes, localisation, mesures, meteo, reseaux

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(localisation.router, prefix="/localisation", tags=["localisation"])
api_router.include_router(meteo.router, prefix="/meteo", tags=["meteo"])
api_router.include_router(lignes.router, prefix="/lignes", tags=["lignes"])
api_router.include_router(reseaux.router, prefix="/reseaux", tags=["reseaux"])
api_router.include_router(ia.router, prefix="/ia", tags=["ia"])
api_router.include_router(consommateurs.router, prefix="/consommateurs", tags=["consommateurs"])
api_router.include_router(mesures.router, prefix="/mesures", tags=["mesures"])

# TODO (team): register routers for new entities here, e.g.
# from app.api.v1.endpoints import notes
# api_router.include_router(notes.router, prefix="/notes", tags=["notes"])