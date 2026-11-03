# Module P2 — Stockage + Équipement

## Fichiers ajoutés (aucun fichier des autres modules n'est modifié)
- `database/p2_stockage_equipement.ttl` : individus Batterie / StockageHydraulique / Capteur /
  CompteurIntelligent / Onduleur, 5 data properties (puissanceMaxKW, technologie, marque,
  dateInstallation, etat) et les axiomes OWL (classes disjointes, propriétés fonctionnelles,
  cardinalité, classes définies GrandStockage, BatterieDomestique, EquipementEnPanne).
- `backend/app/services/stockage_service.py`, `backend/app/services/equipement_service.py`
- `backend/app/api/v1/endpoints/stockage.py`, `backend/app/api/v1/endpoints/equipements.py`
- `backend/scripts/load_p2.py` — charge le .ttl dans Fuseki
- `backend/tests/test_stockage_equipement.py`
- `frontend/src/pages/stockage/`, `frontend/src/pages/equipements/`,
  `frontend/src/components/stockage/`, `frontend/src/services/stockage-api.js`

## Lignes ajoutées dans les fichiers partagés (enregistrement uniquement)
- `backend/app/api/v1/router.py` : 1 import + 2 `include_router`
- `frontend/src/App.jsx` : 2 imports + 2 routes
- `frontend/src/{pages,components}/layout/vertical/sidebar/sidebaritems.js` : 2 entrées de menu

## Lancer
```bash
cd backend
python -m scripts.load_ontology   # solarx.owl (équipe)
python -m scripts.load_p2         # module P2
uvicorn app.main:app --reload
```

## API (préfixe /api/v1)
| Méthode | Route | SPARQL |
|---|---|---|
| GET | /stockage?type=&q=&etat=&localisation=&capacite_min=&capacite_max=&niveau_min=&niveau_max= | SELECT + OPTIONAL + FILTER (CONTAINS, EXISTS, comparaisons) |
| GET | /stockage/capacite-totale | SUM / COUNT / GROUP BY |
| GET | /stockage/{id} | détail + mesures |
| POST | /stockage | INSERT DATA |
| PUT | /stockage/{id} | DELETE WHERE + INSERT DATA |
| DELETE | /stockage/{id} | DELETE WHERE |
| GET | /equipements?type=&etat=&q=&marque=&proprietaire=&localisation= | SELECT + BIND(COALESCE/IF/EXISTS) pour l'état + FILTER |
| GET | /equipements/stats | COUNT + GROUP BY (sous-requête) |
| POST / PUT / DELETE | /equipements[/{id}] | INSERT DATA / DELETE WHERE |

Ajouter `&afficher_sparql=true` à une liste renvoie aussi la requête SPARQL exécutée (avec ses PREFIX,
copiable dans Fuseki). Dans le site : bouton « Voir la requête SPARQL exécutée ».

## Remarque pour l'équipe
`backend/app/services/assistant_meteo_service.py` (assistant météo) appelle l'API Gemini. La consigne
interdit les API de LLM pour la partie NLP : ne pas présenter cet assistant comme le module NLP.
Le module NLP → SPARQL (`app/nlp/`, endpoint `/ia`) n'utilise aucun LLM.

## NLP
L'assistant de l'équipe (`/api/v1/ia/question`, spaCy + RapidFuzz + sentence-transformers) lit
le schéma dans Fuseki : il comprend le module P2 dès que le .ttl est chargé. Exemples testés :
« Combien de batteries y a-t-il ? », « Quelle est la capacité totale des batteries ? »,
« Quelle est la plus grande batterie ? », « Quels équipements sont en panne ? »,
« Quels onduleurs sont de marque Huawei ? », « Quel est l'onduleur le plus puissant ? »,
« Quels équipements possède l'hôpital Tunis ? », « Quelle installation alimente la batterie 03 ? »
