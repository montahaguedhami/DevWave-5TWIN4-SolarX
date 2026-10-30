"""ConditionMeteo endpoints (Open-Meteo + measurements stored in Fuseki)."""

from fastapi import APIRouter, Depends, Path, Query

from app.schemas.meteo import (
    Alerte,
    AnalyseAssistant,
    EnregistrementResultat,
    MesureEnregistree,
    MeteoActuelle,
    QuestionAssistant,
    Releve,
    SuppressionResultat,
)
from app.services.assistant_meteo_service import AssistantMeteoService
from app.services.fuseki import LOCAL_NAME_PATTERN, FusekiClient, get_fuseki
from app.services.meteo_service import SOURCE_OPEN_METEO, MeteoService

router = APIRouter()

DATE_PATTERN = r"^\d{4}-\d{2}-\d{2}$"

VilleId = Path(pattern=LOCAL_NAME_PATTERN, description="Nom local de l'individu Ville (ex. Tunis)")


def get_service(fuseki: FusekiClient = Depends(get_fuseki)) -> MeteoService:
    return MeteoService(fuseki)


@router.get("/villes/{ville_id}/actuelle", response_model=MeteoActuelle)
def meteo_actuelle(ville_id: str = VilleId, service: MeteoService = Depends(get_service)):
    return service.meteo_actuelle(ville_id)


@router.post("/villes/{ville_id}/consulter", response_model=MeteoActuelle)
def consulter(ville_id: str = VilleId, service: MeteoService = Depends(get_service)):
    """Current weather from Open-Meteo, automatically saved in the ontology."""
    return service.consulter(ville_id)


@router.post("/villes/{ville_id}/assistant", response_model=AnalyseAssistant)
def assistant(
    body: QuestionAssistant | None = None,
    ville_id: str = VilleId,
    fuseki: FusekiClient = Depends(get_fuseki),
):
    """AI analysis (Gemini with fallback models) of the energy potential of the current weather."""
    return AssistantMeteoService(fuseki).analyser(ville_id, body.question if body else None)


@router.post("/villes/{ville_id}/enregistrer", response_model=EnregistrementResultat)
def enregistrer(ville_id: str = VilleId, service: MeteoService = Depends(get_service)):
    return service.enregistrer(ville_id)


@router.get("/villes/{ville_id}/mesures", response_model=list[MesureEnregistree])
def lister_mesures(ville_id: str = VilleId, service: MeteoService = Depends(get_service)):
    return service.lister_mesures(ville_id)


@router.delete("/villes/{ville_id}/mesures", response_model=SuppressionResultat)
def supprimer_releve(
    ville_id: str = VilleId,
    dateMesure: str | None = Query(None, description="Ne supprimer que le relevé de cette date"),
    service: MeteoService = Depends(get_service),
):
    return service.supprimer_releve(ville_id, dateMesure)


@router.delete("/mesures/{mesure_id}", response_model=SuppressionResultat)
def supprimer_mesure(
    mesure_id: str = Path(pattern=LOCAL_NAME_PATTERN),
    service: MeteoService = Depends(get_service),
):
    return service.supprimer_mesure(mesure_id)


@router.get("/alertes", response_model=list[Alerte])
def alertes(service: MeteoService = Depends(get_service)):
    return service.alertes()


@router.get("/historique", response_model=list[Releve])
def historique(
    debut: str = Query(pattern=DATE_PATTERN, description="Premier jour (YYYY-MM-DD)"),
    fin: str = Query(pattern=DATE_PATTERN, description="Dernier jour inclus (YYYY-MM-DD)"),
    ville: str | None = Query(None, pattern=LOCAL_NAME_PATTERN),
    toutesSources: bool = Query(False, description="Inclure les données de démonstration / capteurs"),
    service: MeteoService = Depends(get_service),
):
    return service.historique(debut, fin, ville, None if toutesSources else SOURCE_OPEN_METEO)


@router.delete("/historique", response_model=SuppressionResultat)
def supprimer_jour(
    jour: str = Query(pattern=DATE_PATTERN),
    ville: str | None = Query(None, pattern=LOCAL_NAME_PATTERN),
    toutesSources: bool = Query(False),
    service: MeteoService = Depends(get_service),
):
    return service.supprimer_jour(jour, ville, None if toutesSources else SOURCE_OPEN_METEO)
