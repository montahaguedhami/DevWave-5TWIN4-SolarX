"""Analyse linguistique d'une question (spaCy + lexique de l'ontologie + RapidFuzz)."""
import re
import unicodedata
from collections import defaultdict
from dataclasses import dataclass, field

from rapidfuzz import fuzz, process

from .schema import OntologySchema
from .text import humanize, norm_tokens, singular, split_camel
from .vocabulary import (
    CLASS_LABELS, CLASS_SYNONYMS, DATA_PROPERTY_SYNONYMS, INDEXED_VALUE_PROPERTIES,
    OBJECT_PROPERTY_CUES, STATES, UNIT_FACTORS, UNIT_PROPERTIES,
)

FUZZY_THRESHOLD = 86
MAX_NGRAM = 6
_TOKEN = re.compile(r"[a-z0-9]+(?:[.,][0-9]+)?|[<>]=?|=")

MONTHS = {
    "janvier": 1, "fevrier": 2, "mars": 3, "avril": 4, "mai": 5, "juin": 6, "juillet": 7,
    "aout": 8, "septembre": 9, "octobre": 10, "novembre": 11, "decembre": 12,
}
# Expressions placées juste avant un nombre (texte sans accents)
COMPARATORS = [
    (">=", ["au moins", "superieur ou egal a", "superieure ou egale a", ">="]),
    ("<=", ["au plus", "au maximum", "inferieur ou egal a", "inferieure ou egale a", "<="]),
    (">", ["plus de", "plus que", "superieur a", "superieure a", "superieurs a", "superieures a",
           "au dessus de", "depasse", "depassent", "depassant", "excede", "excedant",
           "plus grand que", "plus grande que", ">"]),
    ("<", ["moins de", "moins que", "inferieur a", "inferieure a", "inferieurs a", "inferieures a",
           "en dessous de", "au dessous de", "sous", "plus petit que", "plus petite que", "<"]),
    ("=", ["egal a", "egale a", "exactement", "="]),
]
DATE_CUES = {"apres": ">", "depuis": ">=", "partir": ">=", "avant": "<", "jusqu": "<=",
             "en": "in", "durant": "in", "pendant": "in", "dans": "in", "le": "in", "de": "in", "du": "in"}
MAX_CUES = ["le plus", "la plus", "les plus", "plus grand", "plus grande", "plus eleve", "plus elevee",
            "plus puissant", "plus puissante", "plus important", "maximum", "maximale", "maximal", "max", "meilleur"]
AGGREGATION_WORDS = {"moyenne", "moyen", "total", "totale", "maximum", "minimum", "max", "min", "elevee", "eleve", "faible"}
MIN_CUES = ["le moins", "la moins", "les moins", "plus petit", "plus petite", "plus faible", "plus bas",
            "plus basse", "minimum", "minimale", "minimal", "min"]


@dataclass
class Mention:
    kind: str          # class | individual | dprop | state | value
    value: object      # nom de la classe / de l'individu, liste de propriétés, ...
    start: int         # indices dans la liste de tokens
    end: int
    text: str
    score: float = 1.0

    def as_dict(self) -> dict:
        value = self.value if isinstance(self.value, str) else list(self.value) if isinstance(self.value, (list, tuple)) else self.value
        return {"texte": self.text, "type": self.kind, "valeur": value, "score": round(self.score, 2)}


@dataclass
class NumberFilter:
    op: str
    value: float
    value2: float | None = None     # pour "entre X et Y"
    props: list[str] = field(default_factory=list)   # candidates (unité ou propriété citée)
    position: int = 0


@dataclass
class DateFilter:
    op: str                          # in | > | >= | < | <=
    prefix: str                      # "2026", "2026-10" ou "2026-10-27"


@dataclass
class Analysis:
    question: str
    tokens: list[str]                # normalisés (minuscule, sans accent, singulier)
    raw: list[str]                   # minuscule, sans accent
    lemmas: list[str]
    pos: list[str]
    mentions: list[Mention]
    numbers: list[NumberFilter]
    dates: list[DateFilter]
    cues: set[str]                   # propriétés objet évoquées par un verbe
    superlative: str | None          # max | min
    most_of: str | None              # "la ville qui a le plus de batteries" -> Batterie
    limit: int | None
    group_by: Mention | None
    group_by_type: bool
    asks_where: bool
    asks_who: bool = False           # "Qui occupe la maison Djerba ?"
    unknown: list[str] = field(default_factory=list)   # noms propres / propriétés absents de l'ontologie

    def of_kind(self, kind: str) -> list[Mention]:
        return [m for m in self.mentions if m.kind == kind]

    def delexicalized(self) -> str:
        """Question où les entités sont remplacées par des mots génériques (pour l'intention)."""
        out, i = [], 0
        spans = {m.start: m for m in self.mentions}
        while i < len(self.raw):
            m = spans.get(i)
            if m:
                out.append({"class": "éléments", "individual": "X", "dprop": "valeur",
                            "state": "état", "value": "X"}[m.kind])
                i = m.end
            else:
                out.append(self.raw[i])
                i += 1
        return " ".join(out)


def _ascii_same_length(text: str) -> str:
    """Retire les accents caractère par caractère (garde les positions pour l'alignement spaCy)."""
    return "".join(unicodedata.normalize("NFD", c)[0] for c in unicodedata.normalize("NFC", text)).lower()


def _to_float(token: str) -> float | None:
    try:
        return float(token.replace(",", "."))
    except ValueError:
        return None


class Analyzer:
    def __init__(self, schema: OntologySchema, nlp):
        self.schema = schema
        self.nlp = nlp
        self.lexicon: dict[tuple[str, ...], list[tuple[int, str, object]]] = defaultdict(list)
        self._build_lexicon()
        self._fuzzy_keys = {n: [" ".join(k) for k in self.lexicon if len(k) == n] for n in (1, 2, 3)}
        # mots de propriété connus du vocabulaire mais absents de cette version de l'ontologie ("marque")
        self.missing_props = {tuple(norm_tokens(phrase)): phrase for phrase, props in DATA_PROPERTY_SYNONYMS.items()
                              if not any(p in schema.data_props for p in props)}

    # --- lexique ----------------------------------------------------------
    def _add(self, phrase: str, kind: str, value, priority: int):
        key = tuple(norm_tokens(phrase))
        if key and (priority, kind, value) not in self.lexicon[key]:
            self.lexicon[key].append((priority, kind, value))

    def _build_lexicon(self):
        s = self.schema
        for c in s.classes:
            self._add(humanize(c), "class", c, 1)
            if c in CLASS_LABELS:
                self._add(CLASS_LABELS[c][0], "class", c, 2)
        for c, words in CLASS_SYNONYMS.items():
            if c in s.classes:
                for w in words:
                    self._add(w, "class", c, 2)
        for ind in s.individuals:
            self._add(split_camel(ind), "individual", ind, 3)
            if ind in s.names:
                self._add(s.names[ind], "individual", ind, 3)
        for p in s.data_props:
            self._add(split_camel(p), "dprop", (p,), 1)
        for phrase, props in DATA_PROPERTY_SYNONYMS.items():
            known = tuple(p for p in props if p in s.data_props)
            if known:
                self._add(phrase, "dprop", known, 2)
        for phrase, state in STATES.items():
            self._add(phrase, "state", state, 4)
        for p in INDEXED_VALUE_PROPERTIES & set(s.string_values):
            for v in s.string_values[p]:
                self._add(v, "value", (p, v, False), 3)
                first = norm_tokens(v)[:1]
                if first and len(first[0]) >= 4 and tuple(first) not in self.lexicon:
                    self._add(v.split()[0].split("-")[0], "value", (p, v.split()[0].split("-")[0], True), 1)

    def _best(self, key: tuple[str, ...]):
        return max(self.lexicon[key], key=lambda e: e[0])

    # --- analyse ----------------------------------------------------------
    def analyze(self, question: str) -> Analysis:
        question = unicodedata.normalize("NFC", question.strip())
        doc = self.nlp(question)
        ascii_q = _ascii_same_length(question)

        raw, starts = [], []
        for m in _TOKEN.finditer(ascii_q):
            raw.append(m.group())
            starts.append(m.start())
        tokens = [singular(t) for t in raw]
        lemmas, pos = [], []
        for st in starts:
            tok = next((t for t in doc if t.idx <= st < t.idx + len(t.text)), None)
            lemmas.append(_ascii_same_length(tok.lemma_) if tok is not None else raw[len(lemmas)])
            pos.append(tok.pos_ if tok is not None else "X")

        mentions = self._disambiguate(self._match(tokens, raw, pos), raw, lemmas)
        numbers, dates, used = self._numbers_and_dates(raw, tokens, mentions)
        text = " " + " ".join(raw) + " "

        superlative = None
        if any(f" {c} " in text for c in MAX_CUES):
            superlative = "max"
        if any(f" {c} " in text for c in MIN_CUES):
            superlative = "min" if superlative is None or text.find(" moins") >= 0 else superlative
        if numbers and superlative and all(n.op in (">", "<", ">=", "<=") for n in numbers):
            # "plus de 100 kW" est une comparaison, pas un superlatif
            if not re.search(r" (le|la|les) (plus|moins) (?!de \d)", text):
                superlative = None

        most_of = None
        for m in self.mentions_of(mentions, "class"):
            before = " ".join(raw[max(0, m.start - 3):m.start])
            if re.search(r"(plus|moins) (de|d)$", before):
                most_of = m.value
                superlative = superlative or ("min" if "moins" in before else "max")

        limit = None
        for i, t in enumerate(raw):
            if i in used or not t.isdigit():
                continue
            nxt = next((m for m in mentions if m.start in (i + 1, i + 2)), None)
            if nxt and nxt.kind == "class" and int(t) <= 100:
                limit = int(t)
                used.add(i)
        if "top" in raw:
            i = raw.index("top")
            if i + 1 < len(raw) and raw[i + 1].isdigit():
                limit = int(raw[i + 1])

        group_by, group_by_type = None, False
        for i, t in enumerate(raw):
            if t != "par" or i + 1 >= len(raw):
                continue
            prev_is_verb = i > 0 and (pos[i - 1] in ("VERB", "AUX") or lemmas[i - 1].endswith("er"))
            if prev_is_verb:
                continue
            if raw[i + 1] in ("type", "categorie", "sorte", "classe"):
                group_by_type = True
                group_by = next((m for m in mentions if m.start in (i + 2, i + 3) and m.kind == "class"), None)
                break
            group_by = next((m for m in mentions if m.start == i + 1 and m.kind in ("class", "dprop")), None)
            if group_by:
                break

        cues = set()
        words = {*lemmas, *raw}
        for prop, stems in OBJECT_PROPERTY_CUES.items():
            if any(w.startswith(s) for s in stems for w in words if len(w) >= 3):
                cues.add(prop)
        asks_where = "où" in question.lower()
        if asks_where:
            cues.add("situeDans")
        asks_who = "qui" in raw[:2]

        return Analysis(question, tokens, raw, lemmas, pos, mentions, numbers, dates, cues,
                        superlative, most_of, limit, group_by, group_by_type, asks_where, asks_who,
                        self._unknown(question, raw, tokens, starts, mentions, used))

    def _unknown(self, question, raw, tokens, starts, mentions, used) -> list[str]:
        """Mots que l'ontologie ne connaît pas : on le dit au lieu de les ignorer en silence."""
        covered = {i for m in mentions for i in range(m.start, m.end)} | used
        unknown, current = [], []
        for i, t in enumerate(raw):
            original = question[starts[i]:starts[i] + len(t)]
            # nom propre (majuscule hors début de phrase) qui n'a été reconnu nulle part
            if i > 0 and i not in covered and original[:1].isupper() and len(t) >= 3 and not t[0].isdigit() \
                    and t not in UNIT_PROPERTIES:
                current.append(original)
                continue
            if current:
                unknown.append(" ".join(current))
                current = []
        if current:
            unknown.append(" ".join(current))
        for key, phrase in self.missing_props.items():
            n = len(key)
            for i in range(len(tokens) - n + 1):
                if tuple(tokens[i:i + n]) == key and not covered & set(range(i, i + n)):
                    unknown.append(" ".join(raw[i:i + n]))
        return unknown

    @staticmethod
    def mentions_of(mentions, kind):
        return [m for m in mentions if m.kind == kind]

    @staticmethod
    def _disambiguate(mentions: list[Mention], raw: list[str], lemmas: list[str]) -> list[Mention]:
        """Retire les faux positifs dus au contexte."""
        kept = []
        for m in mentions:
            prev_lemma = lemmas[m.start - 1] if m.start > 0 else ""
            # "ont eu lieu" : expression figée, pas la classe Localisation
            if m.kind == "class" and raw[m.start] == "lieu" and prev_lemma in ("avoir", "eu"):
                continue
            # "moyenne", "maximum"... sont des mots d'agrégation, sauf après la propriété ("gravité moyenne")
            if m.kind == "value" and " ".join(raw[m.start:m.end]) in AGGREGATION_WORDS:
                prev = kept[-1] if kept else None
                if not (prev and prev.kind == "dprop" and m.value[0] in prev.value and prev.end == m.start):
                    continue
            kept.append(m)
        return kept

    def _match(self, tokens: list[str], raw: list[str], pos: list[str]) -> list[Mention]:
        mentions, i = [], 0
        covered = [False] * len(tokens)
        # 1) correspondance exacte, la plus longue d'abord
        while i < len(tokens):
            for n in range(min(MAX_NGRAM, len(tokens) - i), 0, -1):
                key = tuple(tokens[i:i + n])
                if key in self.lexicon:
                    _, kind, value = self._best(key)
                    mentions.append(Mention(kind, value, i, i + n, " ".join(raw[i:i + n])))
                    covered[i:i + n] = [True] * n
                    i += n
                    break
            else:
                i += 1
        # 2) correspondance approximative (fautes de frappe) sur les mots restants
        from spacy.lang.fr.stop_words import STOP_WORDS
        i = 0
        while i < len(tokens):
            if covered[i] or len(tokens[i]) < 4 or tokens[i][0].isdigit() or raw[i] in STOP_WORDS \
                    or pos[i] in ("VERB", "AUX", "ADV", "DET", "ADP", "PRON", "CCONJ", "SCONJ"):
                i += 1
                continue
            found = None
            for n in (3, 2, 1):
                if i + n > len(tokens) or any(covered[i:i + n]):
                    continue
                phrase = " ".join(tokens[i:i + n])
                hit = process.extractOne(phrase, self._fuzzy_keys.get(n, []), scorer=fuzz.ratio,
                                         score_cutoff=FUZZY_THRESHOLD)
                if hit:
                    found = (n, hit)
                    break
            if found:
                n, (key, score, _) = found
                _, kind, value = self._best(tuple(key.split()))
                mentions.append(Mention(kind, value, i, i + n, " ".join(raw[i:i + n]), score / 100))
                covered[i:i + n] = [True] * n
                i += n
            else:
                i += 1
        return sorted(mentions, key=lambda m: m.start)

    def _numbers_and_dates(self, raw, tokens, mentions):
        numbers, dates, used = [], [], set()
        text_before = lambda i, n=5: " ".join(raw[max(0, i - n):i])

        # dates : [jour] mois année | mois année | année seule (1900-2100)
        i = 0
        while i < len(raw):
            t = raw[i]
            day = month = year = None
            j = i
            if t.isdigit() and 1 <= int(t) <= 31 and i + 1 < len(raw) and raw[i + 1] in MONTHS:
                day, j = int(t), i + 1
            if raw[j] in MONTHS:
                month = MONTHS[raw[j]]
                if j + 1 < len(raw) and raw[j + 1].isdigit() and len(raw[j + 1]) == 4:
                    year, j = int(raw[j + 1]), j + 1
            elif t.isdigit() and len(t) == 4 and 1900 <= int(t) <= 2100:
                prev = raw[i - 1] if i > 0 else ""
                if prev in DATE_CUES or (i > 1 and raw[i - 2] in DATE_CUES):
                    year = int(t)
            if year:
                prefix = f"{year:04d}" + (f"-{month:02d}" if month else "") + (f"-{day:02d}" if day and month else "")
                cue = next((DATE_CUES[w] for w in reversed(raw[max(0, i - 3):i]) if w in DATE_CUES), "in")
                dates.append(DateFilter(cue, prefix))
                used.update(range(i, j + 1))
                i = j + 1
                continue
            i += 1

        # nombres avec comparateur et/ou unité
        for i, t in enumerate(raw):
            if i in used:
                continue
            value = _to_float(t)
            if value is None or not re.match(r"^\d", t):
                continue
            before = text_before(i)
            op = next((o for o, cues in COMPARATORS for c in cues if before.endswith(c)), None)
            unit = raw[i + 1] if i + 1 < len(raw) and raw[i + 1] in UNIT_PROPERTIES else None
            value2 = None
            if before.endswith("entre") and i + 2 < len(raw) and raw[i + 1] == "et" and _to_float(raw[i + 2]) is not None:
                value2 = _to_float(raw[i + 2])
                op = "between"
                unit = unit or (raw[i + 3] if i + 3 < len(raw) and raw[i + 3] in UNIT_PROPERTIES else None)
                used.add(i + 2)
            if op is None and unit is None:
                continue
            if op is None:
                op = "="
            factor = UNIT_FACTORS.get(unit, 1)
            props = list(UNIT_PROPERTIES.get(unit, []))
            prev_dprop = [m for m in mentions if m.kind == "dprop" and m.end <= i]
            if prev_dprop:
                props = list(prev_dprop[-1].value) + [p for p in props if p not in prev_dprop[-1].value]
            numbers.append(NumberFilter(op, value * factor, value2 * factor if value2 is not None else None, props, i))
            used.add(i)
        return numbers, dates, used
