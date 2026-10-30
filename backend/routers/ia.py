"""IA — traduction d'une question en français vers SPARQL (voir le module nlp/).

Outils : spaCy (analyse du français), RapidFuzz (fautes de frappe),
sentence-transformers / Hugging Face (intention), rdflib (validation SPARQL).
Aucune API de LLM n'est utilisée.
"""
import threading

from fastapi import APIRouter
from pydantic import BaseModel, Field

from nlp.pipeline import EXAMPLE_QUESTIONS, SolarXAssistant
from sparql_client import PREFIXES, SOLARX_NS, run_query

router = APIRouter(prefix="/api/ia", tags=["IA"])

assistant = SolarXAssistant(run_query, PREFIXES, SOLARX_NS)
threading.Thread(target=assistant.warmup, daemon=True).start()


class Question(BaseModel):
    question: str = Field(..., min_length=2, max_length=300, examples=["Quelles batteries sont situées à Tunis ?"])
    executer: bool = Field(True, description="False : renvoie seulement la requête SPARQL générée")


@router.post("/question")
def poser_question(body: Question):
    """Question en langage naturel -> requête SPARQL -> résultats Fuseki + réponse en français."""
    return assistant.ask(body.question, execute=body.executer)


@router.get("/exemples")
def exemples():
    return EXAMPLE_QUESTIONS


@router.post("/recharger")
def recharger():
    """À appeler après avoir rechargé l'ontologie dans Fuseki : reconstruit le lexique."""
    return assistant.reload()
