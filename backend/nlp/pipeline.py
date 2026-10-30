"""Orchestrateur : question en français -> SPARQL -> Fuseki -> réponse."""
import logging
import threading
import time
from typing import Callable

from rdflib.plugins.sparql import prepareQuery

from .analyzer import Analyzer
from .answer import write_answer
from .generator import SparqlGenerator
from .intent import IntentClassifier
from .schema import load_schema

log = logging.getLogger(__name__)
SPACY_MODEL = "fr_core_news_sm"

EXAMPLE_QUESTIONS = [
    "Quelle batterie alimente la maison Djerba ?",
    "Combien de consommateurs y a-t-il par type ?",
    "Quelle est la capacité totale de stockage ?",
    "Quelles installations ont une puissance supérieure à 200 kW ?",
    "Quelles lignes desservent l'école Tunis ?",
    "Quel capteur a détecté la panne 01 ?",
    "Qui occupe la maison Djerba ?",
    "Quelles conditions météo influencent le parc éolien Tunis ?",
    "Quelles mesures concernent la maison Djerba ?",
    "Quelles lignes sont contenues dans le réseau de distribution 01 ?",
    "Quelles maintenances ont eu lieu en octobre 2026 ?",
    "Quelle est la tension de la ligne haute tension 01 ?",
    "Donne-moi des informations sur le parc solaire Djerba",
    "Où se trouve le parc éolien Tunis ?",
]


class SolarXAssistant:
    def __init__(self, run_query: Callable[[str], list[dict]], prefixes: str, namespace: str):
        self.run_query = run_query
        self.prefixes = prefixes
        self.namespace = namespace
        self._lock = threading.RLock()
        self._nlp = None
        self._intents = None
        self.schema = None
        self.analyzer = None
        self.generator = None

    # chargement paresseux : Fuseki peut démarrer après l'API
    def _ensure_ready(self):
        with self._lock:
            if self._nlp is None:
                import spacy
                self._nlp = spacy.load(SPACY_MODEL)
            if self._intents is None:
                self._intents = IntentClassifier()
            if self.schema is None:
                self.reload()

    def warmup(self):
        """Charge les modèles en arrière-plan au démarrage (la 1re question sera rapide)."""
        try:
            self._ensure_ready()
            log.info("Assistant IA prêt")
        except Exception as exc:  # Fuseki pas encore lancé : on réessaiera à la 1re question
            log.warning("Préchargement de l'assistant IA incomplet : %s", exc)

    def reload(self) -> dict:
        """Relit le schéma dans Fuseki (après modification de l'ontologie)."""
        with self._lock:
            if self._nlp is None:
                import spacy
                self._nlp = spacy.load(SPACY_MODEL)
            schema = load_schema(self.run_query, self.namespace)
            self.analyzer = Analyzer(schema, self._nlp)
            self.generator = SparqlGenerator(schema, self.namespace)
            self.schema = schema
        return {
            "classes": len(self.schema.classes),
            "proprietes_objet": len(self.schema.object_props),
            "proprietes_donnees": len(self.schema.data_props),
            "individus": len(self.schema.individuals),
            "entrees_lexique": len(self.analyzer.lexicon),
        }

    def ask(self, question: str, execute: bool = True) -> dict:
        self._ensure_ready()
        t0 = time.perf_counter()
        a = self.analyzer.analyze(question)
        intent, confidence, scores = self._intents.classify(a.delexicalized(), " ".join(a.raw), a.superlative)
        plan = self.generator.build(a, intent)

        result = {
            "question": question,
            "intention": plan.kind,
            "intention_detectee": intent,
            "confiance": confidence,
            "methode_intention": self._intents.method,
            "scores_intention": scores,
            "entites": [m.as_dict() for m in a.mentions],
            "filtres": [{"operateur": n.op, "valeur": n.value, "valeur2": n.value2, "proprietes": n.props} for n in a.numbers]
                       + [{"operateur": d.op, "date": d.prefix} for d in a.dates],
            "analyse": [{"token": t, "lemme": l, "categorie": p} for t, l, p in zip(a.raw, a.lemmas, a.pos)],
            "sparql": None,
            "colonnes": [],
            "resultats": [],
            "reponse": None,
            "remarques": plan.notes,
        }
        if plan.sparql is None:
            intro = "Je ne trouve pas cette information dans l'ontologie. " if a.unknown else \
                "Je n'ai pas compris la question. "
            result["reponse"] = intro + " ".join(plan.notes) + \
                " Essayez par exemple : « " + EXAMPLE_QUESTIONS[0] + " »"
            result["suggestions"] = EXAMPLE_QUESTIONS[:5]
            return result

        full_query = self.prefixes.strip() + "\n\n" + plan.sparql
        result["sparql"] = full_query
        try:
            prepareQuery(full_query)  # validation syntaxique avant l'envoi à Fuseki
        except Exception as exc:
            log.error("Requête générée invalide pour %r : %s\n%s", question, exc, full_query)
            result["reponse"] = "La requête générée est invalide, je ne l'ai pas envoyée à Fuseki."
            result["remarques"].append(str(exc))
            return result
        if execute:
            rows = self.run_query(plan.sparql)
            result["resultats"] = rows
            result["colonnes"] = list(dict.fromkeys(k for r in rows for k in r)) if rows else []
            result["reponse"] = write_answer(plan, rows, self.schema)
        result["duree_ms"] = round((time.perf_counter() - t0) * 1000)
        return result
