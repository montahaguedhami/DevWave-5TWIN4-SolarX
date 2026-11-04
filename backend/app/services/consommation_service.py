"""Read-only queries for solarx:MesureConsommation individuals."""

from app.schemas.consommation import ConsumptionMeasurement
from app.services.consommateur_service import CONSUMER_VALUES
from app.services.fuseki import FusekiClient, iri, local_name


class ConsumptionService:
    def __init__(self, fuseki: FusekiClient) -> None:
        self.fuseki = fuseki

    def list_measurements(self, consumer_id: str | None = None) -> list[ConsumptionMeasurement]:
        consumer_filter = f"FILTER(?consumer = {iri(consumer_id)})" if consumer_id else ""
        rows = self.fuseki.select(f"""
            SELECT ?measurement ?consumer ?consumerName ?date ?value ?unit WHERE {{
              ?measurement a solarx:MesureConsommation .
              OPTIONAL {{ ?measurement solarx:concerne ?consumer . ?consumer a ?consumerType . VALUES ?consumerType {{ {CONSUMER_VALUES} }} OPTIONAL {{ ?consumer solarx:nom ?consumerName }} }}
              OPTIONAL {{ ?measurement solarx:dateMesure ?date }}
              OPTIONAL {{ ?measurement solarx:valeur ?value }}
              OPTIONAL {{ ?measurement solarx:unite ?unit }}
              {consumer_filter}
            }} ORDER BY DESC(?date) ?measurement
        """)
        unique = {}
        for row in rows:
            identifier = row["measurement"]
            unique.setdefault(identifier, ConsumptionMeasurement(
                id=local_name(identifier),
                consommateur_id=local_name(row["consumer"]) if row.get("consumer") else None,
                consommateur_nom=row.get("consumerName") or (local_name(row["consumer"]) if row.get("consumer") else None),
                date_mesure=row.get("date"),
                valeur=float(row["value"]) if row.get("value") is not None else None,
                unite=row.get("unit"),
            ))
        return list(unique.values())
