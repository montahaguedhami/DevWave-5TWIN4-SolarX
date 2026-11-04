"""Module P6 — Maintenances : lister Inspection, MaintenanceCorrective,
MaintenancePredictive, MaintenancePreventive, calendrier/timeline et CRUD.
"""

from typing import Literal

from fastapi import APIRouter, Depends, Path, Query, status
from pydantic import BaseModel, Field

from app.services.fuseki import LOCAL_NAME_PATTERN, FusekiClient, get_fuseki
from app.services.maintenance_service import TYPES_MAINTENANCE, MaintenanceService
from app.services.typed_sparql import PREFIXES, TypedSparql

router = APIRouter()

TypeMaintenance = Literal[
    "Inspection",
    "MaintenanceCorrective",
    "MaintenancePredictive",
    "MaintenancePreventive",
]


class MaintenanceCreate(BaseModel):
    id: str | None = Field(None, pattern=LOCAL_NAME_PATTERN, description="Ex. Inspection_05 (généré si omis)")
    type: TypeMaintenance
    nom: str = Field(..., min_length=1, max_length=120)
    description: str | None = Field(None, max_length=500)
    dateOccurrence: str | None = Field(None, description="Format ISO dateTime ex. 2026-11-10T09:00:00")
    equipement: str | None = Field(None, pattern=LOCAL_NAME_PATTERN, description="Ex. Onduleur_01")


class MaintenanceUpdate(BaseModel):
    nom: str | None = Field(None, min_length=1, max_length=120)
    description: str | None = Field(None, max_length=500)
    dateOccurrence: str | None = None
    equipement: str | None = Field(None, pattern=LOCAL_NAME_PATTERN)


def get_service(fuseki: FusekiClient = Depends(get_fuseki)) -> MaintenanceService:
    return MaintenanceService(TypedSparql(fuseki), fuseki)


@router.get("")
def list_maintenances(
    type: TypeMaintenance | None = None,
    equipement_id: str | None = Query(None, pattern=LOCAL_NAME_PATTERN, description="Filtrer par équipement"),
    q: str | None = Query(None, max_length=80, description="Recherche textuelle"),
    afficher_sparql: bool = Query(False, description="Renvoie aussi la requête SPARQL exécutée"),
    service: MaintenanceService = Depends(get_service),
):
    """Lister les maintenances (Inspection, Corrective, Prédictive, Préventive)."""
    rows = service.list_maintenances(type_=type, equipement_id=equipement_id, q=q)
    if afficher_sparql:
        return {"sparql": PREFIXES.strip() + "\n" + service.derniere_requete.strip(), "resultats": rows}
    return rows


@router.get("/stats")
def stats(service: MaintenanceService = Depends(get_service)):
    """Statistiques d'interventions de maintenance."""
    return service.stats()


@router.get("/{maintenance_id}")
def get_maintenance(
    maintenance_id: str = Path(pattern=LOCAL_NAME_PATTERN, description="Ex. Inspection_01"),
    service: MaintenanceService = Depends(get_service),
):
    """Détail d'une intervention de maintenance."""
    return service.get_maintenance(maintenance_id)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_maintenance(body: MaintenanceCreate, service: MaintenanceService = Depends(get_service)):
    """Créer une intervention de maintenance."""
    return service.create_maintenance(body.model_dump(exclude_none=True))


@router.put("/{maintenance_id}")
def update_maintenance(
    body: MaintenanceUpdate,
    maintenance_id: str = Path(pattern=LOCAL_NAME_PATTERN),
    service: MaintenanceService = Depends(get_service),
):
    """Mettre à jour une intervention de maintenance."""
    return service.update_maintenance(maintenance_id, body.model_dump(exclude_none=True))


@router.delete("/{maintenance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_maintenance(
    maintenance_id: str = Path(pattern=LOCAL_NAME_PATTERN),
    service: MaintenanceService = Depends(get_service),
):
    """Supprimer une intervention de maintenance."""
    service.delete_maintenance(maintenance_id)
    return None

