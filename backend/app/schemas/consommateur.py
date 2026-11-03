"""Schemas for consumers (households and other consuming sites)."""

from enum import Enum

from pydantic import BaseModel, Field, field_validator


class ConsumerType(str, Enum):
    MAISON = "Maison"
    PARTICULIER = "Particulier"
    ENTREPRISE = "Entreprise"
    ECOLE = "Ecole"
    HOPITAL = "Hopital"
    INSTITUTION = "Institution"
    USINE = "Usine"


class ConsumerWrite(BaseModel):
    nom: str = Field(min_length=1, max_length=120)
    type: ConsumerType = ConsumerType.MAISON
    surface_m2: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    localisation_id: str | None = Field(default=None, max_length=100)
    equipement_ids: list[str] = Field(default_factory=list, max_length=40)

    @field_validator("nom")
    @classmethod
    def non_blank_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Le nom est obligatoire")
        return value


class ConsumerEquipment(BaseModel):
    id: str
    nom: str
    type: str


class Consumer(BaseModel):
    id: str
    nom: str
    type: ConsumerType
    surface_m2: float | None = None
    localisation: dict[str, str] | None = None
    equipements: list[ConsumerEquipment] = Field(default_factory=list)
