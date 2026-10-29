"""Aggregate router for API v1."""

from fastapi import APIRouter

from app.api.v1.endpoints import health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])

# TODO (team): register routers for new entities here, e.g.
# from app.api.v1.endpoints import notes
# api_router.include_router(notes.router, prefix="/notes", tags=["notes"])