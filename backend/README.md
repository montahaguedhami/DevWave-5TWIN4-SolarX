# SolarX — Backend (FastAPI + SPARQL)

Chaîne : `solarx.owl` → **Fuseki** (dataset `solarx`) → **FastAPI** → **React**

## Lancer

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows : venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # puis adapter SOLARX_NS à l'IRI de l'ontologie
uvicorn main:app --reload --port 8000
```

Documentation interactive : http://localhost:8000/docs

## Fuseki

1. Lancer Fuseki → http://localhost:3030
2. Dataset `solarx` (TDB2)
3. *add data* → charger `ontology/solarx.owl` **et** `ontology/p2_stockage_equipement.ttl` (Fuseki ne lit pas le format `.ofn` : dans Protégé, *Save as → RDF/XML*)

⚠️ Le préfixe `:` du fichier `.ttl` et `SOLARX_NS` dans `.env` doivent être **identiques à l'IRI de l'ontologie** (Protégé → *Active ontology* → *Ontology IRI* + `#`), sinon les instances ne seront pas rattachées aux classes.

## P2 — Stockage + Équipement

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/stockage` | Batteries + stockages hydrauliques (`?type=Batterie` ou `StockageHydraulique`) |
| GET | `/api/stockage/capacite-totale` | **Requête d'agrégation** : capacité totale, énergie stockée, taux de remplissage, par type |
| GET | `/api/stockage/{id}` | Détail d'un stockage + mesures qui le concernent |
| GET | `/api/equipements` | Capteurs, compteurs intelligents, onduleurs (`?type=…&etat=Fonctionnel\|Maintenance\|En panne`) |
| GET | `/api/equipements/stats` | Nombre d'équipements par état et par type |

Propriétés utilisées : `nom`, `capacite` (kWh), `niveauCharge` (%), `puissanceMax` (kW), `technologie`, `etat`, `marque`, `dateInstallation`, et les relations `situeDans`, `possede`, `produitMesure`, `alimenteStockage`, `concerne`.

Les autres membres ajoutent leur routeur dans `routers/` et l'incluent dans `main.py` (`app.include_router(...)`), en réutilisant `run_query()` de `sparql_client.py`.
