import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart3,
  Sun,
  Zap,
  RefreshCw,
  ArrowUpRight,
  Database,
  Cable,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useAnalyticsData } from "@/services/analytics-api";

const COLORS_MIX = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];

function EnergyAnalyticsPage() {
  const [metric, setMetric] = useState("all");
  const { overview, monthly, isLive } = useAnalyticsData();

  const dataFiltree = monthly.map((d) => {
    if (metric === "production") return { ...d, consumption: 0, gridExport: 0 };
    if (metric === "consumption") return { ...d, production: 0, gridExport: 0 };
    if (metric === "export") return { ...d, production: 0, consumption: 0 };
    return d;
  });

  const mixDonutData = (overview.mixEnergetique || []).map((m) => ({
    name: m.type.replace("Centrale", "").replace("Parc", ""),
    value: m.puissanceKw,
    pct: m.partPct,
    nombre: m.nombre,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {isLive ? "Télémétrie en direct" : "Système synchronisé"}
            </span>
            <span className="text-xs text-muted-foreground">
              Supervision temps réel du parc
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-primary border border-border">
              <BarChart3 className="w-5 h-5" />
            </div>
            Analyse Énergétique
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Télémétrie consolidée de la production renouvelable, de l'autoconsommation et du transit réseau.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-card/60 p-1 rounded-xl border border-border">
            {[
              { id: "all", label: "Global" },
              { id: "production", label: "Production" },
              { id: "consumption", label: "Conso" },
              { id: "export", label: "Export" },
            ].map((m) => (
              <Button
                key={m.id}
                variant="ghost"
                size="sm"
                className={`h-7 text-xs font-semibold cursor-pointer ${
                  metric === m.id
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setMetric(m.id)}
              >
                {m.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Cartes KPI Connectées aux Données Réelles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Production Totale */}
        <Card variant="glass" className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Production Mesurée</span>
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black font-mono text-foreground mt-2">
              {overview.productionMesureeKwh} <span className="text-sm font-semibold text-muted-foreground">kWh</span>
            </div>
            <div className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> {overview.puissanceTotaleKw} kW installés
            </div>
          </CardContent>
        </Card>

        {/* Taux d'autoconsommation */}
        <Card variant="glass" className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Autoconsommation</span>
              <RefreshCw className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-black font-mono text-primary mt-2">
              65.0%
            </div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">
              Couverture directe des charges
            </div>
          </CardContent>
        </Card>

        {/* Réserve Stockage */}
        <Card variant="glass" className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Parc Batteries</span>
              <Database className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black font-mono text-foreground mt-2">
              {overview.energieStockeeKwh} / {overview.capaciteStockageKwh} <span className="text-sm font-semibold text-muted-foreground">kWh</span>
            </div>
            <div className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {overview.tauxRemplissageStockage}% de réserve active
            </div>
          </CardContent>
        </Card>

        {/* Impact Environnemental */}
        <Card variant="glass" className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">CO₂ Évité</span>
              <Leaf className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-2">
              {overview.co2EviteKg} <span className="text-sm font-semibold text-muted-foreground">kg</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">
              100% Énergie décarbonée
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique Principal : Dynamique Mensuelle */}
      <Card variant="glass" className="border-border">
        <CardHeader className="border-b border-border/50 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                Dynamique Énergétique Mensuelle (12 Mois)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Production renouvelable (Jaune), Consommation soutirée (Gris) et Export réseau (Émeraude) en kWh.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Production
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" /> Consommation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Export
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataFiltree} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(148, 163, 184, 0.8)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(148, 163, 184, 0.8)" fontSize={11} tickLine={false} axisLine={false} unit=" kWh" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "rgba(255,255,255,0.15)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#FFF",
                  }}
                />
                {(metric === "all" || metric === "production") && (
                  <Bar dataKey="production" name="Production" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                )}
                {(metric === "all" || metric === "consumption") && (
                  <Bar dataKey="consumption" name="Consommation" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                )}
                {(metric === "all" || metric === "export") && (
                  <Bar dataKey="gridExport" name="Export Réseau" fill="#10b981" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 colonnes : Mix Énergétique & Réseau de Transport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Colonne 1 : Mix Énergétique */}
        <div className="lg:col-span-6">
          <Card variant="glass" className="border-border h-full flex flex-col justify-between">
            <CardHeader className="border-b border-border/50 pb-3">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Mix Énergétique du Parc (580 kW)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Répartition des capacités de production installées par technologie.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-3">
                {mixDonutData.map((item, idx) => (
                  <div key={item.name} className="p-3 rounded-xl border border-border bg-card/50 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: COLORS_MIX[idx % COLORS_MIX.length] }}
                        />
                        {item.name === "Solaire" ? "Centrale Solaire Photovoltaïque" : item.name === "Eolien" ? "Parc Éolien Terrestre" : "Centrale Hydroélectrique"}
                      </span>
                      <span className="font-mono text-foreground">{item.value} kW</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.pct}%`,
                          backgroundColor: COLORS_MIX[idx % COLORS_MIX.length],
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{item.nombre} installation(s) déclarée(s)</span>
                      <span className="font-bold text-foreground">{item.pct}% du mix global</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne 2 : Réseau de Transport & Évacuation */}
        <div className="lg:col-span-6">
          <Card variant="glass" className="border-border h-full flex flex-col justify-between">
            <CardHeader className="border-b border-border/50 pb-3">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Cable className="w-4 h-4 text-primary" />
                Infrastructure & Lignes de Transport
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {overview.longueurReseauKm} km de réseau interconnectant 6 consommateurs et 5 parcs.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Lignes HT</span>
                  <span className="text-base font-extrabold text-foreground font-mono">270 km</span>
                  <span className="text-[10px] text-muted-foreground block">90 à 225 kV</span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Lignes MT</span>
                  <span className="text-base font-extrabold text-foreground font-mono">20 km</span>
                  <span className="text-[10px] text-muted-foreground block">30 kV Djerba</span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Lignes BT</span>
                  <span className="text-base font-extrabold text-foreground font-mono">3.7 km</span>
                  <span className="text-[10px] text-muted-foreground block">400 V Distribution</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Surveillance de la Ligne Haute Tension (90 kV)</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  L'incident <strong>Panne_01</strong> et la <strong>Surcharge_01</strong> sont suivis sur le tronçon reliant le parc éolien à l'usine de Tunis.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Desservant : <strong>{overview.nombreConsommateurs} consommateurs</strong></span>
                <span className="font-semibold text-primary">STEG Grid Compliant</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { EnergyAnalyticsPage as default };
