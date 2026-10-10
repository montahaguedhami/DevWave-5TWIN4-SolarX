import { PERFORMANCE_DATA } from "@/data/dashboard";
import { ArrowDown, ArrowUp, BatteryCharging, SunMedium } from "lucide-react";
function SolarPanelIllustration() {
  return <div className="w-full flex items-center justify-center py-2">
      <svg
    viewBox="0 0 320 180"
    className="w-full h-auto max-h-[160px] drop-shadow-md select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
        <defs>
          {
    /* Blue Solar Glass Gradient */
  }
          <linearGradient id="solarGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="30%" stopColor="#2563eb" />
            <stop offset="70%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {
    /* Metal Aluminum Frame */
  }
          <linearGradient id="aluminumFrame" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {
    /* Glass Specular Glare */
  }
          <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {
    /* Sun Ray Glow */
  }
          <radialGradient id="sunGlow" cx="85%" cy="15%" r="60%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {
    /* Ambient Sun Glow */
  }
        <circle cx="270" cy="30" r="70" fill="url(#sunGlow)" />

        {
    /* Support Leg Base */
  }
        <path d="M 90 145 L 105 165 M 230 145 L 245 165 M 150 145 L 160 165" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
        <path d="M 80 165 L 255 165" stroke="#475569" strokeWidth="4" strokeLinecap="round" />

        {
    /* Tilted Solar Panel Main Outer Aluminum Frame */
  }
        <polygon
    points="40,110 130,40 280,45 190,135"
    fill="url(#aluminumFrame)"
    stroke="#334155"
    strokeWidth="2.5"
    strokeLinejoin="round"
  />

        {
    /* Inner Blue Silicon Photovoltaic Cells Surface */
  }
        <polygon
    points="46,108 132,44 274,48 186,131"
    fill="url(#solarGlass)"
    stroke="#1e293b"
    strokeWidth="1.5"
  />

        {
    /* Photovoltaic Cell Grid Lines (Horizontal & Vertical Busbars) */
  }
        {
    /* Longitudinal Lines */
  }
        <line x1="88" y1="76" x2="230" y2="89" stroke="#60a5fa" strokeWidth="0.8" strokeOpacity="0.6" />
        <line x1="110" y1="60" x2="252" y2="68" stroke="#60a5fa" strokeWidth="0.8" strokeOpacity="0.6" />
        <line x1="68" y1="92" x2="208" y2="110" stroke="#60a5fa" strokeWidth="0.8" strokeOpacity="0.6" />

        {
    /* Transverse Busbar Lines */
  }
        <line x1="108" y1="42" x2="72" y2="116" stroke="#93c5fd" strokeWidth="1.2" strokeOpacity="0.8" />
        <line x1="178" y1="44" x2="132" y2="124" stroke="#93c5fd" strokeWidth="1.2" strokeOpacity="0.8" />
        <line x1="240" y1="46" x2="170" y2="128" stroke="#93c5fd" strokeWidth="1.2" strokeOpacity="0.8" />

        {
    /* Individual Cell Grid Dashed Pattern */
  }
        <polygon
    points="46,108 132,44 274,48 186,131"
    fill="none"
    stroke="#bfdbfe"
    strokeWidth="0.5"
    strokeDasharray="6,4"
    strokeOpacity="0.4"
  />

        {
    /* Glass Surface Anti-Reflective Glare Polygon */
  }
        <polygon
    points="46,108 132,44 210,46 95,116"
    fill="url(#glassReflection)"
  />

        {
    /* Sun Energy Sparkles / Ray Accents */
  }
        <circle cx="250" cy="35" r="3" fill="#fbbf24" className="animate-pulse" />
        <circle cx="270" cy="50" r="2" fill="#f59e0b" />
        <circle cx="230" cy="25" r="2.5" fill="#fef08a" />
      </svg>
    </div>;
}
function PerformanceCard() {
  const { solarProduction, powerUsage, systemStats } = PERFORMANCE_DATA;
  return <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-6 shadow-xs hover:shadow-md transition-all h-full flex flex-col justify-between">
      {
    /* Header */
  }
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground dark:text-foreground font-bold text-xl tracking-tight">
          Performance Monitoring
        </h3>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-primary dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Live Telemetry
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {
    /* Left Side: Statistics */
  }
        <div className="md:col-span-6 space-y-6">
          {
    /* Subsection 1: Solar Production / Total Charging */
  }
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground">
                {solarProduction.label}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-foreground dark:text-foreground tracking-tight">
                {solarProduction.totalCharging}
              </span>
              <span className="text-sm text-muted-foreground font-semibold">kWh</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-muted-foreground dark:text-muted-foreground">
              <span className="flex items-center gap-1">
                Min <span className="text-rose-500 font-bold">{solarProduction.minKwh}</span>
                <ArrowDown className="w-3.5 h-3.5 text-rose-500" />
              </span>
              <span className="flex items-center gap-1">
                Max <span className="text-primary font-bold">{solarProduction.maxKwh}</span>
                <ArrowUp className="w-3.5 h-3.5 text-primary" />
              </span>
            </div>
          </div>

          {
    /* Subsection 2: Power Usage */
  }
          <div className="pt-4 border-t border-slate-100 dark:border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground">
                {powerUsage.label}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground dark:text-foreground tracking-tight">
                {powerUsage.currentKwh}
              </span>
              <span className="text-sm text-muted-foreground font-semibold">kWh</span>
            </div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground dark:text-muted-foreground">
              1 Hour usage <span className="text-foreground dark:text-foreground font-bold">{powerUsage.hourlyUsageKwh} kWh</span>
            </div>
          </div>
        </div>

        {
    /* Right Side: Solar Panel Vector Illustration + Capacity Box */
  }
        <div className="md:col-span-6 flex flex-col items-center justify-center">
          <SolarPanelIllustration />

          {
    /* Capacity & Yield Stats Box */
  }
          <div className="w-full bg-muted dark:bg-muted/60 rounded-xl p-3.5 border border-border/70 dark:border-border/60 flex items-center justify-around mt-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-primary dark:text-primary flex items-center justify-center">
                <BatteryCharging className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground block uppercase tracking-wider">
                  Capacity
                </span>
                <span className="text-sm font-extrabold text-foreground dark:text-foreground">
                  {systemStats.capacityKwh} kwh
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-muted dark:bg-muted" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-muted/60 text-primary dark:text-primary flex items-center justify-center">
                <SunMedium className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground block uppercase tracking-wider">
                  Yield
                </span>
                <span className="text-sm font-extrabold text-foreground dark:text-foreground">
                  {systemStats.yieldKwh} kwh
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}
export {
  PerformanceCard,
  SolarPanelIllustration
};
