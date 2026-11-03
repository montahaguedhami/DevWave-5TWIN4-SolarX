"""Production queries, aggregate statistics, and measurement CRUD."""

from uuid import uuid4

from fastapi import HTTPException, status

from app.schemas.production import (
    InstallationType,
    ProductionMeasurement,
    ProductionMeasurementWrite,
    ProductionInstallation,
    ProductionStats,
    ProductionStatsByType,
    ProductionTotals,
    SourceStat,
    SourceType,
    TypeStat,
)
from app.services.fuseki import FusekiClient, decimal_literal, datetime_literal, iri, local_name, string_literal
from app.services.installation_service import InstallationService

SOURCE_TYPES = tuple(item.value for item in SourceType)
INSTALLATION_TYPES = tuple(item.value for item in InstallationType)


class ProductionService:
    def __init__(self, fuseki: FusekiClient) -> None:
        self.fuseki = fuseki
        self.installations = InstallationService(fuseki)

    def list_installations(self, type: str | None = None,
                           source: str | None = None) -> list[ProductionInstallation]:
        return self.installations.list_installations(type_name=type, source_type=source)

    def list_measurements(self) -> list[ProductionMeasurement]:
        rows = self._measurement_rows()
        unique = {}
        for row in rows:
            unique.setdefault(row["measurement"], self._convert_measurement(row))
        return list(unique.values())

    def get_measurement(self, measurement_id: str) -> ProductionMeasurement:
        rows = self._measurement_rows(measurement_id)
        if not rows:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Mesure de production introuvable : {measurement_id}")
        return self._convert_measurement(rows[0])

    def _measurement_rows(self, measurement_id: str | None = None) -> list[dict[str, str]]:
        filter_clause = f"FILTER(?measurement = {iri(measurement_id)})" if measurement_id else ""
        return self.fuseki.select(f"""
            SELECT ?measurement ?installation ?name ?date ?value ?unit WHERE {{
              ?measurement a solarx:MesureProduction .
              OPTIONAL {{ ?measurement solarx:concerne ?installation . OPTIONAL {{ ?installation solarx:nom ?name }} }}
              OPTIONAL {{ ?measurement solarx:dateMesure ?date }}
              OPTIONAL {{ ?measurement solarx:valeur ?value }}
              OPTIONAL {{ ?measurement solarx:unite ?unit }}
              {filter_clause}
            }} ORDER BY DESC(?date) ?measurement
        """)

    @staticmethod
    def _convert_measurement(row: dict[str, str]) -> ProductionMeasurement:
        return ProductionMeasurement(
            id=local_name(row["measurement"]),
            installation_id=local_name(row["installation"]) if row.get("installation") else None,
            installation_nom=row.get("name") or (local_name(row["installation"]) if row.get("installation") else None),
            date_mesure=row.get("date"),
            valeur=float(row["value"]) if row.get("value") is not None else None,
            unite=row.get("unit"),
        )

    def _ensure_installation(self, installation_id: str) -> str:
        installation = iri(installation_id)
        installation_values = " ".join(f"solarx:{item}" for item in INSTALLATION_TYPES)
        if not self.fuseki.ask(f"ASK {{ {installation} a ?type . VALUES ?type {{ {installation_values} }} }}"):
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Installation introuvable : {installation_id}")
        return installation

    def _insert_measurement_fields(self, measurement: str, data: ProductionMeasurementWrite) -> None:
        installation = self._ensure_installation(data.installation_id)
        self.fuseki.update(f"""
            INSERT DATA {{
              {measurement} solarx:concerne {installation} ;
                solarx:dateMesure {datetime_literal(data.date_mesure)} ;
                solarx:valeur {decimal_literal(data.valeur)} ;
                solarx:unite {string_literal(data.unite)} .
            }}
        """)

    def create_measurement(self, data: ProductionMeasurementWrite) -> ProductionMeasurement:
        self._ensure_installation(data.installation_id)
        measurement_id = f"MesureProd_{uuid4().hex}"
        measurement = iri(measurement_id)
        self.fuseki.update(f"INSERT DATA {{ {measurement} a owl:NamedIndividual, solarx:Mesure, solarx:MesureProduction . }}")
        self._insert_measurement_fields(measurement, data)
        return self.get_measurement(measurement_id)

    def update_measurement(self, measurement_id: str, data: ProductionMeasurementWrite) -> ProductionMeasurement:
        measurement = iri(measurement_id)
        self.get_measurement(measurement_id)
        self._ensure_installation(data.installation_id)
        for predicate in ("concerne", "dateMesure", "valeur", "unite"):
            self.fuseki.update(f"DELETE WHERE {{ {measurement} solarx:{predicate} ?value }}")
        self._insert_measurement_fields(measurement, data)
        return self.get_measurement(measurement_id)

    def delete_measurement(self, measurement_id: str) -> None:
        measurement = iri(measurement_id)
        self.get_measurement(measurement_id)
        refs = self.fuseki.select(f"SELECT DISTINCT ?s WHERE {{ ?s ?p {measurement} . FILTER(?s != {measurement}) }} ORDER BY ?s")
        if refs:
            raise HTTPException(status.HTTP_409_CONFLICT, {
                "message": "Cette mesure est référencée par d'autres éléments de l’ontologie.",
                "dependances": [local_name(row["s"]) for row in refs],
            })
        self.fuseki.update(f"DELETE WHERE {{ {measurement} ?p ?o }}")

    def _production_mesuree(self) -> dict[str, float]:
        rows = self.fuseki.select(
            """
            SELECT ?installation (SUM(?value) AS ?production) WHERE {
              ?measurement a solarx:MesureProduction ;
                solarx:concerne ?installation ;
                solarx:valeur ?value ;
                solarx:unite ?unit .
              FILTER(LCASE(STR(?unit)) = "kwh")
            } GROUP BY ?installation
            """
        )
        return {local_name(row["installation"]): float(row["production"]) for row in rows}

    @staticmethod
    def _totals(installations: list[ProductionInstallation], measured: dict[str, float]) -> ProductionTotals:
        power = sum(item.puissance_kw or 0 for item in installations)
        production = sum(measured.get(item.id, 0) for item in installations)
        return ProductionTotals(
            nombre_installations=len(installations),
            puissance_totale_kw=power,
            production_mesuree_kwh=production,
            part_pct=100.0 if power > 0 else 0.0,
        )

    @staticmethod
    def _part(power: float, total_power: float) -> float:
        return round(power / total_power * 100, 2) if total_power else 0.0

    def stats(self) -> ProductionStats:
        installations = self.installations.list_installations()
        measured = self._production_mesuree()
        total = self._totals(installations, measured)
        groups = {type_name: [] for type_name in SOURCE_TYPES}
        for item in installations:
            groups[item.source.type.value].append(item)
        sources = []
        for source_type in SOURCE_TYPES:
            group = groups[source_type]
            group_total = self._totals(group, measured)
            sources.append(SourceStat(
                source=source_type,
                nombre_installations=group_total.nombre_installations,
                puissance_totale_kw=group_total.puissance_totale_kw,
                production_mesuree_kwh=group_total.production_mesuree_kwh,
                part_pct=self._part(group_total.puissance_totale_kw, total.puissance_totale_kw),
            ))
        return ProductionStats(sources=sources, total=total)

    def stats_par_type(self) -> ProductionStatsByType:
        installations = self.installations.list_installations()
        measured = self._production_mesuree()
        total = self._totals(installations, measured)
        groups = {type_name: [] for type_name in INSTALLATION_TYPES}
        for item in installations:
            groups[item.type.value].append(item)
        types = []
        for installation_type in INSTALLATION_TYPES:
            group_total = self._totals(groups[installation_type], measured)
            types.append(TypeStat(
                type=installation_type,
                nombre_installations=group_total.nombre_installations,
                puissance_totale_kw=group_total.puissance_totale_kw,
                production_mesuree_kwh=group_total.production_mesuree_kwh,
                part_pct=self._part(group_total.puissance_totale_kw, total.puissance_totale_kw),
            ))
        return ProductionStatsByType(types=types, total=total)
