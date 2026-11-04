import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownRight, Loader2, Zap } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { consumptionApi } from "@/services/semantic-api";

function ConsumptionPage() {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setMeasurements(await consumptionApi.measurements());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const chartData = useMemo(() => measurements
    .filter((measurement) => measurement.valeur != null && measurement.date_mesure && (measurement.unite || "").toLowerCase() === "kwh")
    .map((measurement) => ({
      date: new Date(measurement.date_mesure).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      dateValue: new Date(measurement.date_mesure).getTime(),
      value: measurement.valeur,
    }))
    .sort((a, b) => a.dateValue - b.dateValue), [measurements]);
  const totalKwh = measurements.reduce((sum, measurement) => sum + ((measurement.unite || "").toLowerCase() === "kwh" ? measurement.valeur || 0 : 0), 0);
  const average = chartData.length ? totalKwh / chartData.length : 0;

  return <div className="space-y-6 pb-8">
    <div>
      <h1 className="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight"><span className="rounded-xl border border-border bg-card/50 p-2 text-[var(--primary)]"><Zap className="h-5 w-5" /></span>Consommation énergétique</h1>
      <p className="mt-1 text-sm text-muted-foreground">Mesures de consommation enregistrées dans l’ontologie.</p>
    </div>

    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-500"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</span><Button size="sm" variant="outline" onClick={refresh}>Réessayer</Button></div>}

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Kpi title="Consommation mesurée (kWh)" value={totalKwh.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} caption="Somme des mesures en kWh" />
      <Kpi title="Mesures enregistrées" value={measurements.length} caption="Individus MesureConsommation" />
      <Kpi title="Moyenne par mesure (kWh)" value={average.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} caption="Calculée sur les relevés en kWh" />
    </div>

    <Card variant="glass" expandable={false}>
      <CardHeader><CardTitle>Historique de consommation</CardTitle><CardDescription>Les points affichés correspondent aux relevés en kWh enregistrés.</CardDescription></CardHeader>
      <CardContent>{loading ? <Loading /> : chartData.length ? <div className="h-[280px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}><defs><linearGradient id="consumptionFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.55} /><stop offset="95%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" /><XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" fontSize={11} /><YAxis stroke="rgba(255,255,255,0.7)" fontSize={11} unit=" kWh" /><Tooltip formatter={(value) => [`${value} kWh`, "Consommation"]} /><Area type="monotone" dataKey="value" name="Consommation" stroke="var(--primary)" fill="url(#consumptionFill)" connectNulls /></AreaChart></ResponsiveContainer></div> : <p className="py-12 text-center text-sm text-muted-foreground">Aucune mesure en kWh datée à représenter.</p>}</CardContent>
    </Card>

    <Card variant="glass" expandable={false}>
      <CardHeader><CardTitle>Mesures</CardTitle><CardDescription>Relevés de consommation présents dans l’ontologie.</CardDescription></CardHeader>
      <CardContent>{loading ? <Loading /> : measurements.length ? <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Maison</th><th className="py-2 pr-3">Valeur</th><th className="py-2 pr-3">Unité</th></tr></thead><tbody>{measurements.map((item) => <tr key={item.id} className="border-b border-border/50"><td className="py-3 pr-3">{item.date_mesure ? new Date(item.date_mesure).toLocaleString("fr-FR") : "—"}</td><td className="py-3 pr-3">{item.consommateur_nom || item.consommateur_id || "—"}</td><td className="py-3 pr-3 font-mono">{item.valeur ?? "—"}</td><td className="py-3 pr-3">{item.unite || "—"}</td></tr>)}</tbody></table></div> : <p className="py-10 text-center text-sm text-muted-foreground">Aucune mesure de consommation enregistrée.</p>}</CardContent>
    </Card>
  </div>;
}

function Kpi({ title, value, caption }) {
  return <Card variant="glass" expandable={false}><CardContent className="p-5"><div className="text-xs text-muted-foreground">{title}</div><div className="mt-1 font-mono text-3xl font-black">{value}</div><div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><ArrowDownRight className="h-3.5 w-3.5 text-[var(--primary)]" />{caption}</div></CardContent></Card>;
}

function Loading() { return <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Chargement depuis Fuseki…</div>; }

export { ConsumptionPage as default };
