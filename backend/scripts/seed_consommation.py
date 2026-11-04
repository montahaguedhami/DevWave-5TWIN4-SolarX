"""Create demo consumption measurements to exercise the Consommateur + Mesure module.

Run from the ``backend`` directory:

    .venv/Scripts/python.exe scripts/seed_consommation.py
    .venv/Scripts/python.exe scripts/seed_consommation.py --reset

The measures are tagged with ``sourceDonnees = "Jeu de démonstration"`` so the
script can be replayed without duplicating data.
"""

import argparse
from datetime import date, timedelta

from app.schemas.consommateur import ConsommateurCreate
from app.schemas.mesure import MesureCreate
from app.services.consommateur_service import ConsommateurService
from app.services.fuseki import FusekiClient, iri
from app.services.localisation_service import _slugify
from app.services.mesure_service import MesureService

SOURCE = "Jeu de démonstration"
DAYS = 12

# (nom, type, surface, ville, consommation de base en kWh, valeur du dernier jour)
DEMO_CONSUMERS = [
    ("Maison Sfax Demo", "Maison", 95, "Sfax", 9.5, 18.0),
    ("Ecole Sousse Demo", "Ecole", 1400, "Sousse", 32.0, 34.0),
    ("Usine Nabeul Demo", "Usine", 3200, "Nabeul", 160.0, 150.0),
]


def ensure_consumer(service: ConsommateurService, fuseki: FusekiClient, nom, type_, surface, ville) -> str:
    consumer_id = _slugify(nom)
    if fuseki.ask(f"ASK {{ {iri(consumer_id)} a ?type }}"):
        return consumer_id
    created = service.create_consommateur(
        ConsommateurCreate(nom=nom, type=type_, surfaceM2=surface, ville=ville)
    )
    return created.id


def daily_value(base: float, index: int) -> float:
    variation = 0.8 + 0.4 * ((index * 37) % 11) / 10
    return round(base * variation, 2)


def reset_demo_measures(mesures: MesureService, consumer_id: str) -> int:
    existing = mesures.list_mesures(concerne=consumer_id, source=SOURCE, limit=200)
    for mesure in existing:
        mesures.delete_mesure(mesure.id)
    return len(existing)


def seed_consumer(mesures: MesureService, consumer_id: str, base: float, last_value: float) -> int:
    start = date.today() - timedelta(days=DAYS - 1)
    created = 0
    for index in range(DAYS):
        value = last_value if index == DAYS - 1 else daily_value(base, index)
        mesures.create_mesure(
            MesureCreate(
                type="MesureConsommation",
                valeur=value,
                unite="kWh",
                dateMesure=(start + timedelta(days=index)).isoformat(),
                concerne=consumer_id,
                sourceDonnees=SOURCE,
            )
        )
        created += 1
    return created


def main() -> None:
    parser = argparse.ArgumentParser(description="Insère des mesures de consommation de démonstration.")
    parser.add_argument("--reset", action="store_true", help="Supprime les mesures de démonstration puis les recrée.")
    args = parser.parse_args()

    fuseki = FusekiClient()
    consommateurs = ConsommateurService(fuseki)
    mesures = MesureService(fuseki)

    for nom, type_, surface, ville, base, last_value in DEMO_CONSUMERS:
        consumer_id = ensure_consumer(consommateurs, fuseki, nom, type_, surface, ville)
        already = mesures.list_mesures(concerne=consumer_id, source=SOURCE, limit=200)
        if already and not args.reset:
            print(f"{consumer_id}: {len(already)} mesures de démonstration déjà présentes (ignoré).")
            continue
        if already:
            removed = reset_demo_measures(mesures, consumer_id)
            print(f"{consumer_id}: {removed} anciennes mesures supprimées.")
        created = seed_consumer(mesures, consumer_id, base, last_value)
        print(f"{consumer_id}: {created} mesures de consommation créées.")


if __name__ == "__main__":
    main()
