"""Tests for the Consommateur / Mesure modules."""

from pydantic import ValidationError
import pytest

from app.schemas.consommateur import TYPES_CONSOMMATEUR, ConsommateurCreate
from app.schemas.mesure import TYPES_MESURE, MesureCreate
from app.services.fuseki import iri


def test_types_consommateur_valides():
    assert "Maison" in TYPES_CONSOMMATEUR
    assert "Hopital" in TYPES_CONSOMMATEUR


def test_types_mesure_valides():
    assert "MesureConsommation" in TYPES_MESURE


def test_consommateur_create_valide():
    c = ConsommateurCreate(nom="Maison Test", type="Maison", surfaceM2=120, ville="Tunis")
    assert c.nom == "Maison Test"


def test_consommateur_type_invalide():
    with pytest.raises(ValidationError):
        ConsommateurCreate(nom="X", type="Inconnu", ville="Tunis")


def test_mesure_create_valide():
    m = MesureCreate(type="MesureConsommation", valeur=9.5, unite="kWh", dateMesure="2026-09-30", concerne="Maison_Djerba")
    assert m.valeur == 9.5


def test_mesure_type_invalide():
    with pytest.raises(ValidationError):
        MesureCreate(type="Inconnu", valeur=1, unite="kWh", dateMesure="2026-09-30", concerne="Maison_Djerba")


def test_iri_injection():
    with pytest.raises(Exception):
        iri("Tunis> ?p ?o } ; DROP ALL")