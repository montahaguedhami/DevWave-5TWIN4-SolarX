"""FastAPI application factory."""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.init_db import init_db
from app.services.fuseki import FusekiUnavailable, get_fuseki


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    init_db()
    try:
        get_fuseki()
    except FusekiUnavailable as exc:
        logging.getLogger(__name__).warning("Initialisation sémantique différée : %s", exc.detail)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        debug=settings.DEBUG,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    @app.get("/", tags=["root"])
    def root() -> dict[str, str]:
        return {"name": settings.APP_NAME, "version": settings.APP_VERSION}

    return app


app = create_app()