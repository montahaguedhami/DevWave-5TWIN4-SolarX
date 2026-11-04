"""Tests for the Localisation / ConditionMeteo modules (no Fuseki needed)."""

from pathlib import Path

import pytest
from fastapi import HTTPException
from rdflib import Graph, Namespace, RDF, RDFS

from app.services.fuseki import decimal_literal, iri, string_literal
from app.services.meteo_service import evaluer_alertes

SOLARX = Namespace("http://www.semanticweb.org/monta/ontologies/2026/10/SolarX#")
OWL_FILE = Path(__file__).resolve().parents[2] / "database" / "solarx.owl"


def test_alertes_seuils():
    alertes = evaluer_alertes(
        {"Temperature": 41, "VitesseVent": 26, "Ensoleillement": 150}, "Tozeur", "Tozeur", None, True
    )
    assert {a.type for a in alertes} == {"CHALEUR_EXTREME", "VENT_FORT", "FAIBLE_ENSOLEILLEMENT"}
    assert evaluer_alertes({"Temperature": 40, "VitesseVent": 25, "Ensoleillement": 200}, "T", "T", None) == []


def test_pas_alerte_ensoleillement_la_nuit():
    assert evaluer_alertes({"Ensoleillement": 0}, "T", "T", None, est_jour=False) == []


def test_sparql_injection_protection():
    assert string_literal('a" } ; DROP ALL ; #') == '"a\\" } ; DROP ALL ; #"^^xsd:string'
    assert decimal_literal(1e-7) == '"0.0000001"^^xsd:decimal'
    with pytest.raises(HTTPException):
        iri("Tunis> ?p ?o } ; DROP ALL")


def test_ontologie_localisation_meteo():
    g = Graph().parse(OWL_FILE, format="xml")
    villes = set(g.subjects(RDF.type, SOLARX.Ville))
    assert {SOLARX.Tunis, SOLARX.Djerba} <= villes
    for ville in villes:
        assert g.value(ville, SOLARX.latitude) is not None
        assert g.value(ville, SOLARX.longitude) is not None
        assert any((r, RDF.type, SOLARX.Region) in g for r in g.objects(ville, SOLARX.situeDans))

    sous_classes = set(g.subjects(RDFS.subClassOf, SOLARX.ConditionMeteo))
    for classe in (SOLARX.Temperature, SOLARX.Ensoleillement, SOLARX.Precipitation, SOLARX.VitesseVent):
        assert classe in sous_classes
        mesures = list(g.subjects(RDF.type, classe))
        assert mesures, f"aucun individu pour {classe}"
        for m in mesures:
            assert g.value(m, SOLARX.valeur) is not None
            assert g.value(m, SOLARX.unite) is not None
            assert g.value(m, SOLARX.dateMesure) is not None
            assert g.value(m, SOLARX.situeDans) in villes


def test_nouveaux_individus_localisation_meteo():
    graph = Graph().parse(OWL_FILE, format="xml")
    expected_regions = {
        "Beja": SOLARX.Nord_Ouest_Tunisie,
        "Monastir": SOLARX.Centre_Tunisie,
        "Tataouine": SOLARX.Sud_Est_Tunisie,
    }
    units = {
        "Temperature": "°C", "Ensoleillement": "W/m²", "Precipitation": "mm",
        "VitesseVent": "m/s", "Humidite": "%", "CouvertureNuageuse": "%",
    }
    assert len(set(graph.subjects(RDF.type, SOLARX.Ville))) == 13
    assert len(set(graph.subjects(RDF.type, SOLARX.Region))) == 5
    for city, region in expected_regions.items():
        assert (SOLARX[city], SOLARX.situeDans, region) in graph
        assert (region, RDF.type, SOLARX.Region) in graph
        assert -90 <= float(graph.value(SOLARX[city], SOLARX.latitude)) <= 90
        assert -180 <= float(graph.value(SOLARX[city], SOLARX.longitude)) <= 180
        for kind, unit in units.items():
            subject = SOLARX[f"{kind}_{city}_Demo_20261103"]
            assert (subject, RDF.type, SOLARX[kind]) in graph
            assert graph.value(subject, SOLARX.situeDans) == SOLARX[city]
            assert str(graph.value(subject, SOLARX.unite)) == unit
            assert str(graph.value(subject, SOLARX.sourceDonnees)) == "Données de démonstration"
            assert graph.value(subject, SOLARX.valeur).datatype == Namespace("http://www.w3.org/2001/XMLSchema#").decimal
