import { CheckCircle2, Wrench, XCircle, HelpCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES = {
  Fonctionnel: { cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", Icon: CheckCircle2 },
  Maintenance: { cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", Icon: Wrench },
  Alerte: { cls: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30", Icon: AlertTriangle },
  "En panne": { cls: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30", Icon: XCircle },
};

function EtatBadge({ etat, className }) {
  const { cls, Icon } = STYLES[etat] || { cls: "bg-muted text-muted-foreground border-border", Icon: HelpCircle };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap", cls, className)}>
      <Icon className="w-3 h-3" />
      {etat || "Inconnu"}
    </span>
  );
}

export { EtatBadge as default };
