import { RadialGauge } from "./radial-gauge";
import { TrendingUp, Coins, Sparkles } from "lucide-react";
function KpiCards() {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {
    /* Card 1: Solar Efficiency */
  }
      <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <h3 className="text-foreground dark:text-foreground font-bold text-lg tracking-tight mb-2">
            Solar Efficiency
          </h3>

          {
    /* Status legend dots */
  }
          <div className="flex items-center gap-3 text-xs font-semibold mb-4 text-muted-foreground dark:text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Low
            </span>
          </div>

          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-extrabold text-foreground dark:text-foreground block tracking-tight">
                60%
              </span>
              <span className="text-xs text-muted-foreground dark:text-muted-foreground font-medium mt-1 block">
                Peak system yield
              </span>
            </div>

            <RadialGauge value={60} statusText="High" size={120} />
          </div>
        </div>
      </div>

      {
    /* Card 2: Power Generation */
  }
      <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <h3 className="text-foreground dark:text-foreground font-bold text-lg tracking-tight mb-2">
            Power Generation
          </h3>

          <div className="flex items-center gap-3 text-xs font-semibold mb-4 text-muted-foreground dark:text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Low
            </span>
          </div>

          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-extrabold text-foreground dark:text-foreground block tracking-tight">
                6.5 Kw
              </span>
              <span className="text-xs text-primary dark:text-primary font-semibold mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live Generation
              </span>
            </div>

            <RadialGauge value={65} statusText="Optimal" size={120} />
          </div>
        </div>
      </div>

      {
    /* Card 3: Energy Consumed */
  }
      <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <h3 className="text-foreground dark:text-foreground font-bold text-lg tracking-tight mb-2">
            Energy Consumed
          </h3>

          <div className="flex items-center gap-3 text-xs font-semibold mb-4 text-muted-foreground dark:text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Low
            </span>
          </div>

          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-extrabold text-foreground dark:text-foreground block tracking-tight">
                12 KWh
              </span>
              <span className="text-xs text-amber-600 dark:text-primary font-semibold mt-1 block">
                Moderate demand
              </span>
            </div>

            <RadialGauge value={40} statusText="Moderate" size={120} />
          </div>
        </div>
      </div>

      {
    /* Card 4: Today's Savings */
  }
      <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-foreground dark:text-foreground font-bold text-lg tracking-tight">
              Today's Savings
            </h3>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-primary flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground dark:text-foreground tracking-tight">
                24.80 DT
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-primary dark:text-emerald-300">
                <TrendingUp className="w-3.5 h-3.5" /> +12.5%
              </span>
              <span className="text-xs text-muted-foreground dark:text-muted-foreground font-medium">
                vs grid baseline
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-border/80 flex items-center justify-between text-xs text-muted-foreground">
          <span>CO₂ Offset: <strong>14.2 kg</strong></span>
          <span className="text-primary font-semibold">Clean Energy</span>
        </div>
      </div>
    </div>;
}
export {
  KpiCards
};
