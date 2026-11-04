import { RadialGauge } from "./radial-gauge";
import { Zap, ShieldCheck, BatteryCharging, Sun, AlertTriangle } from "lucide-react";
import { useDashboardData } from "@/services/dashboard-api";

function KpiCards() {
  const { production, stockageTotal, equipements, incidentsStats } = useDashboardData();

  // Extraction des données réelles
  const solaire = production?.sources?.find((s) => s.source === "Solaire");
  const puissanceSolaireKw = solaire?.puissance_totale_kw ?? 100;
  const productionMesureeKwh = solaire?.production_mesuree_kwh ?? 600;
  const nbInstallationsSolaire = solaire?.nombre_installations ?? 2;

  const puissanceTotaleKw = production?.total?.puissance_totale_kw ?? 580;
  const nbInstallationsTotales = production?.total?.nombre_installations ?? 5;

  const tauxChargeBatterie = Math.round(stockageTotal?.tauxRemplissage ?? 45);
  const energieStockeeKwh = stockageTotal?.energieStockee ?? 27;
  const capaciteBatterieKwh = stockageTotal?.capaciteTotale ?? 60;

  const totalEquipements = equipements?.total ?? 3;
  const fonctionnels = equipements?.parEtat?.Fonctionnel ?? 2;
  const enMaintenance = equipements?.parEtat?.Maintenance ?? 1;
  const dispoPct = totalEquipements > 0 ? Math.round((fonctionnels / totalEquipements) * 100) : 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Card 1: Production Solaire Réelle */}
      <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-foreground dark:text-foreground font-bold text-lg tracking-tight">
              Production Solaire
            </h3>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Sun className="w-4 h-4" />
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold mb-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {puissanceSolaireKw} kWc crête
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" /> {nbInstallationsSolaire} parcs
            </span>
          </div>

          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-extrabold text-foreground dark:text-foreground block tracking-tight">
                {productionMesureeKwh} <span className="text-sm font-semibold text-muted-foreground">kWh</span>
              </span>
              <span className="text-xs text-emerald-600 font-semibold mt-1 block">
                Mesure certifiée Djerba
              </span>
            </div>

            <RadialGauge value={85} statusText="Optimal" size={120} />
          </div>
        </div>
      </div>

      {/* Card 2: Puissance Totale Réseau */}
      <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-foreground dark:text-foreground font-bold text-lg tracking-tight">
              Capacité Globale
            </h3>
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Zap className="w-4 h-4" />
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold mb-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {nbInstallationsTotales} unités actives
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> Mix solaire/éolien
            </span>
          </div>

          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-extrabold text-foreground dark:text-foreground block tracking-tight">
                {puissanceTotaleKw} <span className="text-sm font-semibold text-muted-foreground">kW</span>
              </span>
              <span className="text-xs text-primary font-semibold mt-1 block">
                Réseau interconnecté
              </span>
            </div>

            <RadialGauge value={75} statusText="Actif" size={120} />
          </div>
        </div>
      </div>

      {/* Card 3: Réserve de Stockage Batterie */}
      <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-foreground dark:text-foreground font-bold text-lg tracking-tight">
              Réserve Stockage
            </h3>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <BatteryCharging className="w-4 h-4" />
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold mb-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {energieStockeeKwh} / {capaciteBatterieKwh} kWh
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" /> 2 batteries
            </span>
          </div>

          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-extrabold text-foreground dark:text-foreground block tracking-tight">
                {tauxChargeBatterie}%
              </span>
              <span className="text-xs text-muted-foreground font-semibold mt-1 block">
                SoC moyen des batteries
              </span>
            </div>

            <RadialGauge value={tauxChargeBatterie} statusText={tauxChargeBatterie > 50 ? "Haut" : "Nominal"} size={120} />
          </div>
        </div>
      </div>

      {/* Card 4: Disponibilité du Parc & Incidents */}
      <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-foreground dark:text-foreground font-bold text-lg tracking-tight">
              Santé Équipements
            </h3>
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground dark:text-foreground tracking-tight">
                {dispoPct}%
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                ({fonctionnels}/{totalEquipements} actifs)
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> {enMaintenance} en maintenance
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {incidentsStats?.total ?? 13} incidents suivis
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Critiques : <strong className="text-rose-500">{incidentsStats?.parGravite?.Critique ?? 2}</strong></span>
          <span className="text-primary font-semibold">Télémétrie en direct</span>
        </div>
      </div>
    </div>
  );
}

export { KpiCards };
