"""Module P2 — Équipements : liste (filtres type / état), statistiques, détail, CRUD (SPARQL UPDATE)."""

from typing import Literal

from fastapi import APIRouter, Depends, Path, Query, status
from pydantic import BaseModel, Field

from app.services.equipement_service import EquipementService
from app.services.fuseki import LOCAL_NAME_PATTERN, FusekiClient, get_fuseki
from app.services.typed_sparql import PREFIXES, TypedSparql

router = APIRouter()

TypeEquipement = Literal["Capteur", "CompteurIntelligent", "Onduleur"]
Etat = Literal["Fonctionnel", "Maintenance", "En panne"]


class EquipementCreate(BaseModel):
    id: str | None = Field(None, pattern=LOCAL_NAME_PATTERN, description="Ex. Capteur_06 (généré si vide)")
    type: TypeEquipement
    nom: str = Field(..., min_length=1, max_length=120)
    marque: str | None = Field(None, max_length=80)
    puissanceMaxKW: float | None = Field(None, gt=0)
    etat: Etat | None = None
    proprietaire: str | None = Field(None, pattern=LOCAL_NAME_PATTERN, description="Ex. Hopital_Tunis")


class EquipementUpdate(BaseModel):
    nom: str | None = Field(None, min_length=1, max_length=120)
    marque: str | None = Field(None, max_length=80)
    puissanceMaxKW: float | None = Field(None, gt=0)
    etat: Etat | None = None
    proprietaire: str | None = Field(None, pattern=LOCAL_NAME_PATTERN)


def get_service(fuseki: FusekiClient = Depends(get_fuseki)) -> EquipementService:
    return EquipementService(TypedSparql(fuseki), fuseki)


@router.get("")
def list_equipements(
    type: TypeEquipement | None = None,
    etat: Etat | None = None,
    q: str | None = Query(None, max_length=80, description="Recherche (nom, marque, propriétaire, ville) : FILTER CONTAINS"),
    marque: str | None = Query(None, max_length=80),
    proprietaire: str | None = Query(None, pattern=LOCAL_NAME_PATTERN, description="Ex. Hopital_Tunis"),
    localisation: str | None = Query(None, pattern=LOCAL_NAME_PATTERN, description="Ex. Tunis"),
    afficher_sparql: bool = Query(False, description="Renvoie aussi la requête SPARQL exécutée"),
    service: EquipementService = Depends(get_service),
):
    """Équipements avec propriétaire, localisation, mesures, maintenances et état (calculé en SPARQL)."""
    rows = service.list_equipements(type, etat, q=q, proprietaire=proprietaire, localisation=localisation, marque=marque)
    if afficher_sparql:
        return {"sparql": PREFIXES.strip() + "\n" + service.derniere_requete.strip(), "resultats": rows}
    return rows


@router.get("/stats")
def stats(service: EquipementService = Depends(get_service)):
    """Nombre d'équipements par état et par type."""
    return service.stats()


@router.get("/proprietaires")
def proprietaires(service: EquipementService = Depends(get_service)):
    """Consommateurs et installations existants (liste du formulaire)."""
    return service.proprietaires()


@router.get("/{equipement_id}")
def get_equipement(
    equipement_id: str = Path(pattern=LOCAL_NAME_PATTERN, description="Ex. Onduleur_01"),
    service: EquipementService = Depends(get_service),
):
    return service.get_equipement(equipement_id)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_equipement(body: EquipementCreate, service: EquipementService = Depends(get_service)):
    """CREATE — INSERT DATA."""
    return service.create(body.model_dump())


@router.put("/{equipement_id}")
def update_equipement(
    body: EquipementUpdate,
    equipement_id: str = Path(pattern=LOCAL_NAME_PATTERN),
    service: EquipementService = Depends(get_service),
):
    """UPDATE — DELETE WHERE + INSERT DATA."""
    return service.update(equipement_id, body.model_dump(exclude_unset=True))


@router.delete("/{equipement_id}")
def delete_equipement(
    equipement_id: str = Path(pattern=LOCAL_NAME_PATTERN), service: EquipementService = Depends(get_service)
):
    """DELETE — supprime l'équipement et toutes ses relations."""
    return service.delete(equipement_id)
