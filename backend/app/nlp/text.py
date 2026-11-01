"""Normalisation du texte : minuscules, sans accents, au singulier."""
import re
import unicodedata

_WORD = re.compile(r"[a-z0-9]+(?:[.,][0-9]+)?")


def strip_accents(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn")


def singular(word: str) -> str:
    """Pluriel français simplifié : hôpitaux -> hopital, réseaux -> reseau, batteries -> batterie."""
    if len(word) <= 3 or word[0].isdigit():
        return word
    if word.endswith("eaux"):
        return word[:-1]
    if word.endswith("aux"):
        return word[:-3] + "al"
    if word.endswith(("s", "x")) and not word.endswith("ss"):
        return word[:-1]
    return word


def norm_tokens(text: str) -> list[str]:
    """'Centrales Solaires' -> ['centrale', 'solaire']."""
    return [singular(w) for w in _WORD.findall(strip_accents(text.lower()))]


def split_camel(name: str) -> str:
    """'CentraleSolaire_01' -> 'Centrale Solaire 01', 'puissanceKW' -> 'puissance KW'."""
    name = name.replace("_", " ")
    name = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", name)
    name = re.sub(r"(?<=[A-Za-z])(?=[0-9])", " ", name)
    return re.sub(r"\s+", " ", name).strip()


def humanize(name: str) -> str:
    """Nom lisible d'une classe : 'CentraleSolaire' -> 'centrale solaire'."""
    return split_camel(name).lower()


def plural_word(word: str) -> str:
    if word.endswith("al"):
        return word[:-2] + "aux"
    if word.endswith("eau"):
        return word + "x"
    if word.endswith(("s", "x")):
        return word
    return word + "s"
