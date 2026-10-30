"""Schemas for the ConditionMeteo module."""

from pydantic import BaseModel, Field


class MesureValeur(BaseModel):
    classe: str
    label: str
    valeur: float
    unite: str


class Alerte(BaseModel):
    type: str
    niveau: str  # critical | warning | info
    gravite: str
    titre: str
    message: str
    valeur: float
    unite: str
    seuil: float
    ville: str
    villeNom: str
    dateMesure: str | None = None


class Prevision(BaseModel):
    time: str
    temperature: float | None = None
    rayonnement: float | None = None
    vent: float | None = None
    precipitation: float | None = None


class EnregistrementResultat(BaseModel):
    ville: str
    dateMesure: str
    enregistrees: list[str]
    dejaPresentes: list[str]
    verifiees: int


class MeteoActuelle(BaseModel):
    ville: str
    villeNom: str
    latitude: float
    longitude: float
    source: str
    timezone: str | None = None
    dateMesure: str
    dateRecuperation: str
    estJour: bool | None = None
    mesures: list[MesureValeur]
    alertes: list[Alerte]
    previsions: list[Prevision]
    enregistrement: EnregistrementResultat | None = None


class MesureEnregistree(BaseModel):
    id: str
    classe: str
    valeur: float
    unite: str | None = None
    dateMesure: str | None = None
    source: str | None = None
    dateRecuperation: str | None = None
    supprimable: bool = False


class Releve(BaseModel):
    """All measurements of one city at one dateMesure (one weather consultation)."""

    ville: str
    villeNom: str
    regionNom: str | None = None
    dateMesure: str
    dateRecuperation: str | None = None
    source: str | None = None
    mesures: list[MesureEnregistree]
    alertes: list[Alerte]
    supprimable: bool


class SuppressionResultat(BaseModel):
    supprimees: list[str]
    protegees: list[str] = []


class QuestionAssistant(BaseModel):
    question: str | None = Field(None, max_length=500)


class InstallationLocale(BaseModel):
    nom: str
    type: str
    puissanceKW: float | None = None
    productionEstimeeKWh: float | None = None


class IndicateursEnergie(BaseModel):
    irradiation24hKWhM2: float
    picRayonnement: float
    heurePic: str | None = None
    heuresEnsoleillees: int
    ventMoyen: float
    ventMax: float
    heuresVentProductif: int
    installations: list[InstallationLocale]


class AnalyseAssistant(BaseModel):
    potentiel: str  # Élevé | Moyen | Faible
    score: int = Field(ge=0, le=100)
    resume: str
    impactsSolaire: list[str]
    impactsEolien: list[str]
    conseils: list[str]
    meilleurCreneau: str | None = None
    reponse: str | None = None
    modele: str
    secours: bool
    indicateurs: IndicateursEnergie
