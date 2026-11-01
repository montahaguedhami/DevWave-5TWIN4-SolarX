"""Schéma de l'ontologie, lu directement dans Fuseki au démarrage.

Rien n'est codé en dur : si l'équipe ajoute une classe, une propriété ou un
individu dans solarx.owl puis recharge Fuseki, l'IA le connaît automatiquement
(endpoint POST /api/ia/recharger).
"""
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Callable

QueryFn = Callable[[str], list[dict]]


@dataclass
class Edge:
    """Une relation possible : sujet de classe `src` --prop--> objet de classe `dst`."""
    prop: str
    src: str
    dst: str
    observed: bool  # vue dans les données (sinon : déduite de domain/range)


@dataclass
class OntologySchema:
    parents: dict[str, set[str]] = field(default_factory=lambda: defaultdict(set))
    classes: set[str] = field(default_factory=set)
    object_props: set[str] = field(default_factory=set)
    data_props: dict[str, str] = field(default_factory=dict)  # propriété -> type xsd
    inverse: dict[str, str] = field(default_factory=dict)
    edges: list[Edge] = field(default_factory=list)
    individuals: dict[str, set[str]] = field(default_factory=lambda: defaultdict(set))
    names: dict[str, str] = field(default_factory=dict)  # individu -> valeur de :nom
    class_data_props: dict[str, dict[str, int]] = field(default_factory=lambda: defaultdict(dict))
    string_values: dict[str, set[str]] = field(default_factory=lambda: defaultdict(set))

    # --- hiérarchie -------------------------------------------------------
    def ancestors(self, cls: str) -> set[str]:
        seen, todo = {cls}, [cls]
        while todo:
            for p in self.parents.get(todo.pop(), ()):
                if p not in seen:
                    seen.add(p)
                    todo.append(p)
        return seen

    def descendants(self, cls: str) -> set[str]:
        return {c for c in self.classes if cls in self.ancestors(c)}

    def related(self, a: str, b: str) -> bool:
        """a et b sont compatibles si l'une est sous-classe de l'autre."""
        return b in self.ancestors(a) or a in self.ancestors(b)

    def types_of(self, individual: str) -> set[str]:
        return self.individuals.get(individual, set())

    def is_a(self, individual: str, cls: str) -> bool:
        return any(cls in self.ancestors(t) for t in self.types_of(individual))

    def data_props_of(self, cls: str) -> dict[str, int]:
        """Propriétés de données réellement remplies pour cette classe (et ses sous-classes)."""
        counts: dict[str, int] = defaultdict(int)
        for c in self.descendants(cls) | {cls}:
            for p, n in self.class_data_props.get(c, {}).items():
                counts[p] += n
        return counts

    def label(self, individual: str) -> str:
        return self.names.get(individual, individual)


# --- chargement depuis Fuseki --------------------------------------------

_CLASSES = """
SELECT ?c ?parent WHERE {
  ?c a owl:Class . FILTER(STRSTARTS(STR(?c), "$NS"))
  OPTIONAL { ?c rdfs:subClassOf ?parent . FILTER(isIRI(?parent)) }
}"""

_PROPERTIES = """
SELECT ?p ?kind ?dom ?rng ?inv WHERE {
  VALUES ?kind { owl:ObjectProperty owl:DatatypeProperty }
  ?p a ?kind . FILTER(STRSTARTS(STR(?p), "$NS"))
  OPTIONAL { ?p rdfs:domain/(owl:unionOf/rdf:rest*/rdf:first)? ?dom . FILTER(isIRI(?dom)) }
  OPTIONAL { ?p rdfs:range/(owl:unionOf/rdf:rest*/rdf:first)? ?rng . FILTER(isIRI(?rng)) }
  OPTIONAL { { ?p owl:inverseOf ?inv } UNION { ?inv owl:inverseOf ?p } }
}"""

_INDIVIDUALS = """
SELECT ?i ?type ?nom WHERE {
  { ?i a ?type . ?type a owl:Class } UNION { ?i a owl:NamedIndividual }
  FILTER(STRSTARTS(STR(?i), "$NS"))
  OPTIONAL { ?i :nom ?nom }
}"""

# Relations réellement présentes dans les données (plus fiables que domain/range)
_OBSERVED_EDGES = """
SELECT DISTINCT ?p ?ct ?ot WHERE {
  ?s ?p ?o . FILTER(isIRI(?o) && STRSTARTS(STR(?p), "$NS"))
  ?s a ?ct . ?ct a owl:Class .
  ?o a ?ot . ?ot a owl:Class .
}"""

_OBSERVED_DATA = """
SELECT ?ct ?p (COUNT(?v) AS ?n) WHERE {
  ?s ?p ?v . FILTER(isLiteral(?v) && STRSTARTS(STR(?p), "$NS"))
  ?s a ?ct . ?ct a owl:Class .
} GROUP BY ?ct ?p"""

_STRING_VALUES = """
SELECT DISTINCT ?p ?v WHERE {
  ?s ?p ?v . FILTER(isLiteral(?v) && datatype(?v) = xsd:string && STRLEN(?v) < 40 && STRSTARTS(STR(?p), "$NS"))
}"""


def load_schema(run_query: QueryFn, namespace: str) -> OntologySchema:
    # seules les ressources de l'ontologie SolarX comptent (pas un ancien fichier resté dans Fuseki)
    run = lambda q: run_query(q.replace("$NS", namespace))
    s = OntologySchema()

    for r in run(_CLASSES):
        s.classes.add(r["c"])
        if r.get("parent"):
            s.parents[r["c"]].add(r["parent"])
            s.classes.add(r["parent"])
    s.classes.discard("Thing")

    declared: dict[str, tuple[set[str], set[str]]] = defaultdict(lambda: (set(), set()))
    inverse_candidates: dict[str, set[str]] = defaultdict(set)
    for r in run(_PROPERTIES):
        p = r["p"]
        if r["kind"] == "ObjectProperty":
            s.object_props.add(p)
            if r.get("dom"):
                declared[p][0].add(r["dom"])
            if r.get("rng"):
                declared[p][1].add(r["rng"])
            if r.get("inv") and r["inv"] != p:
                inverse_candidates[p].add(r["inv"])
        else:
            s.data_props.setdefault(p, r.get("rng") or "")
            if r.get("rng"):
                s.data_props[p] = r["rng"]

    # Une propriété peut avoir été déclarée inverse de deux autres (erreur de saisie) :
    # on forme les paires en commençant par les propriétés sans ambiguïté.
    for p in sorted(inverse_candidates, key=lambda q: (len(inverse_candidates[q]), q)):
        if p in s.inverse:
            continue
        for q in sorted(inverse_candidates[p], key=lambda q: len(inverse_candidates[q])):
            if q not in s.inverse:
                s.inverse[p], s.inverse[q] = q, p
                break

    for p, (doms, rngs) in declared.items():
        for d in doms - {"Thing"}:
            for g in rngs - {"Thing"}:
                s.edges.append(Edge(p, d, g, observed=False))

    for r in run(_INDIVIDUALS):
        if r.get("type") and r["type"] != "NamedIndividual":
            s.individuals[r["i"]].add(r["type"])
        else:
            s.individuals.setdefault(r["i"], set())
        if r.get("nom"):
            s.names[r["i"]] = str(r["nom"])
    # les classes et propriétés sont aussi des owl:NamedIndividual parfois : on les retire
    for name in list(s.individuals):
        if name in s.classes or name in s.object_props or name in s.data_props:
            del s.individuals[name]

    for r in run(_OBSERVED_EDGES):
        if r["p"] in s.object_props or r["p"] not in s.data_props:
            s.object_props.add(r["p"])
            s.edges.append(Edge(r["p"], r["ct"], r["ot"], observed=True))

    for r in run(_OBSERVED_DATA):
        if r["p"] in ("nom",) or r["p"] in s.object_props:
            continue
        s.data_props.setdefault(r["p"], "")
        s.class_data_props[r["ct"]][r["p"]] = int(r["n"])

    for r in run(_STRING_VALUES):
        s.string_values[r["p"]].add(str(r["v"]))

    return s
