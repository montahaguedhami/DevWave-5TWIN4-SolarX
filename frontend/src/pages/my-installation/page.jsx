import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Battery, Cpu, Loader2, MapPin, Plus, ShieldCheck, Sun, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { consumerApi, localisationApi } from "@/services/semantic-api";

const inputClass = "h-10 w-full";

function MyInstallationPage() {
  const [homes, setHomes] = useState([]);
  const [cities, setCities] = useState([]);
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nom: "", surface_m2: "", localisation_id: "", equipement_ids: [] });
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  const visibleHomes = homes.filter((home) => {
    const text = `${home.nom || ""} ${home.id || ""} ${home.localisation?.nom || ""} ${(home.equipements || []).map((e) => e.nom).join(" ")}`.toLocaleLowerCase("fr");
    return text.includes(query.trim().toLocaleLowerCase("fr")) && (!cityFilter || home.localisation?.id === cityFilter);
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setHomes(await consumerApi.consumers({ type: "Maison" })); setError(""); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    refresh();
    localisationApi.villes().then(setCities).catch((err) => setError(err.message));
    consumerApi.equipment().then(setEquipmentOptions).catch((err) => setError(err.message));
  }, [refresh]);

  const startForm = (home = null) => {
    setEditing(home ? { id: home.id } : { id: null });
    setForm({ nom: home?.nom || "", surface_m2: home?.surface_m2 ?? "", localisation_id: home?.localisation?.id || "", equipement_ids: home?.equipements?.map((equipment) => equipment.id) || [] });
    setFormError("");
  };
  const closeForm = () => { setEditing(null); setFormError(""); };

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setFormError("");
    const surface = form.surface_m2 === "" ? null : Number(form.surface_m2);
    if (!form.nom.trim() || (surface !== null && (!Number.isFinite(surface) || surface <= 0))) {
      setFormError("Le nom est obligatoire et la surface doit être supérieure à zéro."); setSaving(false); return;
    }
    const body = { nom: form.nom.trim(), type: "Maison", surface_m2: surface, localisation_id: form.localisation_id || null, equipement_ids: form.equipement_ids };
    try {
      if (editing.id) await consumerApi.updateConsumer(editing.id, body);
      else await consumerApi.createConsumer(body);
      closeForm(); await refresh();
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (home) => {
    setError("");
    try { await consumerApi.deleteConsumer(home.id); await refresh(); }
    catch (err) {
      const refs = err.detail?.dependances;
      setError(refs?.length ? `${err.message} Références : ${refs.join(", ")}` : err.message);
    }
  };

  return <div className="space-y-6 pb-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight"><span className="rounded-xl border border-border bg-card/50 p-2 text-[var(--primary)]"><ShieldCheck className="h-5 w-5" /></span>Mon installation</h1><p className="mt-1 text-sm text-muted-foreground">Maisons enregistrées dans l’ontologie : nom, surface et localisation.</p></div><Button onClick={() => startForm()}><Plus className="mr-2 h-4 w-4" />Ajouter une maison</Button></div>
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-500"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</span><Button size="sm" variant="outline" onClick={refresh}>Réessayer</Button></div>}
    <div className="flex flex-col gap-3 sm:flex-row"><Input className="h-10 sm:max-w-sm" type="search" aria-label="Rechercher une maison" placeholder="Rechercher une maison, ville, équipement…" value={query} onChange={(e) => setQuery(e.target.value)} /><NativeSelect className="sm:max-w-xs" aria-label="Filtrer par ville" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}><option value="">Toutes les villes</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.nom}</option>)}</NativeSelect></div>
    {loading ? <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Chargement des installations…</div> : visibleHomes.length ? <div className="grid gap-5 lg:grid-cols-2">{visibleHomes.map((home) => <Card key={home.id} variant="glass" expandable={false}><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><Sun className="h-5 w-5 text-[var(--primary)]" />{home.nom}</CardTitle><CardDescription className="mt-1 font-mono">{home.id}</CardDescription></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => startForm(home)}>Modifier</Button><DeleteHome label={home.nom} onConfirm={() => remove(home)} /></div></div></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2"><Info icon={MapPin} label="Localisation" value={home.localisation?.nom || "—"} /><Info icon={Zap} label="Surface" value={home.surface_m2 == null ? "—" : `${home.surface_m2} m²`} /><Info icon={Cpu} label="Équipements liés" value={home.equipements?.length ? home.equipements.map((e) => e.nom).join(", ") : "—"} /><Info icon={Battery} label="Type" value={home.type} /></div></CardContent></Card>)}</div> : <Card variant="glass" expandable={false}><CardContent className="py-12 text-center text-sm text-muted-foreground">{homes.length ? "Aucune maison ne correspond aux filtres." : "Aucune maison enregistrée. Ajoutez-en une pour commencer."}</CardContent></Card>}
    <Dialog open={!!editing} onOpenChange={(open) => { if (!open) closeForm(); }}><DialogContent className="sm:max-w-lg"><form onSubmit={save} className="space-y-4"><DialogHeader><DialogTitle>{editing?.id ? "Modifier la maison" : "Ajouter une maison"}</DialogTitle><DialogDescription>Les champs et liens proposés existent dans l’ontologie.</DialogDescription></DialogHeader><label className="block space-y-1 text-sm">Nom<Input className={inputClass} required maxLength={120} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></label><label className="block space-y-1 text-sm">Surface (m², facultative)<Input className={inputClass} type="number" min="0.01" step="any" value={form.surface_m2} onChange={(e) => setForm({ ...form, surface_m2: e.target.value })} /></label><label className="block space-y-1 text-sm">Ville<NativeSelect className="w-full" value={form.localisation_id} onChange={(e) => setForm({ ...form, localisation_id: e.target.value })}><option value="">Aucune localisation</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.nom}</option>)}</NativeSelect></label><fieldset className="space-y-2"><legend className="text-sm">Équipements possédés</legend>{equipmentOptions.length ? equipmentOptions.map((equipment) => <label key={equipment.id} className="flex items-center gap-2 text-sm"><Checkbox checked={form.equipement_ids.includes(equipment.id)} onCheckedChange={(checked) => setForm({ ...form, equipement_ids: checked ? [...form.equipement_ids, equipment.id] : form.equipement_ids.filter((id) => id !== equipment.id) })} />{equipment.nom} <span className="text-xs text-muted-foreground">({equipment.type})</span></label>) : <p className="text-xs text-muted-foreground">Aucun équipement enregistré.</p>}</fieldset>{formError && <p role="alert" className="text-sm text-rose-500">{formError}</p>}<DialogFooter><Button type="button" variant="outline" onClick={closeForm}>Annuler</Button><Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button></DialogFooter></form></DialogContent></Dialog>
  </div>;
}

function Info({ icon: Icon, label, value }) { return <div className="rounded-xl border border-border bg-card/40 p-3"><div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5 text-[var(--primary)]" />{label}</div><div className="text-sm font-medium">{value}</div></div>; }

function DeleteHome({ label, onConfirm }) { return <AlertDialog><AlertDialogTrigger render={<button className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-500/30 px-3 text-sm text-rose-500" />}>Supprimer</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer cette maison ?</AlertDialogTitle><AlertDialogDescription>Supprimer « {label} » de l’ontologie ? Les références existantes peuvent empêcher la suppression.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={onConfirm}>Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>; }

export { MyInstallationPage as default };
