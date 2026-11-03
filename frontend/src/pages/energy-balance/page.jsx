import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, RefreshCw, Sun, Zap } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { consumptionApi, productionApi } from "@/services/semantic-api";

const PERIODS = [
  { days: 7, label: "7 derniers jours" },
  { days: 30, label: "30 derniers jours" },
  { days: 90, label: "90 derniers jours" },
  { days: 365, label: "12 derniers mois" },
];

function EnergyBalancePage() {
  const [period, setPeriod] = useState(30);
  const [production, setProduction] = useState([]);
  const [consumption, setConsumption] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [productionRows, consumptionRows] = await Promise.all([
        productionApi.measurements(), consumptionApi.measurements(),
      ]);
      setProduction(Array.isArray(productionRows) ? productionRows : []);
      setConsumption(Array.isArray(consumptionRows) ? consumptionRows : []);
      setError("");
    } catch (err) {
      setError(err.message || "Impossible de charger les mesures énergétiques.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentStart = new Date(today);
  currentStart.setDate(currentStart.getDate() - period + 1);
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - period);
  const currentEnd = new Date(today);
  currentEnd.setHours(23, 59, 59, 999);
  const previousEnd = new Date(currentStart.getTime() - 1);

  const currentProduction = useMemo(() => inRange(production, currentStart, currentEnd), [production, period, currentStart.getTime(), currentEnd.getTime()]);
  const priorProduction = useMemo(() => inRange(production, previousStart, previousEnd), [production, period, previousStart.getTime(), previousEnd.getTime()]);
  const currentConsumption = useMemo(() => inRange(consumption, currentStart, currentEnd), [consumption, period, currentStart.getTime(), currentEnd.getTime()]);
  const priorConsumption = useMemo(() => inRange(consumption, previousStart, previousEnd), [consumption, period, previousStart.getTime(), previousEnd.getTime()]);

  const currentProductionKwh = sumKwh(currentProduction);
  const priorProductionKwh = sumKwh(priorProduction);
  const currentConsumptionKwh = sumKwh(currentConsumption);
  const priorConsumptionKwh = sumKwh(priorConsumption);
  const balance = currentProductionKwh - currentConsumptionKwh;
  const chartData = useMemo(() => makeChartData(currentProduction, currentConsumption), [currentProduction, currentConsumption]);
  const hasCurrentData = currentProduction.length > 0 || currentConsumption.length > 0;

  return <div className="space-y-6 pb-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight"><span className="rounded-xl border border-border bg-card/50 p-2 text-[var(--primary)]"><BarChart3 className="h-5 w-5" /></span>Équilibre énergétique</h1>
        <p className="mt-1 text-sm text-muted-foreground">Comparez la production et la consommation mesurées sur deux périodes consécutives.</p>
      </div>
      <div className="flex gap-2">
        <NativeSelect aria-label="Période de comparaison" className="min-w-44" value={period} onChange={(event) => setPeriod(Number(event.target.value))}>{PERIODS.map((item) => <option key={item.days} value={item.days}>{item.label}</option>)}</NativeSelect>
        <Button variant="outline" onClick={refresh} disabled={loading} aria-label="Actualiser les mesures"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
      </div>
    </div>

    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-500"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</span><Button size="sm" variant="outline" onClick={refresh}>Réessayer</Button></div>}

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric title="Production mesurée" value={currentProductionKwh} previous={priorProductionKwh} unit="kWh" icon={Sun} loading={loading} />
      <Metric title="Consommation mesurée" value={currentConsumptionKwh} previous={priorConsumptionKwh} unit="kWh" icon={Zap} comparison="inverse" loading={loading} />
      <Metric title="Solde énergétique" value={balance} previous={priorProductionKwh - priorConsumptionKwh} unit="kWh" icon={BarChart3} comparison="signed" loading={loading} />
      <Metric title="Ratio production / consommation" value={currentConsumptionKwh ? currentProductionKwh / currentConsumptionKwh * 100 : 0} previous={priorConsumptionKwh ? priorProductionKwh / priorConsumptionKwh * 100 : 0} unit="%" decimals={1} loading={loading} />
    </div>

    <Card variant="glass" expandable={false}>
      <CardHeader><CardTitle>Comparaison par jour</CardTitle><CardDescription>{formatRange(currentStart, currentEnd)} · précédente : {formatRange(previousStart, previousEnd)}</CardDescription></CardHeader>
      <CardContent>
        {loading ? <div className="py-16 text-center text-sm text-muted-foreground">Chargement des mesures…</div> : chartData.length ? <div className="h-[340px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" /><XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" fontSize={11} /><YAxis stroke="rgba(255,255,255,0.7)" fontSize={11} unit=" kWh" /><Tooltip formatter={(value, name) => [`${Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kWh`, name]} /><Bar dataKey="production" name="Production" fill="#a3e635" radius={[4, 4, 0, 0]} /><Bar dataKey="consumption" name="Consommation" fill="#38bdf8" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div> : <p className="py-16 text-center text-sm text-muted-foreground">Aucune mesure datée en kWh dans cette période.</p>}
      </CardContent>
    </Card>

    <div className="grid gap-4 lg:grid-cols-2">
      <PeriodSummary title="Période actuelle" from={currentStart} to={currentEnd} production={currentProductionKwh} consumption={currentConsumptionKwh} count={currentProduction.length + currentConsumption.length} />
      <PeriodSummary title="Période précédente" from={previousStart} to={previousEnd} production={priorProductionKwh} consumption={priorConsumptionKwh} count={priorProduction.length + priorConsumption.length} />
    </div>

    <p className="rounded-xl border border-border bg-card/40 p-4 text-sm text-muted-foreground">Le surplus ou déficit compare les totaux mesurés. Il ne représente pas les échanges réels avec le réseau : l’ontologie ne précise pas encore l’autoconsommation, l’injection ni le soutirage.</p>
    {!loading && !hasCurrentData && !error && <p className="text-center text-xs text-muted-foreground">Vérifiez que vos relevés de production et de consommation possèdent une date, une valeur et l’unité kWh.</p>}
  </div>;
}

function inRange(rows, start, end) {
  return rows.filter((row) => {
    const date = row.date_mesure ? new Date(row.date_mesure) : null;
    return date && !Number.isNaN(date.getTime()) && date >= start && date <= end && (row.unite || "").toLowerCase() === "kwh" && Number.isFinite(Number(row.valeur));
  });
}

function sumKwh(rows) { return rows.reduce((total, row) => total + Number(row.valeur), 0); }

function makeChartData(production, consumption) {
  const byDate = new Map();
  for (const [rows, key] of [[production, "production"], [consumption, "consumption"]]) {
    for (const row of rows) {
      const date = new Date(row.date_mesure);
      const keyDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const point = byDate.get(keyDate) || { date: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }), order: keyDate, production: 0, consumption: 0 };
      point[key] += Number(row.valeur);
      byDate.set(keyDate, point);
    }
  }
  return [...byDate.values()].sort((a, b) => a.order.localeCompare(b.order));
}

function formatRange(from, to) {
  const format = (date) => date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  return `${format(from)} – ${format(to)}`;
}

function Metric({ title, value, previous, unit, icon: Icon = BarChart3, decimals = 2, comparison = "normal", loading }) {
  const difference = value - previous;
  const relative = previous && comparison !== "signed" ? difference / Math.abs(previous) * 100 : null;
  const ChangeIcon = difference >= 0 ? ArrowUpRight : ArrowDownRight;
  const favorable = comparison === "inverse" ? difference <= 0 : difference >= 0;
  const signedValue = comparison === "signed" && value > 0 ? "+" : "";
  const changeLabel = comparison === "signed"
    ? `${difference > 0 ? "+" : ""}${difference.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kWh de solde`
    : `${Math.abs(relative || 0).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}% vs période précédente`;
  return <Card variant="glass" expandable={false}><CardContent className="p-5"><div className="flex items-center justify-between text-xs text-muted-foreground"><span>{title}</span><Icon className="h-4 w-4 text-[var(--primary)]" /></div><div className="mt-2 font-mono text-3xl font-black">{loading ? "—" : `${signedValue}${Number(value).toLocaleString("fr-FR", { maximumFractionDigits: decimals })} ${unit}`}</div><div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">{relative == null && comparison !== "signed" ? "Pas de période précédente comparable" : <><ChangeIcon className={`h-3.5 w-3.5 ${favorable ? "text-emerald-500" : "text-rose-500"}`} />{changeLabel}</>}</div></CardContent></Card>;
}

function PeriodSummary({ title, from, to, production, consumption, count }) {
  const balance = production - consumption;
  return <Card variant="glass" expandable={false}><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{formatRange(from, to)} · {count} mesure(s) datée(s) en kWh</CardDescription></CardHeader><CardContent className="grid grid-cols-3 gap-3"><SummaryValue label="Production" value={production} /><SummaryValue label="Consommation" value={consumption} /><SummaryValue label={balance >= 0 ? "Surplus" : "Déficit"} value={Math.abs(balance)} /></CardContent></Card>;
}

function SummaryValue({ label, value }) { return <div className="rounded-lg border border-border bg-card/40 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-mono text-lg font-semibold">{value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kWh</div></div>; }

export { EnergyBalancePage as default };
