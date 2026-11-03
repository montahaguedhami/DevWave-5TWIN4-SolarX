"""Schemas for the Mesure module."""

from pydantic import BaseModel, Field, field_validator

from app.services.fuseki import LOCAL_NAME_PATTERN

TYPES_MESURE = ["MesureConsommation", "MesureProduction", "MesureStockage"]


class MesureBase(BaseModel):
    type: str
    valeur: float = Field(ge=0, allow_inf_nan=False)
    unite: str = Field(min_length=1, max_length=20)
    dateMesure: str
    concerne: str = Field(pattern=LOCAL_NAME_PATTERN, description="Identifiant de l'entité concernée")
    mesureePar: str | None = Field(None, pattern=LOCAL_NAME_PATTERN)
    sourceDonnees: str | None = Field(None, max_length=80)

    @field_validator("type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        if value not in TYPES_MESURE:
            raise ValueError(f"Type de mesure inconnu : {value!r}")
        return value


class MesureCreate(MesureBase):
    pass


class Mesure(BaseModel):
    id: str
    type: str
    valeur: float
    unite: str
    dateMesure: str
    concerne: str
    concerneType: str | None = None
    mesureePar: str | None = None
    sourceDonnees: str | None = None