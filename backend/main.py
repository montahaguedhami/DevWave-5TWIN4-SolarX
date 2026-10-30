import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import equipement, ia, stockage
from sparql_client import FUSEKI_URL, SparqlError, run_query

app = FastAPI(title="SolarX API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SparqlError)
async def sparql_error_handler(_: Request, exc: SparqlError):
    return JSONResponse(status_code=503, content={"detail": str(exc)})


@app.get("/api/health")
def health():
    run_query("SELECT ?s WHERE { ?s ?p ?o } LIMIT 1")
    return {"status": "ok", "fuseki": FUSEKI_URL}


# P2 — Stockage + Équipement
app.include_router(stockage.router)
app.include_router(equipement.router)

# IA — question en français -> SPARQL
app.include_router(ia.router)
