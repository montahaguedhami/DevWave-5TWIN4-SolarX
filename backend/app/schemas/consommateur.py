"""Schemas for the Consommateur module."""

from pydantic import BaseModel, Field, field_validator

from app.services.fuseki import LOCAL_NAME_PATTERN

TYPES_CONSOMMATEUR = [
    "Ecole", "Entreprise", "Hopital", "Maison", "Particulier", "Institution", "Usine",
]


def _validate_type(value: str) -> str:
    if value not in TYPES_CONSOMMATEUR:
        raise ValueError(f"Type de consommateur inconnu : {value!r}")
    return value


class ConsommateurBase(BaseModel):
    nom: str = Field(min_length=1, max_length=120)
    type: str
    surfaceM2: float | None = Field(None, ge=0, allow_inf_nan=False)
    ville: str = Field(pattern=LOCAL_NAME_PATTERN, description="Identifiant de la ville (ex. Tunis)")

    @field_validator("nom")
    @classmethod
    def strip_nom(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Le nom est obligatoire")
        return value

    @field_validator("type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        return _validate_type(value)


class ConsommateurCreate(ConsommateurBase):
    pass


class ConsommateurUpdate(ConsommateurBase):
    pass


class Consommateur(BaseModel):
    id: str
    type: str
    nom: str
    surfaceM2: float | None = None
    ville: str | None = None
    villeNom: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    nbMesures: int = 0