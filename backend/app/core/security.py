"""Security helpers (password hashing, JWT tokens).

Implementation is intentionally left to the team. The helpers below expose a
stable interface so other modules can depend on them without knowing the
concrete algorithm.
"""

from typing import Any


def hash_password(password: str) -> str:
    """Hash a plain-text password."""
    raise NotImplementedError("Implement password hashing (e.g. passlib/bcrypt).")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its hash."""
    raise NotImplementedError("Implement password verification.")


def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    """Create a signed JWT access token for ``subject``."""
    raise NotImplementedError("Implement JWT creation (e.g. python-jose).")


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT access token."""
    raise NotImplementedError("Implement JWT decoding.")