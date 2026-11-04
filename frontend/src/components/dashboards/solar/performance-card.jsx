import { useDashboardData } from "@/services/dashboard-api";
import { ArrowDown, ArrowUp, BatteryCharging, SunMedium, Zap, Sun } from "lucide-react";

function SolarPanelIllustration() {
  return (
    <div className="w-full flex items-center justify-center py-2">
      <svg
        viewBox="0 0 320 180"
        className="w-full h-auto max-h-[160px] drop-shadow-md select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="solarGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="30%" stopColor="#2563eb" />
            <stop offset="70%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="aluminumFrame" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="sunGlow" cx="85%" cy="15%" r="60%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="270" cy="30" r="70" fill="url(#sunGlow)" />

        <path d="M 90 145 L 105 165 M 230 145 L 245 165 M 150 145 L 160 165" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
        <path d="M 80 165 L 255 165" stroke="#475569" strokeWidth="4" strokeLinecap="round" />

        <polygon
          points="40,110 130,40 280,45 190,135"
          fill="url(#aluminumFrame)"
          stroke="#334155"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        <polygon
          points="46,108 132,44 274,48 186,131"
          fill="url(#solarGlass)"
          stroke="#1e293b"
          strokeWidth="1.5"
        />

        <line x1="88" y1="76" x2="230" y2="89" stroke="#60a5fa" strokeWidth="0.8" strokeOpacity="0.6" />
        <line x1="110" y1="60" x2="252" y2="68" stroke="#60a5fa" strokeWidth="0.8" strokeOpacity="0.6" />
        <line x1="68" y1="92" x2="208" y2="110" stroke="#60a5fa" strokeWidth="0.8" strokeOpacity="0.6" />

        <line x1="108" y1="42" x2="72" y2="116" stroke="#93c5fd" strokeWidth="1.2" strokeOpacity="0.8" />
        <line x1="178" y1="44" x2="132" y2="124" stroke="#93c5fd" strokeWidth="1.2" strokeOpacity="0.8" />
        <line x1="240" y1="46" x2="170" y2="128" stroke="#93c5fd" strokeWidth="1.2" strokeOpacity="0.8" />

        <polygon
          points="46,108 132,44 200,46 114,110"
          fill="url(#glassReflection)"
        />

        <circle cx="250" cy="35" r="3" fill="#fbbf24" className="animate-pulse" />
        <circle cx="270" cy="50" r="2" fill="#f59e0b" />
        <circle cx="230" cy="25" r="2.5" fill="#fef08a" />
      </svg>
    </div>
  );
}

function PerformanceCard() {
  const { production, stockageTotal, mesuresConsommation } = useDashboardData();

  const solaire = production?.sources?.find((s) => s.source === "Solaire");
  const productionMesuree = solaire?.production_mesuree_kwh ?? 600;
  const puissanceSolaire = solaire?.puissance_totale_kw ?? 100;
  const puissanceTotale = production?.total?.puissance_totale_kw ?? 580;
  const capaciteBatterie = stockageTotal?.capaciteTotale ?? 60;
  const energieStockee = stockageTotal?.energieStockee ?? 27;

  const consoMesuree = mesuresConsommation?.[0]?.valeur ?? 9.0;

  return (
    <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-6 shadow-xs hover:shadow-md transition-all h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-foreground font-bold text-xl tracking-tight">
            Performances du Réseau
          </h3>
          <span className="text-xs text-muted-foreground">Télémétrie en direct des installations</span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Données en direct
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Side: Statistics */}
        <div className="md:col-span-6 space-y-6">
          {/* Subsection 1: Solar Production */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-sm font-semibold text-muted-foreground">
                Production Solaire Mesurée
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-foreground tracking-tight">
                {productionMesuree}
              </span>
              <span className="text-sm text-muted-foreground font-semibold">kWh</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1">
                Crête installée : <strong className="text-primary font-bold">{puissanceSolaire} kWc</strong>
              </span>
              <span className="flex items-center gap-1">
                Total Réseau : <strong className="text-foreground font-bold">{puissanceTotale} kW</strong>
              </span>
            </div>
          </div>

          {/* Subsection 2: Power Usage / Household */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="text-sm font-semibold text-muted-foreground">
                Consommation Nœud Pilote (Djerba)
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight">
                {consoMesuree}
              </span>
              <span className="text-sm text-muted-foreground font-semibold">kWh</span>
            </div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">
              Mesure issue du compteur communicant <strong className="text-foreground">Compteur_04</strong>
            </div>
          </div>
        </div>

        {/* Right Side: Solar Panel Vector Illustration + Capacity Box */}
        <div className="md:col-span-6 flex flex-col items-center justify-center">
          <SolarPanelIllustration />

          {/* Capacity & Yield Stats Box */}
          <div className="w-full bg-muted/60 rounded-xl p-3.5 border border-border flex items-center justify-around mt-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <BatteryCharging className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground block uppercase tracking-wider">
                  Stockage Total
                </span>
                <span className="text-sm font-extrabold text-foreground">
                  {capaciteBatterie} kWh
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-border" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground block uppercase tracking-wider">
                  Énergie Stockée
                </span>
                <span className="text-sm font-extrabold text-foreground">
                  {energieStockee} kWh
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { PerformanceCard, SolarPanelIllustration };
