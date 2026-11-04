"""Assistant IA : question en français -> requête SPARQL -> Fuseki (voir app/nlp/).

Outils : spaCy (analyse du français), RapidFuzz (fautes de frappe),
sentence-transformers / Hugging Face (intention), rdflib (validation SPARQL).
Aucune API de LLM n'est utilisée.
"""

import logging
import threading

from app.nlp.pipeline import SolarXAssistant
from app.services.fuseki import SOLARX_NS, FusekiClient
from app.services.typed_sparql import PREFIXES, TypedSparql

log = logging.getLogger(__name__)
_assistant: SolarXAssistant | None = None
_lock = threading.Lock()


def get_assistant() -> SolarXAssistant:
    """Un seul assistant pour toute l'API : les modèles NLP sont chargés une fois."""
    global _assistant
    with _lock:
        if _assistant is None:
            _assistant = SolarXAssistant(TypedSparql(FusekiClient()).run, PREFIXES, SOLARX_NS)
            # préchargement en arrière-plan : la première question sera rapide
            threading.Thread(target=_assistant.warmup, daemon=True).start()
    return _assistant


def relire_schema() -> None:
    """Après une écriture : l'assistant, s'il est déjà lancé, connaît les nouveaux individus."""
    if _assistant is None:
        return
    try:
        _assistant.reload()
    except Exception as exc:  # l'écriture a réussi : l'IA relira le schéma plus tard
        log.warning("Relecture du schéma impossible : %s", exc)
