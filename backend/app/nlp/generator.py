"""Génération de la requête SPARQL à partir de l'analyse et de l'intention.

Idée principale : on ne code pas une requête par question. Pour relier deux
éléments de la question (ex. "batteries" et "Tunis"), on cherche dans le schéma
de l'ontologie le plus court chemin de propriétés objet entre leurs classes
(ex. Batterie --situeDans--> Ville). Les verbes de la question ("alimente",
"détecte"...) départagent les chemins possibles.
"""
import re
from dataclasses import dataclass, field

from .analyzer import Analysis, Mention
from .schema import OntologySchema
from .vocabulary import DEFAULT_NUMERIC, DISPLAY_PRIORITY

NUMERIC_TYPES = {"decimal", "integer", "double", "float", "int", "long", "nonNegativeInteger"}
DATE_PROPS = ["dateOccurrence", "dateEvenement", "dateMesure", "dateInstallation"]
_SAFE_NAME = re.compile(r"[A-Za-z_][A-Za-z0-9_\-]*")


@dataclass
class QueryPlan:
    kind: str                      # lister | compter | somme | moyenne | maximum | minimum | decrire | valeur | le_plus_de
    sparql: str | None = None
    target: str | None = None      # classe cible
    individual: str | None = None
    prop: str | None = None        # propriété numérique agrégée ou triée
    group: str | None = None       # libellé du regroupement
    counted: str | None = None     # classe comptée (le_plus_de)
    order: str = "max"
    context: list[str] = field(default_factory=list)   # filtres rappelés dans la réponse
    notes: list[str] = field(default_factory=list)


def _lit(text: str) -> str:
    return '"' + text.replace("\\", "\\\\").replace('"', '\\"') + '"'


def _num(x: float) -> str:
    return str(int(x)) if float(x).is_integer() else str(x)


def _var(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9_]", "_", name[0].lower() + name[1:])


class PathFinder:
    def __init__(self, schema: OntologySchema):
        self.s = schema
        self.used = {e.prop for e in schema.edges if e.observed}
        edges = set()
        for e in schema.edges:
            prop, src, dst = self.canonical(e.prop), e.src, e.dst
            if prop != e.prop:
                src, dst = dst, src
            edges.add((prop, src, dst, e.observed))
        self.edges = sorted(edges)

    def canonical(self, p: str) -> str:
        """Pour une paire de propriétés inverses, on raisonne toujours avec la même."""
        inv = self.s.inverse.get(p)
        if not inv:
            return p

        def weight(q):
            obs = sum(1 for e in self.s.edges if e.prop == q and e.observed)
            decl = sum(1 for e in self.s.edges if e.prop == q and not e.observed)
            return (obs, decl, q)

        return max((p, inv), key=weight)

    def step(self, prop: str, forward: bool, term) -> str:
        """Fuseki n'applique pas owl:inverseOf : on cherche dans les deux sens (p | ^inverse)."""
        alts = [term(prop)]
        inv = self.s.inverse.get(prop)
        if inv and inv in self.used:
            alts.append("^" + term(inv))
        path = alts[0] if len(alts) == 1 else "(" + "|".join(alts) + ")"
        return path if forward else "^" + path

    def _moves(self, classes: set[str]):
        for prop, a, b, obs in self.edges:
            if any(self.s.related(a, c) for c in classes):
                yield prop, True, b, obs
            if any(self.s.related(b, c) for c in classes):
                yield prop, False, a, obs

    def find(self, src: set[str], dst: set[str], cues: set[str], max_len: int = 2,
             allowed: set[str] | None = None) -> list[tuple]:
        """Chemins les mieux notés entre deux ensembles de classes : [((prop, sens), ...), ...]."""
        cue_props = cues | {self.canonical(c) for c in cues}
        found: dict[tuple, tuple] = {}

        def add(steps, observed):
            hits = sum(1 for p, _ in steps if p in cue_props)
            key = (len(steps), -hits, -observed)
            if steps not in found or key < found[steps]:
                found[steps] = key

        reaches = lambda c: any(self.s.related(c, d) for d in dst)
        for p1, f1, mid, o1 in self._moves(src):
            if allowed is not None and p1 not in allowed:
                continue
            if reaches(mid):
                add(((p1, f1),), int(o1))
            if max_len >= 2:
                for p2, f2, end, o2 in self._moves({mid}):
                    if p2 == p1 or (allowed is not None and p2 not in allowed):
                        continue
                    if reaches(end):
                        add(((p1, f1), (p2, f2)), int(o1) + int(o2))
        if not found:
            return []
        best = min(found.values())
        # à égalité, on garde au plus 3 chemins (réunis par UNION)
        return [steps for steps, k in sorted(found.items(), key=lambda kv: kv[1]) if k == best][:3]


class SparqlGenerator:
    def __init__(self, schema: OntologySchema, namespace: str):
        self.s = schema
        self.ns = namespace
        self.paths = PathFinder(schema)

    # --- briques ------------------------------------------------------------
    def term(self, name: str) -> str:
        return f":{name}" if _SAFE_NAME.fullmatch(name) else f"<{self.ns}{name}>"

    def type_of(self, var: str, cls: str) -> str:
        return f"{var} rdf:type/rdfs:subClassOf* {self.term(cls)} ."

    def link(self, a_var: str, a_classes: set[str], b: str, b_classes: set[str], cues: set[str],
             allowed: set[str] | None = None, max_len: int = 2) -> str | None:
        paths = self.paths.find(a_classes, b_classes, cues, max_len=max_len, allowed=allowed)
        if not paths:
            return None
        patterns = [f"{a_var} {'/'.join(self.paths.step(p, f, self.term) for p, f in steps)} {b} ."
                    for steps in paths]
        if len(patterns) == 1:
            return patterns[0]
        return " UNION ".join("{ " + p + " }" for p in patterns)

    def props_of(self, cls: str | None) -> dict[str, int]:
        if cls is None:
            return {}
        return self.s.data_props_of(cls)

    def numeric_prop(self, cls: str | None, candidates: list[str] | None = None) -> str | None:
        available = self.props_of(cls)
        for p in candidates or []:
            if p in available:
                return p
        if candidates and not available:
            return candidates[0]
        for p in DEFAULT_NUMERIC:
            if p in available:
                return p
        return None

    def class_of_prop(self, props: list[str]) -> str | None:
        """'capacité totale' sans classe citée -> la classe qui porte cette propriété (Stockage)."""
        owners = [c for c, ps in self.s.class_data_props.items() if any(p in ps for p in props)]
        if not owners:
            return None
        common = set.intersection(*(self.s.ancestors(c) for c in owners)) - {"Thing"}
        if common:
            # l'ancêtre commun le plus spécifique
            return max(common, key=lambda c: len(self.s.ancestors(c)))
        return owners[0]

    # --- requête principale ---------------------------------------------------
    def build(self, a: Analysis, intent: str) -> QueryPlan:
        classes = a.of_kind("class")
        individuals = a.of_kind("individual")
        dprops = a.of_kind("dprop")
        group_mention = a.group_by

        # 0) un mot absent de l'ontologie : mieux vaut le dire que répondre à côté
        if a.unknown:
            return QueryPlan(kind=intent, notes=[f"« {u} » n'existe pas dans l'ontologie SolarX." for u in a.unknown])

        # « Qui occupe la maison Djerba ? » : on cherche l'élément à l'autre bout de la relation
        if a.asks_who and individuals and not classes:
            target = self._who_target(individuals[0].value, a.cues)
            if target:
                return self._lister(a, target, [individuals[0]], dprops, intent="lister")

        # 1) questions sur un individu précis ---------------------------------
        if individuals and (intent == "decrire" or not classes or
                            all(self.s.is_a(individuals[0].value, c.value) for c in classes)):
            ind = individuals[0].value
            if dprops and not classes:
                return self._value_of(ind, list(dprops[0].value))
            if a.asks_where:
                plan = self._lister(a, "Localisation", [individuals[0]], [], intent="lister")
                plan.kind, plan.individual = "ou", ind
                return plan
            if intent == "decrire" or not (a.numbers or a.dates or len(individuals) > 1):
                return self._describe(ind)

        # 2) classe cible ---------------------------------------------------------
        most_of = a.most_of
        candidates = [c for c in classes if c.value != most_of and c is not group_mention]
        if group_mention is not None and group_mention.kind == "class":
            candidates = [c for c in candidates if c.start != group_mention.start]
        target = candidates[0].value if candidates else None
        if target is None and a.asks_where and not most_of:
            target = "Localisation"
        if target is None and dprops:
            target = self.class_of_prop(list(dprops[0].value))
        if target is None and most_of:
            target, most_of = most_of, None
        if target is None and not a.of_kind("state") and not a.of_kind("value"):
            return QueryPlan(kind=intent, notes=["Je n'ai reconnu aucun élément de l'ontologie dans la question."])

        others = [c for c in candidates[1:]] + individuals
        if most_of:
            return self._most_of(a, target, most_of, others)

        if intent in ("maximum", "minimum") and not self.numeric_prop(target, self._prop_candidates(a)):
            intent = "lister"
        if intent in ("lister", "decrire", "maximum", "minimum") and (group_mention or a.group_by_type) \
                and intent not in ("maximum", "minimum"):
            intent = "compter"
        if intent == "decrire":
            intent = "lister"
        return self._lister(a, target, others, dprops, intent=intent)

    def _who_target(self, ind: str, cues: set[str]) -> str | None:
        """Classe reliée à l'individu par une relation que le verbe évoque (occupe -> Consommateur)."""
        cue_props = cues | {self.paths.canonical(c) for c in cues}
        types = self.s.types_of(ind)
        found = set()
        for e in self.s.edges:
            if e.prop not in cue_props and self.s.inverse.get(e.prop) not in cue_props:
                continue
            if any(self.s.related(t, e.dst) for t in types):
                found.add(e.src)
            elif any(self.s.related(t, e.src) for t in types):
                found.add(e.dst)
        found.discard("Thing")
        if not found:
            return None
        common = set.intersection(*(self.s.ancestors(c) for c in found)) - {"Thing"}
        return max(common, key=lambda c: len(self.s.ancestors(c))) if common else None

    def _prop_candidates(self, a: Analysis) -> list[str]:
        props = []
        for m in a.of_kind("dprop"):
            props += [p for p in m.value if p not in props]
        for n in a.numbers:
            props += [p for p in n.props if p not in props]
        return props

    def _constraints(self, a: Analysis, target: str | None, others: list[Mention], notes: list[str],
                     notes_ctx: list[str] | None = None):
        """Motifs WHERE communs : type, liens, états, valeurs, nombres, dates."""
        notes_ctx = [] if notes_ctx is None else notes_ctx
        where, extra_cols = [], []
        tclasses = {target} if target else set()
        if target:
            where.append(self.type_of("?element", target))

        for m in others:
            if m.kind == "individual":
                notes_ctx.append(self.s.label(m.value))
            else:
                notes_ctx.append(m.text)
        for m in [*a.of_kind("state"), *a.of_kind("value")]:
            notes_ctx.append(m.text)
        for i, m in enumerate(others, 1):
            if m.kind == "individual":
                b, bclasses = self.term(m.value), self.s.types_of(m.value) or {"Thing"}
            else:
                b, bclasses = f"?{_var(m.value)}", {m.value}
                where.append(self.type_of(b, m.value))
                extra_cols.append((b, m.value))
            pattern = self.link("?element", tclasses, b, bclasses, a.cues) if target else None
            if pattern:
                where.append(pattern)
            else:
                notes.append(f"Aucune relation trouvée entre « {target} » et « {m.value} » dans l'ontologie.")

        for k, st in enumerate(a.of_kind("state")):
            incident, etat = st.value
            parts = []
            if etat and "etat" in self.s.data_props:
                parts.append(f"{{ ?element :etat ?etat{k} . FILTER(LCASE(STR(?etat{k})) = {_lit(etat.lower())}) }}")
            if incident and incident in self.s.classes:
                # un incident est lié à l'élément qu'il affecte (pas au capteur qui l'a détecté)
                link = self.link(f"?evt{k}", {incident}, "?element", tclasses or {"Thing"}, set(),
                                 allowed={"affecte", "porteSur"}, max_len=1)
                link = link or f"?evt{k} (:affecte|^:estAffectePar) ?element ."
                parts.append(f"{{ {self.type_of(f'?evt{k}', incident)} {link} }}")
            if parts:
                where.append(" UNION ".join(parts))

        for k, v in enumerate(a.of_kind("value")):
            prop, value, partial = v.value
            var = f"?val{k}"
            where.append(f"?element {self.term(prop)} {var} .")
            if partial:
                where.append(f"FILTER(CONTAINS(LCASE(STR({var})), {_lit(value.lower())}))")
            else:
                where.append(f"FILTER(LCASE(STR({var})) = {_lit(value.lower())})")

        filtered_props = {}
        for n in a.numbers:
            prop = self.numeric_prop(target, n.props)
            if not prop:
                notes.append(f"Je ne sais pas à quelle propriété appliquer la valeur {_num(n.value)}.")
                continue
            var = f"?v_{prop}"
            if prop not in filtered_props:
                where.append(f"?element {self.term(prop)} {var} .")
            filtered_props[prop] = var
            if n.op == "between":
                where.append(f"FILTER({var} >= {_num(n.value)} && {var} <= {_num(n.value2)})")
            else:
                where.append(f"FILTER({var} {n.op} {_num(n.value)})")

        if a.dates:
            available = self.props_of(target)
            date_prop = next((p for p in DATE_PROPS if p in available), None) or \
                next((p for p in available if p.lower().startswith("date")), None)
            if date_prop:
                var = f"?v_{date_prop}"
                where.append(f"?element {self.term(date_prop)} {var} .")
                filtered_props[date_prop] = var
                for d in a.dates:
                    if d.op == "in":
                        where.append(f"FILTER(STRSTARTS(STR({var}), {_lit(d.prefix)}))")
                    elif d.op == ">":
                        where.append(f"FILTER(STR({var}) > {_lit(d.prefix + '~')})")
                    elif d.op == "<=":
                        where.append(f"FILTER(STR({var}) < {_lit(d.prefix + '~')})")
                    else:
                        where.append(f"FILTER(STR({var}) {d.op} {_lit(d.prefix)})")
            else:
                notes.append("Aucune date n'est renseignée pour ce type d'élément.")
        return where, extra_cols, filtered_props

    def _group(self, a: Analysis, target: str | None, notes: list[str]) -> tuple[list[str], str | None, str | None]:
        """Motif du regroupement ("par ville", "par type"...) -> (motifs, variable, libellé)."""
        g = a.group_by
        # un individu typé Mesure ET MesureConsommation n'est compté que dans son type le plus précis
        most_specific = "FILTER NOT EXISTS { ?element rdf:type ?autre_ . ?autre_ rdfs:subClassOf+ ?groupe . }"
        if a.group_by_type and (g is None or g.kind != "class"):
            return [f"?element rdf:type ?groupe . ?groupe rdfs:subClassOf* {self.term(target)} .", most_specific], \
                "?groupe", "type"
        if a.group_by_type and g is not None:
            return [f"?element rdf:type ?groupe . ?groupe rdfs:subClassOf* {self.term(g.value)} .", most_specific], \
                "?groupe", "type"
        if g is None:
            return [], None, None
        if g.kind == "dprop":
            prop = next((p for p in g.value if p in self.props_of(target)), g.value[0])
            return [f"?element {self.term(prop)} ?groupe ."], "?groupe", prop
        link = self.link("?element", {target}, "?groupe", {g.value}, a.cues)
        if not link:
            notes.append(f"Impossible de regrouper par « {g.text} ».")
            return [], None, None
        return [self.type_of("?groupe", g.value), link], "?groupe", g.value

    def _lister(self, a: Analysis, target: str | None, others: list[Mention], dprops, intent: str) -> QueryPlan:
        plan = QueryPlan(kind=intent, target=target)
        where, extra_cols, filtered = self._constraints(a, target, others, plan.notes, plan.context)

        if intent in ("compter", "somme", "moyenne"):
            gwhere, gvar, glabel = self._group(a, target, plan.notes)
            plan.group = glabel
            body = "\n  ".join(where + gwhere)
            if intent == "compter":
                if gvar:
                    plan.sparql = (f"SELECT {gvar} (COUNT(DISTINCT ?element) AS ?nombre)\nWHERE {{\n  {body}\n}}\n"
                                   f"GROUP BY {gvar}\nORDER BY DESC(?nombre)")
                else:
                    plan.sparql = f"SELECT (COUNT(DISTINCT ?element) AS ?nombre)\nWHERE {{\n  {body}\n}}"
                return plan
            prop = self.numeric_prop(target, self._prop_candidates(a))
            if not prop:
                plan.notes.append("Aucune valeur numérique à additionner pour ce type d'élément.")
                plan.kind = "compter"
                plan.sparql = f"SELECT (COUNT(DISTINCT ?element) AS ?nombre)\nWHERE {{\n  {body}\n}}"
                return plan
            plan.prop = prop
            var = filtered.get(prop, f"?v_{prop}")
            if prop not in filtered:
                body += f"\n  ?element {self.term(prop)} {var} ."
            agg = "SUM" if intent == "somme" else "AVG"
            alias = "total" if intent == "somme" else "moyenne"
            inner_vars = " ".join(v for v in ("?element", gvar, var) if v)
            head = f"{gvar} " if gvar else ""
            plan.sparql = (f"SELECT {head}({agg}({var}) AS ?{alias}) (COUNT(?element) AS ?nombre)\nWHERE {{\n"
                           f"  {{ SELECT DISTINCT {inner_vars} WHERE {{\n    {body.replace(chr(10) + '  ', chr(10) + '    ')}\n  }} }}\n}}"
                           + (f"\nGROUP BY {gvar}\nORDER BY DESC(?{alias})" if gvar else ""))
            return plan

        # lister / maximum / minimum : tableau d'éléments
        sort_prop = None
        if intent in ("maximum", "minimum"):
            sort_prop = self.numeric_prop(target, self._prop_candidates(a))
            plan.prop = sort_prop
        available = self.props_of(target)
        shown = [p for p in DISPLAY_PRIORITY if p in available][:4]
        for p in self._prop_candidates(a):
            if p in available and p not in shown:
                shown.insert(0, p)
        if sort_prop and sort_prop not in shown:
            shown.insert(0, sort_prop)
        for p in filtered:
            if p not in shown:
                shown.insert(0, p)

        select = ["?element", "(SAMPLE(?nom_) AS ?nom)"]
        optional = ["OPTIONAL { ?element :nom ?nom_ }"]
        if target and self.s.descendants(target) - {target}:
            select.append("(SAMPLE(?type_) AS ?type)")
            optional.append(f"OPTIONAL {{ ?element rdf:type ?type_ . ?type_ rdfs:subClassOf* {self.term(target)} . "
                            f"FILTER(?type_ != {self.term(target)}) }}")
        elif not target:
            select.append("(SAMPLE(?type_) AS ?type)")
            optional.append("OPTIONAL { ?element rdf:type ?type_ . ?type_ a owl:Class }")
        for p in shown:
            var = filtered.get(p, f"?v_{p}")
            if p == sort_prop and p not in filtered:
                where.append(f"?element {self.term(p)} {var} .")
                filtered[p] = var
            elif p not in filtered:
                optional.append(f"OPTIONAL {{ ?element {self.term(p)} {var} }}")
            select.append(f"(SAMPLE({var}) AS ?{p})")
        for var, cls in extra_cols:
            select.append(f"(SAMPLE({var}) AS {var}Lie)")
        if a.asks_where and target and target != "Localisation":
            link = self.link("?element", {target}, "?lieu_", {"Localisation"}, {"situeDans"})
            if link:
                optional.append(f"OPTIONAL {{ {link} }}")
                select.append("(SAMPLE(?lieu_) AS ?lieu)")

        body = "\n  ".join(where + optional)
        order = "ORDER BY ?element"
        limit = ""
        if sort_prop:
            order = f"ORDER BY {'DESC' if intent == 'maximum' else 'ASC'}(?{sort_prop})"
            limit = f"\nLIMIT {a.limit or 1}"
        elif a.limit:
            limit = f"\nLIMIT {a.limit}"
        plan.sparql = f"SELECT {' '.join(select)}\nWHERE {{\n  {body}\n}}\nGROUP BY ?element\n{order}{limit}"
        return plan

    def _most_of(self, a: Analysis, target: str, counted: str, others: list[Mention]) -> QueryPlan:
        """« Quelle ville a le plus de batteries ? » : on compte les batteries par ville."""
        plan = QueryPlan(kind="le_plus_de", target=target, counted=counted, order=a.superlative or "max")
        where, _, _ = self._constraints(a, target, others, plan.notes)
        link = self.link("?element", {target}, "?compte", {counted}, a.cues)
        if not link:
            plan.notes.append(f"Aucune relation entre « {target} » et « {counted} ».")
            return plan
        where += [self.type_of("?compte", counted), link]
        body = "\n  ".join(where)
        order = "DESC" if a.superlative != "min" else "ASC"
        plan.sparql = (f"SELECT ?element (COUNT(DISTINCT ?compte) AS ?nombre)\nWHERE {{\n  {body}\n}}\n"
                       f"GROUP BY ?element\nORDER BY {order}(?nombre)\nLIMIT {a.limit or 1}")
        return plan

    def _describe(self, ind: str) -> QueryPlan:
        t = self.term(ind)
        plan = QueryPlan(kind="decrire", individual=ind)
        plan.sparql = (
            "SELECT ?propriete ?valeur ?sens\nWHERE {\n"
            f"  {{ {t} ?propriete ?valeur . BIND(\"sortant\" AS ?sens) }}\n"
            f"  UNION\n  {{ ?valeur ?propriete {t} . BIND(\"entrant\" AS ?sens) }}\n"
            "  FILTER(?valeur != owl:NamedIndividual)\n}\nORDER BY ?sens ?propriete")
        return plan

    def _value_of(self, ind: str, props: list[str]) -> QueryPlan:
        plan = QueryPlan(kind="valeur", individual=ind, prop=props[0])
        values = " ".join(self.term(p) for p in props)
        plan.sparql = (f"SELECT ?propriete ?valeur\nWHERE {{\n  VALUES ?propriete {{ {values} }}\n"
                       f"  {self.term(ind)} ?propriete ?valeur .\n}}")
        return plan
