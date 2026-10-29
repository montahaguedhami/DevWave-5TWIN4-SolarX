# SolarX Backend (FastAPI)

Clean-architecture FastAPI scaffold for the SolarX project. It contains no
business logic: only the project structure, wiring and a working
health-check endpoint. Each team member implements their entity following
the pattern described below.

## Project structure

```
backend/
├── app/
│   ├── main.py                 # App factory, CORS, lifespan
│   ├── core/                   # Config, security helpers
│   ├── db/                     # Engine, session, base, init
│   ├── models/                 # SQLAlchemy ORM models (one per entity)
│   ├── schemas/                # Pydantic schemas (one per entity)
│   ├── repositories/           # Data-access layer (one per entity)
│   ├── services/               # Business logic (one per entity)
│   └── api/
│       ├── deps.py             # Shared dependencies
│       └── v1/
│           ├── router.py       # Aggregate router
│           └── endpoints/      # HTTP handlers (one per entity)
├── alembic/                    # Database migrations
├── tests/                      # Pytest suite
├── requirements.txt
├── .env.example
└── Dockerfile
```

## Démarrage (Run locally)

```bash
cd backend

# 1. Créer l'environnement virtuel
python -m venv .venv

# Activer l'environnement
# Windows (PowerShell)
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Configurer les variables d'environnement
# Windows
copy .env.example .env
# macOS/Linux
# cp .env.example .env

# 4. (Optionnel) Créer les tables via Alembic
# alembic upgrade head

# 5. Lancer le serveur
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs
Health check: http://localhost:8000/api/v1/health

## Adding a new entity

1. Create `app/models/<entity>.py` (SQLAlchemy model extending `Base`).
2. Create `app/schemas/<entity>.py` (`*Base`, `*Create`, `*Update`, `*Read`).
3. Create `app/repositories/<entity>_repository.py` extending `BaseRepository`.
4. Create `app/services/<entity>_service.py`.
5. Create `app/api/v1/endpoints/<entity>.py` with an `APIRouter`.
6. Register the router in `app/api/v1/router.py`.
7. Import the model in `alembic/env.py` (already imports `app.models`).

## Tests

```bash
pytest
```