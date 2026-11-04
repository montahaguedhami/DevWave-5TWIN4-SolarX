import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownRight, Loader2, Pencil, Plus, Trash2, X, Zap } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { consommateurApi, mesureApi } from "@/services/semantic-api";

const TYPE_MESURE = "MesureConsommation";

const EMPTY_FILTERS = { concerne: "", debut: "", fin: "" };
const EMPTY_FORM = { id: null, valeur: "", unite: "kWh", dateMesure: "", concerne: "", sourceDonnees: "" };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function ConsumptionPage() {
  const [measurements, setMeasurements] = useState([]);
  const [consommateurs, setConsommateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [form, setForm] = useState({ ...EMPTY_FORM, dateMesure: today() });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [mesures, consommateursList] = await Promise.all([
        mesureApi.list({
          type: TYPE_MESURE,
          concerne: applied.concerne,
          debut: applied.debut,
          fin: applied.fin,
          limit: 200,
        }),
        consommateurApi.list({ limit: 200 }),
      ]);
      setMeasurements(mesures);
      setConsommateurs(consommateursList);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => { refresh(); }, [refresh]);

  const chartData = useMemo(() => measurements
    .filter((measurement) => measurement.valeur != null && measurement.dateMesure)
    .map((measurement) => ({
      date: new Date(measurement.dateMesure).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      dateValue: new Date(measurement.dateMesure).getTime(),
      value: measurement.valeur,
    }))
    .sort((a, b) => a.dateValue - b.dateValue), [measurements]);

  const totalKwh = measurements.reduce((sum, measurement) => sum + (measurement.valeur || 0), 0);
  const average = chartData.length ? totalKwh / chartData.length : 0;

  const resetForm = () => setForm({ ...EMPTY_FORM, dateMesure: today() });

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const body = {
      type: TYPE_MESURE,
      valeur: Number(form.valeur),
      unite: form.unite,
      dateMesure: form.dateMesure.includes("T") ? form.dateMesure : `${form.dateMesure}T00:00:00`,
      concerne: form.concerne,
      sourceDonnees: form.sourceDonnees || null,
    };
    try {
      if (form.id) {
        await mesureApi.update(form.id, body);
        setMessage({ type: "success", text: "Mesure mise à jour." });
      } else {
        await mesureApi.create(body);
        setMessage({ type: "success", text: "Mesure ajoutée." });
      }
      resetForm();
      refresh();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const edit = (measurement) => {
    setMessage(null);
    setForm({
      id: measurement.id,
      valeur: measurement.valeur ?? "",
      unite: measurement.unite || "kWh",
      dateMesure: (measurement.dateMesure || "").slice(0, 10),
      concerne: measurement.concerne || "",
      sourceDonnees: measurement.sourceDonnees || "",
    });
  };

  const remove = async (measurement) => {
    if (!confirm(`Supprimer la mesure ${measurement.id} ?`)) return;
    try {
      await mesureApi.delete(measurement.id);
      setMessage({ type: "success", text: "Mesure supprimée." });
      if (form.id === measurement.id) resetForm();
      refresh();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const applyFilters = () => setApplied({ ...filters });
  const resetFilters = () => { setFilters(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); };

  return <div className="space-y-6 pb-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight"><span className="rounded-xl border border-border bg-card/50 p-2 text-[var(--primary)]"><Zap className="h-5 w-5" /></span>Consommation énergétique</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gestion des mesures de consommation enregistrées dans l’ontologie.</p>
      </div>
      <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" />Ajouter une mesure</Button>
    </div>

    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-500"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</span><Button size="sm" variant="outline" onClick={refresh}>Réessayer</Button></div>}
    {message && <div className={`rounded-lg px-4 py-2 text-sm ${message.type === "error" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>{message.text}</div>}

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Kpi title="Consommation mesurée (kWh)" value={totalKwh.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} caption="Somme des mesures filtrées" />
      <Kpi title="Mesures enregistrées" value={measurements.length} caption="Individus MesureConsommation" />
      <Kpi title="Moyenne par mesure (kWh)" value={average.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} caption="Calculée sur les relevés affichés" />
    </div>

    <Card variant="glass" expandable={false}>
      <CardHeader>
        <CardTitle>{form.id ? "Modifier une mesure" : "Nouvelle mesure de consommation"}</CardTitle>
        <CardDescription>Rattachez la mesure à un consommateur existant.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm md:col-span-2" value={form.concerne} onChange={(e) => setForm({ ...form, concerne: e.target.value })} required>
            <option value="">-- Consommateur --</option>
            {consommateurs.map((c) => <option key={c.id} value={c.id}>{c.nom} ({c.type})</option>)}
          </select>
          <Input placeholder="Valeur" type="number" min="0" step="0.01" value={form.valeur} onChange={(e) => setForm({ ...form, valeur: e.target.value })} required />
          <Input placeholder="Unité" value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })} required />
          <Input type="date" value={form.dateMesure} onChange={(e) => setForm({ ...form, dateMesure: e.target.value })} required />
          <Input placeholder="Source (optionnel)" value={form.sourceDonnees} onChange={(e) => setForm({ ...form, sourceDonnees: e.target.value })} />
          <div className="flex gap-2 md:col-span-6">
            <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : form.id ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{form.id ? "Mettre à jour" : "Ajouter"}</Button>
            {form.id && <Button type="button" variant="outline" onClick={resetForm}><X className="h-4 w-4" />Annuler</Button>}
          </div>
        </form>
      </CardContent>
    </Card>

    <Card variant="glass" expandable={false}>
      <CardHeader><CardTitle>Filtres</CardTitle><CardDescription>Filtrer par consommateur et période.</CardDescription></CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={filters.concerne} onChange={(e) => setFilters({ ...filters, concerne: e.target.value })}>
          <option value="">Tous les consommateurs</option>
          {consommateurs.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <Input type="date" className="w-40" value={filters.debut} onChange={(e) => setFilters({ ...filters, debut: e.target.value })} />
        <Input type="date" className="w-40" value={filters.fin} onChange={(e) => setFilters({ ...filters, fin: e.target.value })} />
        <Button size="sm" onClick={applyFilters}>Appliquer</Button>
        <Button size="sm" variant="outline" onClick={resetFilters}>Réinitialiser</Button>
      </CardContent>
    </Card>

    <Card variant="glass" expandable={false}>
      <CardHeader><CardTitle>Historique de consommation</CardTitle><CardDescription>Les points affichés correspondent aux relevés en kWh présents dans Fuseki.</CardDescription></CardHeader>
      <CardContent>{loading ? <Loading /> : chartData.length ? <div className="h-[280px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}><defs><linearGradient id="consumptionFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.55} /><stop offset="95%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" /><XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" fontSize={11} /><YAxis stroke="rgba(255,255,255,0.7)" fontSize={11} unit=" kWh" /><Tooltip formatter={(value) => [`${value} kWh`, "Consommation"]} /><Area type="monotone" dataKey="value" name="Consommation" stroke="var(--primary)" fill="url(#consumptionFill)" connectNulls /></AreaChart></ResponsiveContainer></div> : <p className="py-12 text-center text-sm text-muted-foreground">Aucune mesure en kWh datée à représenter.</p>}</CardContent>
    </Card>

    <Card variant="glass" expandable={false}>
      <CardHeader><CardTitle>Mesures</CardTitle><CardDescription>Relevés de consommation présents dans l’ontologie.</CardDescription></CardHeader>
      <CardContent>{loading ? <Loading /> : measurements.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Consommateur</th><th className="py-2 pr-3">Valeur</th><th className="py-2 pr-3">Unité</th><th className="py-2 pr-3">Source</th><th className="py-2 text-right">Actions</th></tr></thead><tbody>{measurements.map((item) => <tr key={item.id} className="border-b border-border/50"><td className="py-3 pr-3">{item.dateMesure ? new Date(item.dateMesure).toLocaleString("fr-FR") : "—"}</td><td className="py-3 pr-3">{item.concerne || "—"}</td><td className="py-3 pr-3 font-mono">{item.valeur ?? "—"}</td><td className="py-3 pr-3">{item.unite || "—"}</td><td className="py-3 pr-3">{item.sourceDonnees || "—"}</td><td className="py-3 text-right"><Button size="sm" variant="ghost" onClick={() => edit(item)}><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="ghost" onClick={() => remove(item)}><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody></table></div> : <p className="py-10 text-center text-sm text-muted-foreground">Aucune mesure de consommation enregistrée.</p>}</CardContent>
    </Card>
  </div>;
}

function Kpi({ title, value, caption }) {
  return <Card variant="glass" expandable={false}><CardContent className="p-5"><div className="text-xs text-muted-foreground">{title}</div><div className="mt-1 font-mono text-3xl font-black">{value}</div><div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><ArrowDownRight className="h-3.5 w-3.5 text-[var(--primary)]" />{caption}</div></CardContent></Card>;
}

function Loading() { return <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Chargement depuis Fuseki…</div>; }

export { ConsumptionPage as default };
