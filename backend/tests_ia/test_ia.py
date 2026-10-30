"""Questions -> résultats attendus, sur les données réelles de ontology/ (solarx.owl + *.ttl).

Lancer :  cd backend && pytest tests_ia -q
"""
import pytest


def elements(r):
    return {row.get("element") for row in r["resultats"]}


@pytest.mark.parametrize("question, attendu", [
    ("Quelles batteries sont situées à Tunis ?", {"Batterie_02"}),
    ("Quelle batterie alimente la maison Djerba ?", {"Batterie_01"}),
    ("Quelles installations ont une puissance supérieure à 200 kW ?", {"ParcEolien_Tunis"}),
    ("Quelles lignes desservent l'école Tunis ?", {"LigneBasseTension_01"}),
    ("Quelles lignes haute tension desservent l'usine Tunis ?", {"LigneHauteTension_01"}),
    ("Quel capteur a détecté la panne 01 ?", {"Capteur_01"}),
    ("Quelles conditions météo influencent le parc éolien Tunis ?", {"Vent_Tunis"}),
    ("Quelles mesures concernent la maison Djerba ?", {"Mesure_002"}),
    ("Quelles lignes sont contenues dans le réseau de distribution 01 ?",
     {"LigneBasseTension_01", "LigneMoyenneTension_01"}),
    ("Quelles maintenances ont eu lieu en octobre 2026 ?", {"Maintenance_01"}),
    ("Quelles pannes ont eu lieu après septembre 2026 ?", {"Panne_01"}),
    ("Quelles pannes ont une gravité élevée ?", {"Panne_01"}),
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
    ("Combien de consommateurs ?", 9),
    ("Nombre de lignes électriques", 4),
])
def test_comptage(assistant, question, nombre):
    r = assistant.ask(question)
    assert r["intention"] == "compter"
    assert r["resultats"][0]["nombre"] == nombre, r["sparql"]


def test_somme(assistant):
    r = assistant.ask("Quelle est la capacité totale de stockage ?")
    assert r["intention"] == "somme"
    assert r["resultats"][0]["total"] == pytest.approx(60)


def test_moyenne(assistant):
    r = assistant.ask("Puissance moyenne des installations")
    assert r["intention"] == "moyenne"
    assert r["resultats"][0]["moyenne"] == pytest.approx(175)


def test_regroupement_par_type(assistant):
    r = assistant.ask("Combien de consommateurs y a-t-il par type ?")
    assert {row["groupe"]: row["nombre"] for row in r["resultats"]} == {
        "Ecole": 2, "Maison": 2, "Entreprise": 1, "Hopital": 1, "Institution": 1, "Particulier": 1, "Usine": 1}


def test_regroupement_type_le_plus_precis(assistant):
    # MesureConsommation_01 est typé Mesure ET MesureConsommation : compté une seule fois
    r = assistant.ask("Combien de mesures par type ?")
    assert {row["groupe"]: row["nombre"] for row in r["resultats"]} == {
        "MesureConsommation": 2, "MesureProduction": 2, "MesureStockage": 1}


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
    from nlp.pipeline import EXAMPLE_QUESTIONS
    for q in EXAMPLE_QUESTIONS:
        r = assistant.ask(q)
        assert r["sparql"] and r["resultats"], q
