"""Rédaction de la réponse en français à partir des résultats SPARQL (gabarits de phrases)."""
from .generator import QueryPlan
from .schema import OntologySchema
from .text import humanize, plural_word
from .vocabulary import CLASS_LABELS

PROP_LABELS = {
    "puissanceKW": ("puissance", "kW"),
    "puissanceMaxKW": ("puissance maximale", "kW"),
    "capaciteKWh": ("capacité", "kWh"),
    "energieStockeeKWh": ("énergie stockée", "kWh"),
    "tensionKV": ("tension", "kV"),
    "longueurKm": ("longueur", "km"),
    "surfaceM2": ("surface", "m²"),
    "valeur": ("valeur", ""),
    "quantite": ("quantité", ""),
    "etat": ("état", ""),
    "gravite": ("gravité", ""),
    "marque": ("marque", ""),
    "technologie": ("technologie", ""),
    "description": ("description", ""),
    "unite": ("unité", ""),
    "dateInstallation": ("date d'installation", ""),
    "dateEvenement": ("date", ""),
    "dateOccurrence": ("date", ""),
    "dateMesure": ("date de mesure", ""),
}
MAX_NAMES = 8


def class_label(cls: str | None, n: int = 1) -> str:
    if cls is None:
        return "élément" if n <= 1 else "éléments"
    if cls in CLASS_LABELS:
        return CLASS_LABELS[cls][0 if n <= 1 else 1]
    label = humanize(cls)
    return label if n <= 1 else plural_word(label)


def fmt(x) -> str:
    if isinstance(x, float):
        x = round(x, 2)
        if x.is_integer():
            x = int(x)
        else:
            return f"{x:,}".replace(",", " ").replace(".", ",")
    if isinstance(x, int):
        return f"{x:,}".replace(",", " ")
    return str(x)


def with_unit(value, prop: str | None) -> str:
    unit = PROP_LABELS.get(prop or "", ("", ""))[1]
    return f"{fmt(value)} {unit}".strip()


def prop_label(prop: str | None) -> str:
    return PROP_LABELS.get(prop or "", (humanize(prop or "valeur"), ""))[0]


def the(prop: str | None) -> str:
    """Article défini : « la capacité », « l'énergie stockée »."""
    word = prop_label(prop)
    return ("l'" if word[0] in "aeiouéèêh" else "la ") + word


def write_answer(plan: QueryPlan, rows: list[dict], schema: OntologySchema) -> str:
    label = lambda x: class_label(x) if x in schema.classes else schema.label(str(x))
    name = lambda r: str(r.get("nom") or schema.label(str(r.get("element", ""))))
    group_word = lambda: "type" if plan.group == "type" else class_label(plan.group) if plan.group in schema.classes else prop_label(plan.group)
    k = plan.kind
    context = f" ({', '.join(plan.context)})" if plan.context else ""

    if k == "compter":
        if plan.group:
            if not rows:
                return f"Aucun résultat pour les {class_label(plan.target, 2)}."
            parts = [f"{label(r.get('groupe'))} : {fmt(r['nombre'])}" for r in rows[:MAX_NAMES]]
            return f"Nombre de {class_label(plan.target, 2)} par {group_word()} — " + ", ".join(parts) + "."
        n = int(rows[0]["nombre"]) if rows else 0
        if n == 0:
            return f"Aucun résultat : 0 {class_label(plan.target)} ne correspond à la question."
        return f"Il y a {n} {class_label(plan.target, n)}{context}."

    if k in ("somme", "moyenne"):
        key = "total" if k == "somme" else "moyenne"
        word = "totale" if k == "somme" else "moyenne"
        if not rows or rows[0].get(key) is None:
            return f"Aucune valeur de {prop_label(plan.prop)} n'est renseignée pour ces éléments."
        if plan.group:
            parts = [f"{label(r.get('groupe'))} : {with_unit(r[key], plan.prop)}" for r in rows[:MAX_NAMES]]
            return f"{prop_label(plan.prop).capitalize()} {word} des {class_label(plan.target, 2)} par {group_word()} — " + ", ".join(parts) + "."
        r = rows[0]
        n = int(r.get("nombre", 0))
        return (f"{prop_label(plan.prop).capitalize()} {word} des {class_label(plan.target, 2)}{context} : "
                f"{with_unit(r[key], plan.prop)} (calcul sur {n} {class_label(plan.target, n)}).")

    if k in ("maximum", "minimum"):
        if not rows:
            return f"Aucun résultat : {the(plan.prop)} n'est renseignée pour aucun élément."
        adj = "la plus élevée" if k == "maximum" else "la plus faible"
        if len(rows) == 1:
            r = rows[0]
            return f"{name(r)} a {the(plan.prop)} {adj} : {with_unit(r.get(plan.prop), plan.prop)}."
        parts = [f"{name(r)} ({with_unit(r.get(plan.prop), plan.prop)})" for r in rows]
        return f"Les {len(rows)} {class_label(plan.target, 2)} avec {the(plan.prop)} {adj} : " + ", ".join(parts) + "."

    if k == "le_plus_de":
        if not rows:
            return "Aucun résultat."
        r = rows[0]
        return (f"C'est {schema.label(str(r['element']))} qui compte le "
                f"{'moins' if plan.order == 'min' else 'plus'} de {class_label(plan.counted, 2)} "
                f"({fmt(r['nombre'])}).")

    if k == "ou":
        if not rows:
            return f"La localisation de {schema.label(plan.individual)} n'est pas renseignée."
        return f"{schema.label(plan.individual)} se trouve à {', '.join(name(r) for r in rows)}."

    if k == "decrire":
        if not rows:
            return f"Je ne trouve aucune information sur {plan.individual}."
        types = [str(r["valeur"]) for r in rows if r.get("propriete") == "type" and r.get("sens") == "sortant"]
        facts = []
        for r in rows:
            p, v = str(r.get("propriete")), r.get("valeur")
            if r.get("sens") != "sortant" or p in ("type", "nom"):
                continue
            facts.append(f"{prop_label(p)} : {with_unit(v, p)}" if p in PROP_LABELS
                         else f"{humanize(p)} : {schema.label(str(v))}")
        head = schema.label(plan.individual)
        if types:
            head += " (" + ", ".join(label(t) for t in types) + ")"
        return head + (" — " + " ; ".join(facts[:MAX_NAMES]) + "." if facts else ".")

    if k == "valeur":
        if not rows:
            return f"Cette information n'est pas renseignée pour {schema.label(plan.individual)}."
        r = rows[0]
        return f"{prop_label(str(r['propriete'])).capitalize()} de {schema.label(plan.individual)} : {with_unit(r['valeur'], str(r['propriete']))}."

    # lister
    n = len(rows)
    if n == 0:
        return f"Aucun résultat : aucun élément de type « {class_label(plan.target)} » ne correspond à la question."
    names = ", ".join(name(r) for r in rows[:MAX_NAMES])
    more = f" et {n - MAX_NAMES} autre(s)" if n > MAX_NAMES else ""
    return f"J'ai trouvé {n} {class_label(plan.target, n)}{context} : {names}{more}."
