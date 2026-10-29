"""Shared FastAPI dependencies."""

from sqlalchemy.orm import Session

from app.db.session import get_db


# Re-export for convenience.
__all__ = ["get_db", "Session"]