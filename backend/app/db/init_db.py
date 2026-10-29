"""Database initialisation helpers (create tables, seed data)."""

from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import engine


def init_db() -> None:
    """Create all tables declared on :class:`Base` metadata."""
    Base.metadata.create_all(bind=engine)


def seed_db(db: Session) -> None:  # noqa: ARG001
    """Seed the database with initial data. Implement per project needs."""
    pass