import { BATTERY_STATUS_DATA } from "@/data/dashboard";
import { BatteryCharging, ShieldCheck, Activity } from "lucide-react";
function BatteryStatus() {
  const { load, charge, voltage, healthPercentage, status } = BATTERY_STATUS_DATA;
  return <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-6 shadow-xs hover:shadow-md transition-all h-full flex flex-col justify-between">
      <div>
        {
    /* Title & Badge */
  }
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-primary dark:text-primary flex items-center justify-center">
              <BatteryCharging className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-foreground dark:text-foreground font-bold text-xl tracking-tight">
              Battery Status
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-primary dark:text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" /> {status}
          </span>
        </div>

        {
    /* Metric Cards Row */
  }
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-muted dark:bg-muted/60 p-3 rounded-xl border border-border/70 dark:border-border/60 text-center">
            <span className="text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground block uppercase tracking-wider mb-1">
              Load
            </span>
            <span className="text-xl font-extrabold text-foreground dark:text-foreground">
              {load}%
            </span>
          </div>

          <div className="bg-muted dark:bg-muted/60 p-3 rounded-xl border border-border/70 dark:border-border/60 text-center">
            <span className="text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground block uppercase tracking-wider mb-1">
              Charge
            </span>
            <span className="text-xl font-extrabold text-primary dark:text-primary">
              {charge}%
            </span>
          </div>

          <div className="bg-muted dark:bg-muted/60 p-3 rounded-xl border border-border/70 dark:border-border/60 text-center">
            <span className="text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground block uppercase tracking-wider mb-1">
              Power
            </span>
            <span className="text-xl font-extrabold text-foreground dark:text-foreground">
              {voltage} V
            </span>
          </div>
        </div>

        {
    /* Visual Battery Level Graphic */
  }
        <div className="bg-card text-foreground rounded-xl p-4 border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Activity className="w-3.5 h-3.5 text-primary animate-pulse" /> Battery Level
            </span>
            <span className="text-primary font-extrabold text-sm">{healthPercentage}%</span>
          </div>

          {
    /* Graphical Battery Bar */
  }
          <div className="relative w-full h-7 bg-background rounded-lg border border-border p-1 flex items-center gap-1 overflow-hidden">
            {
    /* Battery Cap Nipple */
  }
            <div className="w-full h-full bg-card/80 rounded flex items-center p-0.5 gap-0.5">
              {[...Array(10)].map((_, i) => {
    const step = (i + 1) * 10;
    const active = healthPercentage >= step;
    return <div
      key={i}
      className={`h-full flex-1 rounded-sm transition-all duration-300 ${active ? i < 2 ? "bg-rose-500" : i < 5 ? "bg-amber-400" : "bg-emerald-500" : "bg-muted/50"}`}
    />;
  })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 font-medium">
            <span>Health Status: <strong>Optimal</strong></span>
            <span>Capacity: <strong>14.2 kWh</strong></span>
          </div>
        </div>
      </div>
    </div>;
}
export {
  BatteryStatus
};
