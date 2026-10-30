"""Schemas for the Localisation module (Ville / Region)."""

from pydantic import BaseModel, Field, field_validator

from app.services.fuseki import LOCAL_NAME_PATTERN


class Region(BaseModel):
    id: str
    nom: str
    nbVilles: int = 0


class VilleBase(BaseModel):
    nom: str = Field(min_length=1, max_length=80)
    region: str = Field(pattern=LOCAL_NAME_PATTERN, description="Identifiant de la région (ex. Sud_Tunisie)")
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)

    @field_validator("nom")
    @classmethod
    def strip_nom(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Le nom est obligatoire")
        return value


class VilleCreate(VilleBase):
    pass


class VilleUpdate(VilleBase):
    pass


class Ville(BaseModel):
    id: str
    nom: str
    latitude: float | None = None
    longitude: float | None = None
    region: str | None = None
    regionNom: str | None = None
    nbMesures: int = 0
    nbLiens: int = Field(0, description="Éléments des autres modules situés dans cette ville")


class GeocodageInverse(BaseModel):
    latitude: float
    longitude: float
    nom: str | None = None
    adresse: str | None = None
    regionSuggeree: str | None = Field(None, description="Région de la ville de l'ontologie la plus proche")
    villeProche: str | None = None
    distanceKm: float | None = None
    villeExistante: str | None = Field(None, description="Id de la ville si ce nom existe déjà")
