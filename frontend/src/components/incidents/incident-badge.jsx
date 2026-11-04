import { AlertTriangle, AlertCircle, Zap, ShieldAlert, CheckCircle2, Wrench, Search, Clock, Cpu } from "lucide-react";

export function IncidentBadge({ type, size = "md" }) {
  const t = (type || "").toLowerCase();
  const isPanne = t.includes("panne");
  const isAlerte = t.includes("alerte");
  const isSurcharge = t.includes("surcharge");

  let colorClasses = "bg-muted text-muted-foreground border-border";
  let label = type || "Incident";
  let Icon = AlertCircle;

  if (isPanne) {
    colorClasses = "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
    label = "Panne";
    Icon = ShieldAlert;
  } else if (isAlerte) {
    colorClasses = "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
    label = "Alerte";
    Icon = AlertTriangle;
  } else if (isSurcharge) {
    // Surcharge
    colorClasses = "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30";
    label = "Surcharge";
    Icon = Zap;
  }

  const px = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg border ${colorClasses} ${px}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {label}
    </span>
  );
}

export function GraviteBadge({ gravite }) {
  const g = (gravite || "").toLowerCase();
  let color = "bg-muted text-muted-foreground border-border";

  if (g.includes("critique")) {
    color = "bg-red-600/20 text-red-600 dark:text-red-400 border-red-600/40 font-extrabold";
  } else if (g.includes("élevée") || g.includes("elevee")) {
    color = "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/40";
  } else if (g.includes("moyenne")) {
    color = "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/40";
  } else if (g.includes("faible")) {
    color = "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40";
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${color}`}>
      {gravite || "Standard"}
    </span>
  );
}

export function MaintenanceBadge({ type, size = "md" }) {
  const t = (type || "").toLowerCase();
  let label = type || "Maintenance";
  let color = "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30";
  let Icon = Wrench;

  if (t.includes("inspection")) {
    label = "Inspection";
    color = "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30";
    Icon = Search;
  } else if (t.includes("corrective")) {
    label = "Corrective";
    color = "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
    Icon = Wrench;
  } else if (t.includes("predictive")) {
    label = "Prédictive";
    color = "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30";
    Icon = Cpu;
  } else if (t.includes("preventive")) {
    label = "Préventive";
    color = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    Icon = CheckCircle2;
  }

  const px = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-lg border ${color} ${px}`}>
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {label}
    </span>
  );
}

