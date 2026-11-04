import { Sparkles, ArrowRight, Lightbulb, Zap, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardData } from "@/services/dashboard-api";

function SmartAdvisorCard() {
  const { incidentsStats, stockageTotal, production } = useDashboardData();

  const nbCritiques = incidentsStats?.parGravite?.Critique ?? 2;
  const tauxCharge = Math.round(stockageTotal?.tauxRemplissage ?? 45);
  const energieStockee = stockageTotal?.energieStockee ?? 27;
  const productionSolaire = production?.sources?.find((s) => s.source === "Solaire")?.production_mesuree_kwh ?? 600;

  const hasCritiques = nbCritiques > 0;

  const insight = hasCritiques
    ? `${nbCritiques} incidents critiques actifs détectés sur le parc (notamment Onduleur_01 et Batterie_05).`
    : `Production photovoltaïque optimale (${productionSolaire} kWh) avec réserve de stockage nominale (${tauxCharge}%).`;

  const recommendation = hasCritiques
    ? "Une intervention corrective prioritaire est recommandée sur les composants affectés pour préserver l'équilibre du réseau."
    : `La charge actuelle des batteries (${energieStockee} kWh) permet d'absorber le surplus diurne avant injection dans le réseau haute tension.`;

  return (
    <div className="bg-gradient-to-br from-primary/10 via-card to-indigo-950/20 text-foreground rounded-2xl border border-border p-6 shadow-md hover:shadow-lg transition-all h-full flex flex-col justify-between relative overflow-hidden group">
      {/* Background Decorative Glow */}
      <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500 pointer-events-none" />

      <div>
        {/* Title and Sparkle Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-xl tracking-tight text-foreground">
                Conseiller IA
              </h3>
              <span className="text-xs text-muted-foreground">Analyse temps réel du réseau</span>
            </div>
          </div>

          <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Intelligence SolarX
          </span>
        </div>

        {/* Insight Box */}
        <div className="bg-card/70 backdrop-blur-md rounded-xl p-4 border border-border mb-4">
          <div className="flex items-start gap-3">
            {hasCritiques ? (
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            ) : (
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-semibold text-foreground leading-relaxed">
                "{insight}"
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-normal">
                {recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Indicateurs rapides */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Batteries : <strong>{tauxCharge}% SoC</strong></span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Solaire : <strong>{productionSolaire} kWh</strong></span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 mt-2">
        <Link
          to="/assistant-ia"
          className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all shadow-sm group/btn cursor-pointer"
        >
          <span>Interroger l'Assistant IA SolarX</span>
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

export { SmartAdvisorCard };
