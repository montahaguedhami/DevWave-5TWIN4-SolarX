import { BatteryCharging, ShieldCheck, Zap, ArrowRight, Database } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardData } from "@/services/dashboard-api";

function BatteryStatus() {
  const { stockageTotal, batteries } = useDashboardData();

  const chargeGlobale = Math.round(stockageTotal?.tauxRemplissage ?? 45);
  const energieStockee = stockageTotal?.energieStockee ?? 27;
  const capaciteTotale = stockageTotal?.capaciteTotale ?? 60;

  return (
    <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-6 shadow-xs hover:shadow-md transition-all h-full flex flex-col justify-between">
      <div>
        {/* Title & Badge */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BatteryCharging className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-foreground font-bold text-xl tracking-tight">
              Parc de Stockage
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" /> Opérationnel
          </span>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-muted/60 p-3 rounded-xl border border-border text-center">
            <span className="text-[11px] font-semibold text-muted-foreground block uppercase tracking-wider mb-1">
              Capacité
            </span>
            <span className="text-lg font-extrabold text-foreground">
              {capaciteTotale} kWh
            </span>
          </div>

          <div className="bg-muted/60 p-3 rounded-xl border border-border text-center">
            <span className="text-[11px] font-semibold text-muted-foreground block uppercase tracking-wider mb-1">
              Stockée
            </span>
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              {energieStockee} kWh
            </span>
          </div>

          <div className="bg-muted/60 p-3 rounded-xl border border-border text-center">
            <span className="text-[11px] font-semibold text-muted-foreground block uppercase tracking-wider mb-1">
              Niveau moyen
            </span>
            <span className="text-lg font-extrabold text-primary">
              {chargeGlobale}%
            </span>
          </div>
        </div>

        {/* Visual Battery Level Bar */}
        <div className="bg-card text-foreground rounded-xl p-4 border border-border mb-4">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Réserve disponible
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {chargeGlobale}% charge globale
            </span>
          </div>

          <div className="w-full h-3 bg-muted rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-primary rounded-full transition-all duration-700"
              style={{ width: `${chargeGlobale}%` }}
            />
          </div>
        </div>

        {/* Détail des unités connectées */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Accumulateurs raccordés ({batteries.length || 2})
          </span>

          {(batteries.length > 0 ? batteries : [
            { id: "Batterie_01", localisation: "Djerba", capacite: 10, energieStockee: 7, niveauCharge: 70, etat: "Fonctionnel", alimente: ["Maison_Djerba"] },
            { id: "Batterie_02", localisation: "Tunis", capacite: 50, energieStockee: 20, niveauCharge: 40, etat: "Fonctionnel", alimente: ["Hopital_Tunis"] },
          ]).map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border text-xs"
            >
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-primary" />
                <div>
                  <span className="font-bold text-foreground">{b.id}</span>
                  <span className="text-muted-foreground ml-1.5 font-normal">
                    ({b.localisation || "Réseau"} • {b.alimente?.[0] || "Alimentation"})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-foreground">
                  {b.energieStockee}/{b.capacite} kWh
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  {Math.round(b.niveauCharge || 0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 mt-2 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Supervision du stockage</span>
        <Link
          to="/stockage"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          Gérer les batteries <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export { BatteryStatus };
