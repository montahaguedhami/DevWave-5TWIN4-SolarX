import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Pencil, X, Loader2, AlertTriangle, Download, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import { consommateurApi, mesureApi, localisationApi, meteoApi } from "@/services/semantic-api";

const DEFAULT_TYPES = ["Ecole", "Entreprise", "Hopital", "Maison", "Particulier", "Institution", "Usine"];
const TYPES_MESURE = ["MesureConsommation", "MesureProduction", "MesureStockage"];

const EMPTY_FORM = { id: null, nom: "", type: "Maison", surfaceM2: "", ville: "", equipements: [] };
const EMPTY_MESURE = { id: null, type: "MesureConsommation", valeur: "", unite: "kWh", dateMesure: "", sourceDonnees: "" };

const PAGE_SIZE = 10;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ConsommateursPage() {
  const [consommateurs, setConsommateurs] = useState([]);
  const [types, setTypes] = useState(DEFAULT_TYPES);
  const [equipementsRef, setEquipementsRef] = useState([]);
  const [villes, setVilles] = useState([]);
  const [stats, setStats] = useState(null);
  const [statsAvancees, setStatsAvancees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [filtreType, setFiltreType] = useState("");
  const [filtreVille, setFiltreVille] = useState("");
  const [recherche, setRecherche] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [mesures, setMesures] = useState([]);
  const [mesuresLoading, setMesuresLoading] = useState(false);
  const [mesureForm, setMesureForm] = useState(EMPTY_MESURE);
  const [mesureOpen, setMesureOpen] = useState(false);
  const [mesureSaving, setMesureSaving] = useState(false);
  const [mesureFilters, setMesureFilters] = useState({ type: "", source: "", debut: "", fin: "" });
  const [mesurePage, setMesurePage] = useState(1);

  const [alertes, setAlertes] = useState([]);
  const [weather, setWeather] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [seuil, setSeuil] = useState(30);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [thresholds, setThresholds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("consoThresholds") || "{}"); } catch { return {}; }
  });

  useEffect(() => {
    const timer = setTimeout(() => { setQ(recherche.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [recherche]);

  useEffect(() => {
    localisationApi.villes().then(setVilles).catch((e) => setMessage({ type: "error", text: e.message }));
    consommateurApi.types().then(setTypes).catch(() => {});
    consommateurApi.equipements().then(setEquipementsRef).catch(() => {});
  }, []);

  const loadConsommateurs = useCallback(() => {
    setLoading(true);
    const params = { skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE };
    if (filtreType) params.type = filtreType;
    if (filtreVille) params.ville = filtreVille;
    if (q) params.q = q;
    consommateurApi
      .list(params)
      .then(setConsommateurs)
      .catch((e) => setMessage({ type: "error", text: e.message }))
      .finally(() => setLoading(false));
  }, [filtreType, filtreVille, q, page]);

  const loadStats = useCallback(() => {
    consommateurApi.stats().then(setStats).catch(() => {});
    consommateurApi.statsAvancees().then(setStatsAvancees).catch(() => {});
    consommateurApi.alertes({ seuil, jours: 7 }).then(setAlertes).catch(() => {});
  }, [seuil]);

  const loadMesures = useCallback((id) => {
    setMesuresLoading(true);
    consommateurApi
      .mesures(id)
      .then(setMesures)
      .catch((e) => setMessage({ type: "error", text: e.message }))
      .finally(() => setMesuresLoading(false));
  }, []);

  useEffect(() => {
    loadConsommateurs();
    loadStats();
  }, [loadConsommateurs, loadStats]);

  useEffect(() => {
    if (!selected) { setSelectedDetail(null); setMesures([]); return; }
    consommateurApi.get(selected).then(setSelectedDetail).catch(() => setSelectedDetail(null));
    loadMesures(selected);
    setMesurePage(1);
  }, [selected, loadMesures]);

  useEffect(() => {
    const ville = consommateurs.find((c) => c.id === selected)?.ville;
    if (!selected || !ville) { setWeather(null); return; }
    meteoApi.actuelle(ville).then(setWeather).catch(() => setWeather(null));
  }, [selected, consommateurs]);

  const saveThreshold = (id, value) => {
    const next = { ...thresholds, [id]: Number(value) };
    setThresholds(next);
    localStorage.setItem("consoThresholds", JSON.stringify(next));
  };

  const exportCsv = () => {
    const header = ["id", "nom", "type", "ville", "surfaceM2", "nbMesures"];
    const rows = consommateurs.map((c) => [c.id, c.nom, c.type, c.villeNom || c.ville, c.surfaceM2 ?? "", c.nbMesures]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "consommateurs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const askAssistant = async () => {
    if (!question.trim()) return;
    try {
      const res = await consommateurApi.question(question);
      setAnswer(res.reponse);
    } catch (e) {
      setAnswer(e.message);
    }
  };

  const openCreate = () => {
    setMessage(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (c) => {
    setMessage(null);
    setForm({
      id: c.id,
      nom: c.nom,
      type: c.type,
      surfaceM2: c.surfaceM2 ?? "",
      ville: c.ville || "",
      equipements: (c.equipements || []).map((e) => e.id),
    });
    setFormOpen(true);
  };

  const toggleEquipement = (id) => {
    setForm((f) => ({
      ...f,
      equipements: f.equipements.includes(id) ? f.equipements.filter((x) => x !== id) : [...f.equipements, id],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const body = {
      nom: form.nom,
      type: form.type,
      surfaceM2: form.surfaceM2 === "" ? null : Number(form.surfaceM2),
      ville: form.ville,
      equipement_ids: form.equipements,
    };
    try {
      if (form.id) {
        await consommateurApi.update(form.id, body);
        setMessage({ type: "success", text: "Consommateur mis à jour." });
      } else {
        await consommateurApi.create(body);
        setMessage({ type: "success", text: "Consommateur créé." });
      }
      setFormOpen(false);
      setForm(EMPTY_FORM);
      loadConsommateurs();
      loadStats();
      if (selected === form.id) consommateurApi.get(form.id).then(setSelectedDetail).catch(() => {});
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!confirm(`Supprimer ${c.nom} ?`)) return;
    try {
      await consommateurApi.delete(c.id, false);
      setMessage({ type: "success", text: "Consommateur supprimé." });
      if (selected === c.id) setSelected(null);
      loadConsommateurs();
      loadStats();
    } catch (err) {
      if (err.status === 409) {
        const dependances = err.detail?.dependances || [];
        const details = dependances.length ? ` (${dependances.length} dépendance(s))` : "";
        if (confirm(`Ce consommateur est référencé${details}. Supprimer aussi ses mesures ?`)) {
          try {
            const res = await consommateurApi.delete(c.id, true);
            setMessage({ type: "success", text: `Consommateur supprimé (${res.mesuresSupprimees?.length ?? 0} mesure(s)).` });
            if (selected === c.id) setSelected(null);
            loadConsommateurs();
            loadStats();
          } catch (cascadeError) {
            setMessage({ type: "error", text: cascadeError.message });
          }
        }
      } else {
        setMessage({ type: "error", text: err.message });
      }
    }
  };

  const openCreateMesure = () => {
    setMessage(null);
    setMesureForm({ ...EMPTY_MESURE, dateMesure: today() });
    setMesureOpen(true);
  };

  const openEditMesure = async (m) => {
    setMessage(null);
    let detail = m;
    try {
      detail = await mesureApi.get(m.id);
    } catch {
      detail = m;
    }
    setMesureForm({
      id: detail.id,
      type: detail.type,
      valeur: detail.valeur ?? "",
      unite: detail.unite || "kWh",
      dateMesure: (detail.dateMesure || "").slice(0, 10),
      sourceDonnees: detail.sourceDonnees || "",
    });
    setMesureOpen(true);
  };

  const submitMesure = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setMesureSaving(true);
    setMessage(null);
    const body = {
      type: mesureForm.type,
      valeur: Number(mesureForm.valeur),
      unite: mesureForm.unite,
      dateMesure: mesureForm.dateMesure.includes("T") ? mesureForm.dateMesure : `${mesureForm.dateMesure}T00:00:00`,
      concerne: selected,
      sourceDonnees: mesureForm.sourceDonnees || null,
    };
    try {
      if (mesureForm.id) {
        await mesureApi.update(mesureForm.id, body);
        setMessage({ type: "success", text: "Mesure mise à jour." });
      } else {
        await mesureApi.create(body);
        setMessage({ type: "success", text: "Mesure ajoutée." });
      }
      setMesureOpen(false);
      loadMesures(selected);
      loadConsommateurs();
      loadStats();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setMesureSaving(false);
    }
  };

  const removeMesure = async (m) => {
    if (!confirm(`Supprimer la mesure ${m.id} ?`)) return;
    try {
      await mesureApi.delete(m.id);
      setMessage({ type: "success", text: "Mesure supprimée." });
      if (selected) loadMesures(selected);
      loadConsommateurs();
      loadStats();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const importMesures = async () => {
    setImporting(true);
    setMessage(null);
    try {
      const items = JSON.parse(importText);
      const created = await mesureApi.bulk(items);
      setMessage({ type: "success", text: `${created.length} mesure(s) importée(s).` });
      setImportText("");
      if (selected) loadMesures(selected);
      loadConsommateurs();
      loadStats();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setImporting(false);
    }
  };

  const mesuresFiltrees = useMemo(() => {
    const { type, source, debut, fin } = mesureFilters;
    return mesures.filter((m) => {
      if (type && m.type !== type) return false;
      if (source && !(m.sourceDonnees || "").toLowerCase().includes(source.toLowerCase())) return false;
      if (debut && (m.dateMesure || "") < `${debut}T00:00:00`) return false;
      if (fin && (m.dateMesure || "") > `${fin}T23:59:59`) return false;
      return true;
    });
  }, [mesures, mesureFilters]);

  const mesuresPageCount = Math.max(1, Math.ceil(mesuresFiltrees.length / PAGE_SIZE));
  const mesuresPage = mesuresFiltrees.slice((mesurePage - 1) * PAGE_SIZE, mesurePage * PAGE_SIZE);

  const selectedNom = consommateurs.find((c) => c.id === selected)?.nom || selectedDetail?.nom || selected;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Consommateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion des consommateurs et de leurs mesures de consommation.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nouveau consommateur</Button>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-2 text-sm ${message.type === "error" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
          <CardDescription>Filtrer par type, ville ou nom.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Input className="w-56" placeholder="Rechercher un consommateur…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={filtreType} onChange={(e) => { setFiltreType(e.target.value); setPage(1); }}>
            <option value="">Tous les types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={filtreVille} onChange={(e) => { setFiltreVille(e.target.value); setPage(1); }}>
            <option value="">Toutes les villes</option>
            {villes.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Alertes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span>Seuil %</span>
            <Input type="number" className="w-24" value={seuil} onChange={(e) => setSeuil(Number(e.target.value))} />
            <Button size="sm" onClick={loadStats}>Actualiser</Button>
          </div>
          {alertes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune alerte.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {alertes.map((a, i) => (
                <li key={i} className="text-muted-foreground">
                  <span className="font-medium text-foreground">{a.nom}</span> ({a.type}) — {a.raison}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {statsAvancees && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Consommation par type</CardTitle></CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsAvancees.consommationParType} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="type" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">Top consommateurs</CardTitle></CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsAvancees.topConsommateurs} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={11} />
                  <YAxis dataKey="nom" type="category" fontSize={11} width={120} />
                  <Tooltip />
                  <Bar dataKey="total" fill="var(--chart-2, #10b981)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Import en masse (JSON)</CardTitle>
          <CardDescription>Envoyé vers POST /mesures/bulk.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <textarea className="w-full h-24 rounded-md border border-input bg-transparent p-2 text-sm font-mono" placeholder='[{"type":"MesureConsommation","valeur":10,"unite":"kWh","dateMesure":"2026-09-30","concerne":"Maison_Djerba"}]' value={importText} onChange={(e) => setImportText(e.target.value)} />
          <Button size="sm" disabled={importing || !importText.trim()} onClick={importMesures}>{importing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Importer"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><MapPin className="w-4 h-4" /> Carte des consommateurs</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <MapContainer center={[34.6, 9.6]} zoom={6} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {consommateurs.filter((c) => c.latitude != null && c.longitude != null).map((c) => (
              <CircleMarker key={c.id} center={[c.latitude, c.longitude]} radius={8} pathOptions={{ color: "#2563eb" }}>
                <Popup>{c.nom} ({c.type}) — {c.villeNom || c.ville}</Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </CardContent>
      </Card>

      {selected && weather && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Météo — {weather.villeNom || selectedNom}</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {weather.mesures?.map((m) => (
              <span key={m.classe} className="mr-4">{m.label}: {m.valeur} {m.unite}</span>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Assistant consommation</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Input placeholder="Posez une question (ex. top consommateur)" value={question} onChange={(e) => setQuestion(e.target.value)} />
            <Button onClick={askAssistant}>Demander</Button>
          </div>
          {answer && <p className="text-sm text-muted-foreground">{answer}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liste des consommateurs</CardTitle>
          <CardDescription>
            {stats ? `${stats.totalConsommateurs} consommateur(s) · ${stats.totalMesures} mesure(s) au total` : "Chargement des statistiques…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Nom</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Ville</th>
                    <th className="text-left py-2">Surface</th>
                    <th className="text-left py-2">Équipements</th>
                    <th className="text-left py-2">Mesures</th>
                    <th className="text-left py-2">Seuil %</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {consommateurs.map((c) => (
                    <tr key={c.id} className={`border-b hover:bg-muted/40 ${selected === c.id ? "bg-muted/60" : ""}`}>
                      <td className="py-2">{c.nom}</td>
                      <td className="py-2">{c.type}</td>
                      <td className="py-2">{c.villeNom || c.ville}</td>
                      <td className="py-2">{c.surfaceM2 ?? "—"}</td>
                      <td className="py-2">{c.equipements?.length ?? 0}</td>
                      <td className="py-2">{c.nbMesures}</td>
                      <td className="py-2">
                        <Input type="number" className="w-20 h-8" value={thresholds[c.id] ?? ""} onChange={(e) => saveThreshold(c.id, e.target.value)} />
                      </td>
                      <td className="py-2 text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => setSelected(c.id)}>Mesures</Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(c)}><Trash2 className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))}
                  {consommateurs.length === 0 && (
                    <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">Aucun consommateur</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-3">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Précédent</Button>
            <span className="text-sm self-center">Page {page}</span>
            <Button size="sm" variant="outline" disabled={consommateurs.length < PAGE_SIZE} onClick={() => setPage((p) => p + 1)}>Suivant</Button>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between gap-2">
              <span>Mesures — {selectedNom} ({mesures.length})</span>
              <Button size="sm" onClick={openCreateMesure}><Plus className="w-4 h-4 mr-1" />Ajouter</Button>
            </CardTitle>
            {selectedDetail?.equipements?.length > 0 && (
              <CardDescription>Équipements : {selectedDetail.equipements.map((e) => e.nom).join(", ")}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap text-sm">
              <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={mesureFilters.type} onChange={(e) => { setMesureFilters({ ...mesureFilters, type: e.target.value }); setMesurePage(1); }}>
                <option value="">Tous types</option>
                {TYPES_MESURE.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <Input placeholder="Source" className="w-32" value={mesureFilters.source} onChange={(e) => { setMesureFilters({ ...mesureFilters, source: e.target.value }); setMesurePage(1); }} />
              <Input type="date" className="w-40" value={mesureFilters.debut} onChange={(e) => { setMesureFilters({ ...mesureFilters, debut: e.target.value }); setMesurePage(1); }} />
              <Input type="date" className="w-40" value={mesureFilters.fin} onChange={(e) => { setMesureFilters({ ...mesureFilters, fin: e.target.value }); setMesurePage(1); }} />
              {(mesureFilters.type || mesureFilters.source || mesureFilters.debut || mesureFilters.fin) && (
                <Button size="sm" variant="ghost" onClick={() => { setMesureFilters({ type: "", source: "", debut: "", fin: "" }); setMesurePage(1); }}>Réinitialiser</Button>
              )}
            </div>

            {mesuresLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Valeur</th>
                      <th className="text-left py-2">Unité</th>
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Source</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mesuresPage.map((m) => (
                      <tr key={m.id} className="border-b hover:bg-muted/40">
                        <td className="py-2">{m.type}</td>
                        <td className="py-2">{m.valeur}</td>
                        <td className="py-2">{m.unite}</td>
                        <td className="py-2">{m.dateMesure}</td>
                        <td className="py-2">{m.sourceDonnees || "—"}</td>
                        <td className="py-2 text-right">
                          <Button size="sm" variant="ghost" onClick={() => openEditMesure(m)}><Pencil className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => removeMesure(m)}><Trash2 className="w-4 h-4" /></Button>
                        </td>
                      </tr>
                    ))}
                    {mesuresPage.length === 0 && (
                      <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Aucune mesure</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {mesuresFiltrees.length > 0 && (
              <div className="h-[220px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...mesuresFiltrees].sort((a, b) => a.dateMesure.localeCompare(b.dateMesure))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="dateMesure" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Line type="monotone" dataKey="valeur" stroke="var(--primary)" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-3">
              <Button size="sm" variant="outline" disabled={mesurePage <= 1} onClick={() => setMesurePage((p) => Math.max(1, p - 1))}>Précédent</Button>
              <span className="text-sm self-center">Page {mesurePage} / {mesuresPageCount}</span>
              <Button size="sm" variant="outline" disabled={mesurePage >= mesuresPageCount} onClick={() => setMesurePage((p) => p + 1)}>Suivant</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Modifier un consommateur" : "Nouveau consommateur"}</DialogTitle>
            <DialogDescription>Rattachez le consommateur à une ville et à ses équipements.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="grid grid-cols-1 gap-3">
            <Input placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
            <div className="grid grid-cols-2 gap-3">
              <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <Input placeholder="Surface m²" type="number" min="0" value={form.surfaceM2} onChange={(e) => setForm({ ...form, surfaceM2: e.target.value })} />
            </div>
            <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} required>
              <option value="">-- Ville --</option>
              {villes.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
            </select>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Équipements</p>
              <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-input p-2">
                {equipementsRef.length === 0 && <p className="text-xs text-muted-foreground">Aucun équipement disponible.</p>}
                {equipementsRef.map((eq) => (
                  <label key={eq.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.equipements.includes(eq.id)} onChange={() => toggleEquipement(eq.id)} />
                    <span>{eq.nom} <span className="text-muted-foreground">({eq.type})</span></span>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}><X className="w-4 h-4" /> Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : form.id ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{form.id ? "Mettre à jour" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={mesureOpen} onOpenChange={setMesureOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mesureForm.id ? "Modifier la mesure" : "Nouvelle mesure"}</DialogTitle>
            <DialogDescription>{selectedNom}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitMesure} className="grid grid-cols-1 gap-3">
            <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={mesureForm.type} onChange={(e) => setMesureForm({ ...mesureForm, type: e.target.value })}>
              {TYPES_MESURE.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Valeur" type="number" min="0" step="0.01" value={mesureForm.valeur} onChange={(e) => setMesureForm({ ...mesureForm, valeur: e.target.value })} required />
              <Input placeholder="Unité" value={mesureForm.unite} onChange={(e) => setMesureForm({ ...mesureForm, unite: e.target.value })} required />
            </div>
            <Input type="date" value={mesureForm.dateMesure} onChange={(e) => setMesureForm({ ...mesureForm, dateMesure: e.target.value })} required />
            <Input placeholder="Source (optionnel)" value={mesureForm.sourceDonnees} onChange={(e) => setMesureForm({ ...mesureForm, sourceDonnees: e.target.value })} />
            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setMesureOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={mesureSaving}>{mesureSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : mesureForm.id ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{mesureForm.id ? "Mettre à jour" : "Ajouter"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
