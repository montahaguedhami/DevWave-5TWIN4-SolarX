import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, PieChart as PieChartIcon, Plus, Sun } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { localisationApi, productionApi } from "@/services/semantic-api";

const SOURCE_TYPES = ["Solaire", "Eolienne", "Hydraulique"];
const INSTALLATION_TYPES = ["CentraleSolaire", "ParcEolien", "CentraleHydraulique"];
const SOURCE_LABELS = { Solaire: "Solaire", Eolienne: "Éolienne", Hydraulique: "Hydraulique" };
const SOURCE_COLORS = { Solaire: "#eab308", Eolienne: "#0ea5e9", Hydraulique: "#14b8a6" };
const control = "h-10 w-full";

function ProductionPage() {
  const [stats, setStats] = useState(null);
  const [installations, setInstallations] = useState([]);
  const [sources, setSources] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [allInstallations, setAllInstallations] = useState([]);
  const [villes, setVilles] = useState([]);
  const [filters, setFilters] = useState({ source: "", type: "" });
  const [installQuery, setInstallQuery] = useState("");
  const [sourceQuery, setSourceQuery] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [measurementQuery, setMeasurementQuery] = useState("");
  const [tab, setTab] = useState("installations");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [installForm, setInstallForm] = useState({ nom: "", type: INSTALLATION_TYPES[0], puissance_kw: "", ville_id: "", source_id: "" });
  const [sourceForm, setSourceForm] = useState({ nom: "", type: SOURCE_TYPES[0] });
  const [measurementForm, setMeasurementForm] = useState({ installation_id: "", date_mesure: "", valeur: "", unite: "kWh" });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextStats, nextInstallations, nextSources, nextMeasurements, nextAllInstallations] = await Promise.all([
        productionApi.stats(), productionApi.installations(filters), productionApi.sources(), productionApi.measurements(), productionApi.installations(),
      ]);
      setStats(nextStats); setInstallations(nextInstallations); setSources(nextSources); setMeasurements(nextMeasurements); setAllInstallations(nextAllInstallations); setError("");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { localisationApi.villes().then((data) => setVilles(Array.isArray(data) ? data : data?.items || [])).catch(() => setVilles([])); }, []);

  const closeForm = () => { setEditing(null); setFormError(""); };
  const startInstall = (item = null) => {
    setEditing({ kind: "installation", id: item?.id || null });
    setInstallForm(item ? { nom: item.nom || "", type: item.type, puissance_kw: item.puissance_kw ?? "", ville_id: item.ville?.id || "", source_id: item.source_deduite ? "" : item.source?.id || "" } : { nom: "", type: INSTALLATION_TYPES[0], puissance_kw: "", ville_id: "", source_id: "" });
    setFormError("");
  };
  const startSource = (item = null) => { setEditing({ kind: "source", id: item?.id || null }); setSourceForm(item ? { nom: item.nom, type: item.type } : { nom: "", type: SOURCE_TYPES[0] }); setFormError(""); };
  const startMeasurement = (item = null) => {
    setEditing({ kind: "measurement", id: item?.id || null });
    setMeasurementForm({
      installation_id: item?.installation_id || allInstallations[0]?.id || "",
      date_mesure: item?.date_mesure ? toLocalInput(item.date_mesure) : toLocalInput(new Date()),
      valeur: item?.valeur ?? "",
      unite: item?.unite || "kWh",
    });
    setFormError("");
  };

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setFormError("");
    try {
      if (editing.kind === "installation") {
        const body = { nom: installForm.nom.trim(), type: installForm.type, puissance_kw: installForm.puissance_kw === "" ? null : Number(installForm.puissance_kw), ville_id: installForm.ville_id || null, source_id: installForm.source_id || null };
        if (!body.nom || (body.puissance_kw !== null && (!Number.isFinite(body.puissance_kw) || body.puissance_kw <= 0))) throw new Error("Saisissez un nom et une puissance supérieure à zéro.");
        if (editing.id) await productionApi.updateInstallation(editing.id, body); else await productionApi.createInstallation(body);
      } else if (editing.kind === "source") {
        const body = { nom: sourceForm.nom.trim(), type: sourceForm.type };
        if (!body.nom) throw new Error("Le nom est obligatoire.");
        if (editing.id) await productionApi.updateSource(editing.id, body); else await productionApi.createSource(body);
      } else {
        const value = Number(measurementForm.valeur);
        if (!measurementForm.installation_id || !measurementForm.date_mesure || !measurementForm.unite.trim() || !Number.isFinite(value) || value < 0) throw new Error("Sélectionnez une installation et une date, puis saisissez une valeur positive ou nulle et une unité.");
        const body = { installation_id: measurementForm.installation_id, date_mesure: measurementForm.date_mesure, valeur: value, unite: measurementForm.unite.trim() };
        if (editing.id) await productionApi.updateMeasurement(editing.id, body); else await productionApi.createMeasurement(body);
      }
      closeForm(); await refresh();
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (kind, item) => {
    setError("");
    try {
      if (kind === "installation") await productionApi.deleteInstallation(item.id);
      else if (kind === "source") await productionApi.deleteSource(item.id);
      else await productionApi.deleteMeasurement(item.id);
      await refresh();
    }
    catch (err) { const refs = err.detail?.dependances; setError(refs?.length ? `${err.message} Références : ${refs.join(", ")}` : err.message); }
  };

  const statsBySource = Object.fromEntries((stats?.sources || []).map((item) => [item.source, item]));
  const pieData = (stats?.sources || []).filter((item) => item.puissance_totale_kw > 0).map((item) => ({ name: SOURCE_LABELS[item.source] || item.source, source: item.source, value: item.puissance_totale_kw }));
  const visibleInstallations = installations.filter((item) => `${item.nom || ""} ${item.id || ""} ${item.type || ""} ${item.ville?.nom || ""} ${item.source?.nom || item.source?.type || ""}`.toLocaleLowerCase("fr").includes(installQuery.trim().toLocaleLowerCase("fr")));
  const visibleSources = sources.filter((item) => (!sourceType || item.type === sourceType) && `${item.nom || ""} ${item.id || ""} ${item.type || ""}`.toLocaleLowerCase("fr").includes(sourceQuery.trim().toLocaleLowerCase("fr")));
  const visibleMeasurements = measurements.filter((item) => `${item.id || ""} ${item.installation_nom || ""} ${item.installation_id || ""} ${item.date_mesure || ""} ${item.valeur ?? ""} ${item.unite || ""}`.toLocaleLowerCase("fr").includes(measurementQuery.trim().toLocaleLowerCase("fr")));

  return <div className="space-y-6 pb-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight"><span className="rounded-xl border border-border bg-card/50 p-2 text-[var(--primary)]"><Sun className="h-5 w-5" /></span>Production</h1><p className="mt-1 text-sm text-muted-foreground">Installations, sources d’énergie et statistiques de production.</p></div>{stats && <div className="rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">{stats.total.nombre_installations} installation(s) · {stats.total.puissance_totale_kw} kW</div>}</div>
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-500"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</span><Button size="sm" variant="outline" onClick={refresh}>Réessayer</Button></div>}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{SOURCE_TYPES.map((source) => { const item = statsBySource[source]; return <Card key={source} variant="glass" expandable={false}><CardContent className="p-5"><div className="flex items-center justify-between"><div className="text-sm font-semibold text-muted-foreground">{SOURCE_LABELS[source]}</div><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SOURCE_COLORS[source] }} /></div><div className="mt-2 text-2xl font-black">{item?.nombre_installations ?? 0} <span className="text-sm font-medium text-muted-foreground">installation(s)</span></div><div className="mt-1 flex justify-between text-sm"><span>{item?.puissance_totale_kw ?? 0} kW</span><span className="text-muted-foreground">{item?.part_pct ?? 0}%</span></div><div className="mt-2 text-xs text-muted-foreground">Production mesurée : {item?.production_mesuree_kwh ?? 0} kWh</div></CardContent></Card>; })}</div>
    <Card variant="glass" expandable={false}><CardHeader><CardTitle className="flex items-center gap-2"><PieChartIcon className="h-4 w-4 text-[var(--primary)]" />Répartition de la puissance installée</CardTitle><CardDescription>Part de la puissance totale par source d’énergie.</CardDescription></CardHeader><CardContent>{loading ? <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Chargement…</div> : pieData.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96}>{pieData.map((entry) => <Cell key={entry.source} fill={SOURCE_COLORS[entry.source]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div> : <p className="py-12 text-center text-sm text-muted-foreground">Aucune puissance installée à représenter.</p>}</CardContent></Card>
    <Card variant="glass" expandable={false}><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Gestion de la production</CardTitle><CardDescription>Modifiez les installations et les sources présentes dans l’ontologie.</CardDescription></div><Button onClick={() => tab === "installations" ? startInstall() : tab === "sources" ? startSource() : startMeasurement()}><Plus className="mr-2 h-4 w-4" />Ajouter {tab === "installations" ? "une installation" : tab === "sources" ? "une source" : "un releve"}</Button></div></CardHeader><CardContent>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList><TabsTrigger value="installations">Installations</TabsTrigger><TabsTrigger value="sources">Sources d’énergie</TabsTrigger><TabsTrigger value="measurements">Releves</TabsTrigger></TabsList>
        <TabsContent value="installations"><div className="mb-4 flex flex-wrap gap-2"><Input className="h-10 sm:max-w-sm" type="search" aria-label="Rechercher une installation" placeholder="Rechercher une installation…" value={installQuery} onChange={(e) => setInstallQuery(e.target.value)} /><NativeSelect aria-label="Filtrer par source" value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}><option value="">Toutes les sources</option>{SOURCE_TYPES.map((s) => <option key={s}>{s}</option>)}</NativeSelect><NativeSelect aria-label="Filtrer par type" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}><option value="">Tous les types</option>{INSTALLATION_TYPES.map((t) => <option key={t}>{t}</option>)}</NativeSelect></div><Table loading={loading} empty={!visibleInstallations.length} emptyText={installations.length ? "Aucune installation ne correspond aux filtres." : "Aucune installation."} headers={["Nom", "Type", "Puissance (kW)", "Ville", "Source", "Actions"]}>{visibleInstallations.map((item) => <tr key={item.id} className="border-b border-border/50"><td className="py-3 pr-3"><b>{item.nom}</b><div className="text-xs text-muted-foreground">{item.id}</div></td><td>{item.type}</td><td>{item.puissance_kw ?? "—"}</td><td>{item.ville?.nom || "—"}</td><td>{item.source?.nom || item.source?.type || "—"}{item.source_deduite && <small className="ml-1 text-amber-500">(déduite)</small>}</td><td className="space-x-2"><button className="text-primary" onClick={() => startInstall(item)}>Modifier</button><DeleteAction label={item.nom} onConfirm={() => remove("installation", item)} /></td></tr>)}</Table></TabsContent>
<TabsContent value="measurements"><div className="mb-4"><Input className="h-10 sm:max-w-sm" type="search" aria-label="Rechercher un releve de production" placeholder="Rechercher installation, date, unite..." value={measurementQuery} onChange={(e) => setMeasurementQuery(e.target.value)} /></div><Table loading={loading} empty={!visibleMeasurements.length} emptyText={measurements.length ? "Aucun releve ne correspond a la recherche." : "Aucun releve de production enregistre."} headers={["Date", "Installation", "Valeur", "Unite", "Actions"]}>{visibleMeasurements.map((item) => <tr key={item.id} className="border-b border-border/50"><td className="py-3 pr-3">{item.date_mesure ? new Date(item.date_mesure).toLocaleString("fr-FR") : "-"}</td><td className="py-3 pr-3">{item.installation_nom || item.installation_id || "-"}</td><td className="py-3 pr-3 font-mono">{item.valeur ?? "-"}</td><td className="py-3 pr-3">{item.unite || "-"}</td><td className="space-x-2"><button className="text-primary" onClick={() => startMeasurement(item)}>Modifier</button><DeleteAction label={item.id} onConfirm={() => remove("measurement", item)} /></td></tr>)}</Table></TabsContent>
        <TabsContent value="sources"><div className="mb-4 flex flex-wrap gap-2"><Input className="h-10 sm:max-w-sm" type="search" aria-label="Rechercher une source" placeholder="Rechercher une source…" value={sourceQuery} onChange={(e) => setSourceQuery(e.target.value)} /><NativeSelect aria-label="Filtrer par type de source" value={sourceType} onChange={(e) => setSourceType(e.target.value)}><option value="">Tous les types</option>{SOURCE_TYPES.map((type) => <option key={type}>{type}</option>)}</NativeSelect></div><Table loading={loading} empty={!visibleSources.length} emptyText={sources.length ? "Aucune source ne correspond aux filtres." : "Aucune source d’énergie."} headers={["Nom", "Type", "Installations liées", "Actions"]}>{visibleSources.map((item) => <tr key={item.id} className="border-b border-border/50"><td className="py-3 pr-3"><b>{item.nom}</b><div className="text-xs text-muted-foreground">{item.id}</div></td><td>{SOURCE_LABELS[item.type] || item.type}</td><td>{item.nombre_installations}</td><td className="space-x-2"><button className="text-primary" onClick={() => startSource(item)}>Modifier</button><DeleteAction label={item.nom} onConfirm={() => remove("source", item)} /></td></tr>)}</Table></TabsContent>
      </Tabs>
    </CardContent></Card>
    <Dialog open={!!editing} onOpenChange={(open) => { if (!open) closeForm(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><form onSubmit={save} className="space-y-4"><DialogHeader><DialogTitle>{editing?.id ? "Modifier" : "Ajouter"} {editing?.kind === "installation" ? "une installation" : editing?.kind === "source" ? "une source" : "un releve de production"}</DialogTitle><DialogDescription>Les modifications sont enregistrées dans le système.</DialogDescription></DialogHeader>{editing?.kind === "installation" ? <><label className="block space-y-1 text-sm">Nom<Input className={control} required maxLength={120} value={installForm.nom} onChange={(e) => setInstallForm({ ...installForm, nom: e.target.value })} /></label><label className="block space-y-1 text-sm">Type<NativeSelect className="w-full" value={installForm.type} onChange={(e) => setInstallForm({ ...installForm, type: e.target.value })}>{INSTALLATION_TYPES.map((t) => <option key={t}>{t}</option>)}</NativeSelect></label><label className="block space-y-1 text-sm">Puissance (kW, facultative)<Input className={control} type="number" min="0.001" step="any" value={installForm.puissance_kw} onChange={(e) => setInstallForm({ ...installForm, puissance_kw: e.target.value })} /></label><label className="block space-y-1 text-sm">Ville<NativeSelect className="w-full" value={installForm.ville_id} onChange={(e) => setInstallForm({ ...installForm, ville_id: e.target.value })}><option value="">Aucune ville</option>{villes.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}</NativeSelect></label><label className="block space-y-1 text-sm">Source<NativeSelect className="w-full" value={installForm.source_id} onChange={(e) => setInstallForm({ ...installForm, source_id: e.target.value })}><option value="">Aucune source (déduite du type)</option>{sources.map((s) => <option key={s.id} value={s.id}>{s.nom} · {SOURCE_LABELS[s.type] || s.type}</option>)}</NativeSelect></label></> : editing?.kind === "source" ? <><label className="block space-y-1 text-sm">Nom<Input className={control} required maxLength={120} value={sourceForm.nom} onChange={(e) => setSourceForm({ ...sourceForm, nom: e.target.value })} /></label><label className="block space-y-1 text-sm">Type<NativeSelect className="w-full" value={sourceForm.type} onChange={(e) => setSourceForm({ ...sourceForm, type: e.target.value })}>{SOURCE_TYPES.map((t) => <option key={t}>{t}</option>)}</NativeSelect></label></> : <><label className="block space-y-1 text-sm">Installation<NativeSelect className="w-full" required value={measurementForm.installation_id} onChange={(e) => setMeasurementForm({ ...measurementForm, installation_id: e.target.value })}><option value="">Selectionner une installation</option>{allInstallations.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}</NativeSelect></label><label className="block space-y-1 text-sm">Date et heure<Input className={control} type="datetime-local" required value={measurementForm.date_mesure} onChange={(e) => setMeasurementForm({ ...measurementForm, date_mesure: e.target.value })} /></label><div className="grid gap-3 sm:grid-cols-2"><label className="block space-y-1 text-sm">Valeur<Input className={control} type="number" min="0" step="any" required value={measurementForm.valeur} onChange={(e) => setMeasurementForm({ ...measurementForm, valeur: e.target.value })} /></label><label className="block space-y-1 text-sm">Unite<Input className={control} required maxLength={24} value={measurementForm.unite} onChange={(e) => setMeasurementForm({ ...measurementForm, unite: e.target.value })} /></label></div></>}{formError && <p role="alert" className="text-sm text-rose-500">{formError}</p>}<DialogFooter><Button type="button" variant="outline" onClick={closeForm}>Annuler</Button><Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button></DialogFooter></form></DialogContent></Dialog>
  </div>;
}

function toLocalInput(date) { const d = new Date(date); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }

function Table({ loading, empty, emptyText, headers, children }) { return loading ? <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Chargement…</div> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b border-border text-xs text-muted-foreground">{headers.map((h) => <th key={h} className="py-2 pr-3">{h}</th>)}</tr></thead><tbody>{children}{empty && <tr><td colSpan={headers.length} className="py-8 text-center text-muted-foreground">{emptyText}</td></tr>}</tbody></table></div>; }

function DeleteAction({ label, onConfirm }) { return <AlertDialog><AlertDialogTrigger render={<button className="text-rose-500" />}>Supprimer</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmer la suppression</AlertDialogTitle><AlertDialogDescription>Supprimer « {label} » ? Cette action est définitive.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={onConfirm}>Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>; }

export { ProductionPage as default };
