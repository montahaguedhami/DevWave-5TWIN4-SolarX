"""Read-only production schemas."""

from enum import Enum
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class InstallationType(str, Enum):
    CENTRALE_SOLAIRE = "CentraleSolaire"
    PARC_EOLIEN = "ParcEolien"
    CENTRALE_HYDRAULIQUE = "CentraleHydraulique"


class SourceType(str, Enum):
    SOLAIRE = "Solaire"
    EOLIENNE = "Eolienne"
    HYDRAULIQUE = "Hydraulique"


class ProductionSource(BaseModel):
    id: str | None = None
    nom: str | None = None
    type: SourceType


class ProductionInstallation(BaseModel):
    id: str
    nom: str
    type: InstallationType
    puissance_kw: float | None = None
    ville: dict[str, str] | None = None
    source: ProductionSource
    source_deduite: bool


class ProductionMeasurement(BaseModel):
    id: str
    installation_id: str | None = None
    installation_nom: str | None = None
    date_mesure: datetime | None = None
    valeur: float | None = None
    unite: str | None = None


class ProductionMeasurementWrite(BaseModel):
    installation_id: str = Field(min_length=1, max_length=100)
    date_mesure: datetime
    valeur: float = Field(ge=0, allow_inf_nan=False)
    unite: str = Field(min_length=1, max_length=24)

    @field_validator("unite")
    @classmethod
    def non_blank_unit(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("L’unité est obligatoire")
        return value


class InstallationWrite(BaseModel):
    nom: str = Field(min_length=1, max_length=120)
    type: InstallationType
    puissance_kw: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    ville_id: str | None = Field(default=None, max_length=100)
    source_id: str | None = Field(default=None, max_length=100)

    @field_validator("nom")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Le nom ne peut pas être vide")
        return value


class SourceWrite(BaseModel):
    nom: str = Field(min_length=1, max_length=120)
    type: SourceType

    @field_validator("nom")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Le nom ne peut pas être vide")
        return value


class SourceEnergie(ProductionSource):
    id: str
    nom: str
    nombre_installations: int = 0


class SourceStat(BaseModel):
    source: SourceType
    nombre_installations: int
    puissance_totale_kw: float
    production_mesuree_kwh: float
    part_pct: float


class TypeStat(BaseModel):
    type: InstallationType
    nombre_installations: int
    puissance_totale_kw: float
    production_mesuree_kwh: float
    part_pct: float


class ProductionTotals(BaseModel):
    nombre_installations: int
    puissance_totale_kw: float
    production_mesuree_kwh: float
    part_pct: float


class ProductionStats(BaseModel):
    sources: list[SourceStat] = Field(default_factory=list)
    total: ProductionTotals


class ProductionStatsByType(BaseModel):
    types: list[TypeStat] = Field(default_factory=list)
    total: ProductionTotals
