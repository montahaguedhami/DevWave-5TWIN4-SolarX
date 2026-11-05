"""Assistant IA : questions -> résultats attendus, sur une copie RDFLib en mémoire de l'ontologie.

Lancer (depuis backend/) :  pytest tests/test_ia.py -q
"""
from pathlib import Path

import pytest
from rdflib import Graph

from app.nlp.pipeline import EXAMPLE_QUESTIONS, SolarXAssistant
from app.services.fuseki import SOLARX_NS
from app.services.typed_sparql import PREFIXES, GraphSparql

OWL_FILE = Path(__file__).resolve().parents[2] / "database" / "solarx.owl"
P2_FILE = OWL_FILE.with_name("p2_stockage_equipement.ttl")


@pytest.fixture(scope="module")
def assistant() -> SolarXAssistant:
    graph = Graph().parse(OWL_FILE, format="xml")
    return SolarXAssistant(GraphSparql(graph).run, PREFIXES, SOLARX_NS)


@pytest.fixture(scope="module")
def assistant_p2() -> SolarXAssistant:
    # comme dans Fuseki après load_ontology et load_p2 : solarx.owl + le fichier du module P2
    graph = Graph().parse(OWL_FILE, format="xml").parse(P2_FILE, format="turtle")
    return SolarXAssistant(GraphSparql(graph).run, PREFIXES, SOLARX_NS)


def elements(r):
    return {row.get("element") for row in r["resultats"]}


@pytest.fixture(autouse=True)
def date_fixe(monkeypatch):
    # l'état d'une ligne dépend de la date du jour : les tests ne doivent pas changer avec le temps
    monkeypatch.setattr("app.nlp.vocabulary.debut_etat_recent", lambda: "2026-10-06")


@pytest.mark.parametrize("question, attendu", [
    ("Quelles batteries sont situées à Tunis ?", {"Batterie_02"}),
    ("Quelle batterie alimente la maison Djerba ?", {"Batterie_01"}),
    ("Quelles installations ont une puissance supérieure à 200 kW ?",
     {"CentraleSolaire_01", "ParcEolien_01", "ParcEolien_Tunis"}),
    ("Quelles lignes desservent l'école Tunis ?", {"LigneBasseTension_01"}),
    ("Quelles lignes haute tension desservent l'usine Tunis ?", {"LigneHauteTension_01"}),
    ("Quel capteur a détecté la panne 01 ?", {"Capteur_01"}),
    ("Quelles conditions météo influencent le parc éolien Tunis ?", {"Vent_Tunis"}),
    ("Quelles mesures concernent la maison Djerba ?", {"Mesure_002"}),
    ("Quelles lignes sont contenues dans le réseau de distribution 01 ?",
     {"LigneBasseTension_01", "LigneMoyenneTension_01", "LigneMoyenneTension_02", "LigneBasseTension_02"}),
    # données de la partie Lignes + Réseaux
    ("Quelles lignes ont une tension supérieure à 100 kV ?", {"LigneHauteTension_02", "LigneHauteTension_03"}),
    ("Quelle est la ligne la plus longue ?", {"LigneHauteTension_02"}),
    ("Quelle est la ligne la plus courte ?", {"LigneBasseTension_02"}),
    ("Quels équipements possède l'hôpital Tunis ?", {"Capteur_01"}),
    ("Quelle source utilise le parc solaire Djerba ?", {"Soleil_01"}),
    ("Où se trouve le parc éolien Tunis ?", {"Tunis"}),
    ("Quelle est la batterie avec la plus grande capacité ?", {"Batterie_02"}),
    ("Quelle ville a le plus de consommateurs ?", {"Tunis"}),
    # « Qui » + verbe + individu : l'élément à l'autre bout de la relation
    ("Qui occupe la maison Djerba ?", {"Particulier_01"}),
    ("Qui occupe l'usine Tunis ?", {"Entreprise_01"}),
    ("Qui alimente la maison Djerba ?", {"Batterie_01"}),
    ("Qui dessert l'usine Tunis ?", {"LigneHauteTension_01"}),
])
def test_listes(assistant, question, attendu):
    r = assistant.ask(question)
    assert elements(r) == attendu, r["sparql"]


@pytest.mark.parametrize("question, nombre", [
    ("Combien de batteries ?", 2),
    ("combien de batteires a tunis", 1),           # faute de frappe corrigée par RapidFuzz
    ("Combien de consommateurs ?", 12),
    ("Nombre de lignes électriques", 7),
    ("combien de lignes hautes tensoin", 3),       # faute + "lignes" et "haute tension" = une seule classe
])
def test_comptage(assistant, question, nombre):
    r = assistant.ask(question)
    assert r["intention"] == "compter"
    assert r["resultats"][0]["nombre"] == nombre, r["sparql"]


@pytest.mark.parametrize("question, attendu", [
    # données Météo + Localisation : l'IA les comprend sans code propre à ces classes
    ("Quelles villes sont dans le sud tunisien ?", {"Djerba", "Gabes", "Gafsa", "Tozeur"}),
    ("Quelles mesures météo influencent le parc solaire Djerba ?", {"Ensoleillement_Djerba", "Temperature_Djerba"}),
])
def test_meteo_localisation(assistant, question, attendu):
    r = assistant.ask(question)
    assert elements(r) == attendu, r["sparql"]


@pytest.mark.parametrize("question, extrait", [
    ("Quelle est la température à Tunis ?", "Temperature_Tunis (24,5 °C)"),      # valeur + unité de la mesure
    ("Quelle est l'humidité à Tunis ?", "(62 %)"),
    ("Quelles mesures concernent la maison Djerba ?", "Mesure_002 (9 kWh)"),     # unité lue dans :unite
    ("Quelle est la température moyenne ?", "°C"),
    ("Quelle est la latitude de Tunis ?", "36,81°"),
    ("Quelle est la source des données de Vent_Tunis ?", "Capteur_01"),
    ("Quelle est la provenance de Vent_Tunis ?", "Capteur_01"),
    ("Où se trouve Sfax ?", "dans la région Centre tunisien"),
    ("Combien de villes par région ?", "Sud tunisien : 4"),
    # aucune mesure enregistrée : la réponse nomme la ville et explique comment l'obtenir
    ("quel est la temperature a kairouan", "pas de température pour Kairouan"),
    ("Quelle est l'humidité à Gafsa ?", "pas d'humidité pour Gafsa. La page Météo"),
])
def test_reponses_meteo_localisation(assistant, question, extrait):
    r = assistant.ask(question)
    assert extrait in r["reponse"], r["reponse"]


def test_somme(assistant):
    r = assistant.ask("Quelle est la capacité totale de stockage ?")
    assert r["intention"] == "somme"
    assert r["resultats"][0]["total"] == pytest.approx(60)


def test_longueur_totale_des_lignes(assistant):
    r = assistant.ask("Quelle est la longueur totale des lignes ?")
    assert r["intention"] == "somme"
    assert r["resultats"][0]["total"] == pytest.approx(2.5 + 12 + 35 + 150 + 85 + 8 + 1.2)


def test_moyenne(assistant):
    r = assistant.ask("Puissance moyenne des installations")
    assert r["intention"] == "moyenne"
    assert r["resultats"][0]["moyenne"] == pytest.approx(1087.5)


def test_regroupement_par_type(assistant):
    r = assistant.ask("Combien de consommateurs y a-t-il par type ?")
    assert {row["groupe"]: row["nombre"] for row in r["resultats"]} == {
        "Ecole": 3, "Maison": 3, "Entreprise": 1, "Hopital": 1, "Institution": 1, "Particulier": 1, "Usine": 2}


def test_regroupement_type_le_plus_precis(assistant):
    # MesureConsommation_01 est typé Mesure ET MesureConsommation : compté une seule fois
    r = assistant.ask("Combien de mesures par type ?")
    assert {row["groupe"]: row["nombre"] for row in r["resultats"]} == {
        "MesureConsommation": 38, "MesureProduction": 4, "MesureStockage": 1}


@pytest.mark.parametrize("question, valeur", [
    ("Quelle est la tension de la ligne haute tension 01 ?", 90),
    ("Surface de la maison Djerba", 120),
])
def test_valeur_d_un_individu(assistant, question, valeur):
    r = assistant.ask(question)
    assert r["intention"] == "valeur"
    assert r["resultats"][0]["valeur"] == valeur


def test_description(assistant):
    r = assistant.ask("Donne-moi des informations sur le parc solaire Djerba")
    assert r["intention"] == "decrire"
    assert {"propriete": "situeDans", "valeur": "Djerba", "sens": "sortant"} in r["resultats"]


@pytest.mark.parametrize("question, inconnu", [
    ("Quels onduleurs de marque Huawei ?", "Huawei"),     # ni la valeur ni la propriété n'existent
    ("Où se trouve la STEP Sidi Salem ?", "Sidi Salem"),
    ("Quel est l'état de l'onduleur 01 ?", "etat"),
])
def test_mot_absent_de_l_ontologie(assistant, question, inconnu):
    r = assistant.ask(question)
    assert r["sparql"] is None
    assert inconnu in r["reponse"]


def test_ancien_namespace_ignore(assistant):
    # le fichier .ttl de P2 utilise encore l'ancien namespace : ses individus ne doivent pas apparaître
    assert "Batterie_03" not in assistant.schema.individuals


def test_question_hors_sujet(assistant):
    r = assistant.ask("Bonjour, ça va ?")
    assert r["sparql"] is None
    assert r["suggestions"]


def test_exemples_executables(assistant):
    for q in EXAMPLE_QUESTIONS:
        r = assistant.ask(q)
        assert r["sparql"] and r["resultats"], q


# --- avec les données du module P2 (Stockage + Équipement) -------------------

@pytest.mark.parametrize("question, attendu", [
    ("Quels stockages hydrauliques ?", {"StockageHydraulique_01", "StockageHydraulique_02", "StockageHydraulique_03"}),
    ("Quelles batteries ont une capacité supérieure à 1000 kWh ?", {"Batterie_03", "Batterie_04", "Batterie_06"}),
    ("Quelles batteries installées en 2023 ?", {"Batterie_04", "Batterie_07"}),
    # classes définies par des axiomes : Fuseki n'a pas de raisonneur, la définition devient du SPARQL
    ("Quels grands stockages ?", {"StockageHydraulique_01", "StockageHydraulique_02", "StockageHydraulique_03"}),
    ("Quelles batteries domestiques ?", {"Batterie_01", "Batterie_07"}),
])
def test_questions_module_p2(assistant_p2, question, attendu):
    assert elements(assistant_p2.ask(question)) == attendu


@pytest.mark.parametrize("question, extrait", [
    ("Combien de grands stockages ?", "3 grands stockages"),
    ("Quelle est la marque de l'onduleur 03 ?", "Huawei"),
    ("Quelle est la marque de l'onduleur 03 ?", "Marque d'Onduleur"),
    ("Quelle est la date d'installation de la batterie 04 ?", "14 février 2023"),
    ("Combien d'équipements par type ?", "Nombre d'équipements par type"),
    ("Quelle batterie alimente l'hôpital Tunis ?", "(Hôpital Tunis)"),
    ("Quels incidents affectent la ligne haute tension 01 ?", "(Ligne HT 90 kV"),
])
def test_reponses_module_p2(assistant_p2, question, extrait):
    assert extrait in assistant_p2.ask(question)["reponse"]


# --- données des parties Maintenance, Incident et Localisation ----------------
# Ces parties ajoutent souvent des individus : on vérifie qu'un élément attendu est présent

@pytest.mark.parametrize("question, attendu", [
    ("Quelles maintenances ?", {"Maintenance_01", "Inspection_01"}),
    ("Quelles maintenances ont eu lieu en octobre 2026 ?", {"Maintenance_01"}),
    ("Quelle maintenance porte sur l'onduleur 01 ?", {"Maintenance_01"}),
    ("Quelles pannes ont eu lieu après septembre 2026 ?", {"Panne_01"}),
    ("Quelles pannes ont une gravité élevée ?", {"Panne_01"}),
    ("Quelles couvertures nuageuses ?", {"CouvertureNuageuse_Bizerte"}),
    ("Quels équipements sont en panne ?", {"Capteur_05", "Compteur_04"}),
    ("Quels capteurs sont en maintenance ?", {"Capteur_04"}),
])
def test_contient(assistant_p2, question, attendu):
    assert attendu <= elements(assistant_p2.ask(question))


@pytest.mark.parametrize("question, attendu", [
    ("Quelle est la dernière panne ?", ["Panne_01"]),
    ("Dernière panne ?", ["Panne_01"]),
    ("Quelle est la panne la plus récente ?", ["Panne_01"]),
    ("Quelle est la dernière panne de la ligne haute tension 01 ?", ["Panne_01"]),
    ("Quel est le dernier incident sur la ligne moyenne tension 01 ?", ["Surcharge_03"]),
])
def test_le_plus_recent(assistant_p2, question, attendu):
    assert [r["element"] for r in assistant_p2.ask(question)["resultats"]] == attendu


def test_les_trois_dernieres_et_la_plus_ancienne(assistant_p2):
    trois = assistant_p2.ask("Quelles sont les 3 dernières pannes ?")["resultats"]
    dates = [r["dateOccurrence"] for r in trois]
    assert len(trois) == 3 and dates == sorted(dates, reverse=True)
    ancienne = assistant_p2.ask("Quelle est la panne la plus ancienne ?")["resultats"][0]["dateOccurrence"]
    assert ancienne < dates[-1]


def test_combien_ne_trie_pas_par_date(assistant_p2):
    assert "Il y a" in assistant_p2.ask("Combien de dernières pannes ?")["reponse"]


def test_le_mois_dernier_nest_pas_un_tri_par_date(assistant_p2):
    assert len(assistant_p2.ask("Quelles pannes du mois dernier ?")["resultats"]) > 1


def test_etat_des_lignes_comme_la_page(assistant_p2):
    # même règle que LignesService : seuls les incidents des 30 derniers jours comptent
    assert elements(assistant_p2.ask("Quelles lignes sont en panne ?")) == {"LigneHauteTension_01"}
    assert "LigneMoyenneTension_01" in elements(assistant_p2.ask("Quelles lignes sont en alerte ?"))


def test_tous_les_individus_par_leur_nom(assistant_p2):
    # un nom peut être long (« Taux de distorsion harmonique THD supérieur au seuil »)
    schema = assistant_p2.schema if assistant_p2.schema else assistant_p2.reload() and assistant_p2.schema
    longs = {i: n for i, n in schema.names.items() if len(n.split()) > 6}
    assert longs
    for individu, nom in longs.items():
        assert assistant_p2.ask(f"Donne-moi des informations sur {nom}")["resultats"], individu
