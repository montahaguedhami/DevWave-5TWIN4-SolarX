"""Schema for reading energy consumption measurements."""

from datetime import datetime

from pydantic import BaseModel


class ConsumptionMeasurement(BaseModel):
    id: str
    consommateur_id: str | None = None
    consommateur_nom: str | None = None
    date_mesure: datetime | None = None
    valeur: float | None = None
    unite: str | None = None
