"""IA : question en langage naturel -> requête SPARQL -> résultats Fuseki (sans LLM)."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.nlp.pipeline import EXAMPLE_QUESTIONS
from app.services.ia_service import get_assistant

router = APIRouter()


class Question(BaseModel):
    question: str = Field(..., min_length=2, max_length=300, examples=["Quelles lignes desservent l'école Tunis ?"])
    executer: bool = Field(True, description="False : renvoie seulement la requête SPARQL générée")


@router.post("/question")
def poser_question(body: Question):
    """Question en français -> requête SPARQL -> résultats Fuseki + réponse en français."""
    return get_assistant().ask(body.question, execute=body.executer)


@router.get("/exemples")
def exemples():
    return EXAMPLE_QUESTIONS


@router.post("/recharger")
def recharger():
    """À appeler après avoir rechargé l'ontologie dans Fuseki : reconstruit le lexique."""
    return get_assistant().reload()
