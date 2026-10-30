"""Application settings loaded from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the SolarX backend.

    Values are read from environment variables (or a ``.env`` file). See
    ``.env.example`` for the full list of supported variables.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "SolarX Backend"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Database
    DATABASE_URL: str = "sqlite:///./solarx.db"

    # Security
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Apache Jena Fuseki (triplestore SPARQL)
    FUSEKI_URL: str = "http://localhost:3030"
    FUSEKI_DATASET: str = "solarx"
    FUSEKI_USER: str | None = None
    FUSEKI_PASSWORD: str | None = None

    # Open-Meteo (https://open-meteo.com/)
    OPEN_METEO_URL: str = "https://api.open-meteo.com/v1/forecast"

    # Nominatim (OpenStreetMap reverse geocoding)
    NOMINATIM_URL: str = "https://nominatim.openstreetmap.org/reverse"
    NOMINATIM_USER_AGENT: str = "SolarX/1.0 (projet academique web semantique)"

    # Google Gemini (assistant météo). Models are tried in order until one answers.
    GEMINI_API_KEY: str | None = None
    GEMINI_API_URL: str = "https://generativelanguage.googleapis.com/v1beta"
    GEMINI_MODELS: list[str] = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"]
    GEMINI_TIMEOUT_SECONDS: float = 25.0


@lru_cache
def get_settings() -> Settings:
    """Return a cached :class:`Settings` instance."""
    return Settings()


settings = get_settings()