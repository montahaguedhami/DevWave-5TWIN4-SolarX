"""Module P6 — Incidents : lister Alerte, Panne, Surcharge,
requête 'pannes par équipement' et CRUD.
"""

from typing import Literal

from fastapi import APIRouter, Depends, Path, Query, status
from pydantic import BaseModel, Field

from app.services.fuseki import LOCAL_NAME_PATTERN, FusekiClient, get_fuseki
from app.services.incident_service import GRAVITES, TYPES_INCIDENT, IncidentService
from app.services.typed_sparql import PREFIXES, TypedSparql

router = APIRouter()

TypeIncident = Literal["Alerte", "Panne", "Surcharge"]
NiveauGravite = Literal["Critique", "Élevée", "Moyenne", "Faible"]


class IncidentCreate(BaseModel):
    id: str | None = Field(None, pattern=LOCAL_NAME_PATTERN, description="Ex. Panne_06 (généré si omis)")
    type: TypeIncident
    nom: str = Field(..., min_length=1, max_length=120)
    description: str | None = Field(None, max_length=500)
    gravite: NiveauGravite = "Moyenne"
    dateOccurrence: str | None = Field(None, description="Format ISO dateTime ex. 2026-10-29T10:15:00")
    affecte: str | None = Field(None, pattern=LOCAL_NAME_PATTERN, description="Ex. Onduleur_01, LigneHauteTension_01")
    detectePar: str | None = Field(None, pattern=LOCAL_NAME_PATTERN, description="Ex. Capteur_01")


class IncidentUpdate(BaseModel):
    nom: str | None = Field(None, min_length=1, max_length=120)
    description: str | None = Field(None, max_length=500)
    gravite: NiveauGravite | None = None
    dateOccurrence: str | None = None
    affecte: str | None = Field(None, pattern=LOCAL_NAME_PATTERN)
    detectePar: str | None = Field(None, pattern=LOCAL_NAME_PATTERN)


def get_service(fuseki: FusekiClient = Depends(get_fuseki)) -> IncidentService:
    return IncidentService(TypedSparql(fuseki), fuseki)


@router.get("")
def list_incidents(
    type: TypeIncident | None = None,
    gravite: NiveauGravite | None = None,
    equipement_id: str | None = Query(None, pattern=LOCAL_NAME_PATTERN, description="Filtrer par élément affecté"),
    q: str | None = Query(None, max_length=80, description="Recherche textuelle"),
    afficher_sparql: bool = Query(False, description="Renvoie aussi la requête SPARQL exécutée"),
    service: IncidentService = Depends(get_service),
):
    """Lister les incidents (Alerte, Panne, Surcharge) avec sévérité et composants affectés."""
    rows = service.list_incidents(type_=type, gravite=gravite, equipement_id=equipement_id, q=q)
    if afficher_sparql:
        return {"sparql": PREFIXES.strip() + "\n" + service.derniere_requete.strip(), "resultats": rows}
    return rows


@router.get("/pannes-par-equipement")
def pannes_par_equipement(
    afficher_sparql: bool = Query(False, description="Renvoie aussi la requête SPARQL exécutée"),
    service: IncidentService = Depends(get_service),
):
    """Requête demandée : pannes groupées par équipement avec nombre d'occurrences et détails."""
    rows = service.pannes_par_equipement()
    if afficher_sparql:
        return {"sparql": PREFIXES.strip() + "\n" + service.derniere_requete.strip(), "resultats": rows}
    return rows


@router.get("/stats")
def stats(service: IncidentService = Depends(get_service)):
    """Statistiques d'incidents par type et par gravité."""
    return service.stats()


@router.get("/{incident_id}")
def get_incident(
    incident_id: str = Path(pattern=LOCAL_NAME_PATTERN, description="Ex. Panne_01"),
    service: IncidentService = Depends(get_service),
):
    """Détail d'un incident."""
    return service.get_incident(incident_id)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_incident(body: IncidentCreate, service: IncidentService = Depends(get_service)):
    """Créer un incident."""
    return service.create_incident(body.model_dump(exclude_none=True))


@router.put("/{incident_id}")
def update_incident(
    body: IncidentUpdate,
    incident_id: str = Path(pattern=LOCAL_NAME_PATTERN),
    service: IncidentService = Depends(get_service),
):
    """Mettre à jour un incident."""
    return service.update_incident(incident_id, body.model_dump(exclude_none=True))


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(
    incident_id: str = Path(pattern=LOCAL_NAME_PATTERN),
    service: IncidentService = Depends(get_service),
):
    """Supprimer un incident."""
    service.delete_incident(incident_id)
    return None

