"""Classification de l'intention : sentence-transformers (Hugging Face) + règles.

Le modèle multilingue transforme la question (entités remplacées par des mots
génériques) en vecteur, puis on la compare à des questions d'exemple pour
chaque intention (similarité cosinus, plus proche voisin). Des mots-clés
très fiables ("combien", "total"...) renforcent le score de l'intention.
"""
import logging
import os

log = logging.getLogger(__name__)

MODEL_NAME = os.getenv("IA_EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
RULE_BONUS = 0.35

EXAMPLES = {
    "lister": [
        "quels sont les éléments", "liste des éléments", "affiche les éléments",
        "donne moi les éléments situés à X", "quels éléments sont en état",
        "montre tous les éléments", "je veux voir les éléments de X",
        "quels éléments ont une valeur supérieure à 100", "éléments qui alimentent X",
        "quelles sont les éléments liés à X", "où se trouvent les éléments",
    ],
    "compter": [
        "combien de éléments", "combien y a-t-il de éléments", "nombre de éléments",
        "quel est le nombre de éléments à X", "compte les éléments", "combien de éléments sont en état",
        "nombre de éléments par éléments", "combien de éléments possède X",
    ],
    "somme": [
        "quelle est la valeur totale des éléments", "somme des valeur", "valeur cumulée des éléments",
        "total de la valeur", "additionne la valeur des éléments", "valeur globale des éléments à X",
        "valeur totale par éléments",
    ],
    "moyenne": [
        "quelle est la valeur moyenne des éléments", "moyenne des valeur", "en moyenne quelle valeur",
        "valeur moyenne par éléments", "calcule la moyenne de la valeur",
    ],
    "maximum": [
        "quel élément a la plus grande valeur", "le éléments le plus puissant", "valeur maximale des éléments",
        "quels sont les 3 éléments les plus grands", "le plus de éléments", "quelle ville a le plus de éléments",
        "éléments ayant la valeur la plus élevée",
    ],
    "minimum": [
        "quel élément a la plus petite valeur", "le éléments le moins puissant", "valeur minimale des éléments",
        "éléments ayant la valeur la plus faible", "le moins de éléments",
    ],
    "decrire": [
        "donne moi des informations sur X", "décris X", "qu'est-ce que X", "détails de X",
        "parle moi de X", "fiche de X", "que sais-tu sur X", "c'est quoi X", "quelle est la valeur de X",
        "où se trouve X",
    ],
}

# Mots-clés (texte sans accents, minuscules) très fiables pour chaque intention
RULES = [
    ("compter", [" combien ", " nombre de ", " nombre d ", " compte ", " compter ", " denombre"]),
    ("moyenne", [" moyenne ", " moyen ", " en moyenne "]),
    ("somme", [" total ", " totale ", " somme ", " cumul", " additionn", " globale ", " au total "]),
    ("decrire", [" informations sur ", " info sur ", " infos sur ", " details ", " detail de ", " decri",
                 " parle moi ", " c est quoi ", " qu est ce que ", " fiche "]),
]
LIST_KEYS = [" quel ", " quels ", " quelle ", " quelles ", " liste ", " lister ", " affiche ", " montre ", " donne "]


class IntentClassifier:
    def __init__(self):
        self.model = None
        self.method = "règles"
        self._examples: list[tuple[str, object]] = []
        try:
            from sentence_transformers import SentenceTransformer

            self.model = SentenceTransformer(MODEL_NAME)
            for intent, phrases in EXAMPLES.items():
                vectors = self.model.encode(phrases, normalize_embeddings=True)
                self._examples.extend((intent, v) for v in vectors)
            self.method = "sentence-transformers + règles"
        except Exception as exc:  # modèle absent / hors ligne : on garde les règles seules
            log.warning("Modèle d'embeddings indisponible (%s) : classification par règles uniquement", exc)

    def rule_intent(self, raw_text: str, superlative: str | None) -> str | None:
        text = f" {raw_text} "
        for intent, keys in RULES:
            if any(k in text for k in keys):
                return intent
        if superlative:
            return "maximum" if superlative == "max" else "minimum"
        if any(k in text for k in LIST_KEYS):
            return "lister"
        return None

    def classify(self, delexicalized: str, raw_text: str, superlative: str | None) -> tuple[str, float, dict]:
        rule = self.rule_intent(raw_text, superlative)
        if self.model is None:
            return rule or "lister", 0.9 if rule else 0.5, {}

        q = self.model.encode([delexicalized], normalize_embeddings=True)[0]
        scores: dict[str, float] = {}
        for intent, v in self._examples:
            scores[intent] = max(scores.get(intent, -1.0), float(q @ v))
        if rule:
            scores[rule] += RULE_BONUS
        best = max(scores, key=scores.get)
        ranked = sorted(scores.values(), reverse=True)
        # confiance : similarité du meilleur exemple + écart avec la 2e intention
        confidence = max(0.0, min(1.0, ranked[0] - (RULE_BONUS if rule == best else 0) + (ranked[0] - ranked[1])))
        return best, round(confidence, 2), {k: round(v, 3) for k, v in sorted(scores.items(), key=lambda kv: -kv[1])}
