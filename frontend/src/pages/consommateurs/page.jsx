import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { consommateurApi, mesureApi, localisationApi } from "@/services/semantic-api";

const TYPES_CONSOMMATEUR = ["Ecole", "Entreprise", "Hopital", "Maison", "Particulier", "Institution", "Usine"];
const TYPES_MESURE = ["MesureConsommation", "MesureProduction", "MesureStockage"];

const EMPTY_FORM = { id: null, nom: "", type: "Maison", surfaceM2: "", ville: "" };
const EMPTY_MESURE = { type: "MesureConsommation", valeur: "", unite: "kWh", dateMesure: "", concerne: "", sourceDonnees: "" };

export default function ConsommateursPage() {
  const [consommateurs, setConsommateurs] = useState([]);
  const [villes, setVilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mesures, setMesures] = useState([]);
  const [mesureForm, setMesureForm] = useState(EMPTY_MESURE);
  const [mesureSaving, setMesureSaving] = useState(false);
  const [filtreType, setFiltreType] = useState("");
  const [filtreVille, setFiltreVille] = useState("");

  const loadVilles = useCallback(() => {
    localisationApi.villes().then(setVilles).catch((e) => setMessage({ type: "error", text: e.message }));
  }, []);

  const loadConsommateurs = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filtreType) params.type = filtreType;
    if (filtreVille) params.ville = filtreVille;
    consommateurApi
      .list(params)
      .then(setConsommateurs)
      .catch((e) => setMessage({ type: "error", text: e.message }))
      .finally(() => setLoading(false));
  }, [filtreType, filtreVille]);

  useEffect(() => {
    loadVilles();
  }, [loadVilles]);

  useEffect(() => {
    loadConsommateurs();
  }, [loadConsommateurs]);

  const loadMesures = useCallback((id) => {
    consommateurApi
      .mesures(id)
      .then(setMesures)
      .catch((e) => setMessage({ type: "error", text: e.message }));
  }, []);

  const resetForm = () => setForm(EMPTY_FORM);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const body = {
      nom: form.nom,
      type: form.type,
      surfaceM2: form.surfaceM2 === "" ? null : Number(form.surfaceM2),
      ville: form.ville,
    };
    try {
      if (form.id) {
        await consommateurApi.update(form.id, body);
        setMessage({ type: "success", text: "Consommateur mis à jour." });
      } else {
        await consommateurApi.create(body);
        setMessage({ type: "success", text: "Consommateur créé." });
      }
      resetForm();
      loadConsommateurs();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const edit = (c) => {
    setForm({ id: c.id, nom: c.nom, type: c.type, surfaceM2: c.surfaceM2 ?? "", ville: c.ville || "" });
  };

  const remove = async (c) => {
    if (!confirm(`Supprimer ${c.nom} ?`)) return;
    try {
      await consommateurApi.delete(c.id, false);
      setMessage({ type: "success", text: "Consommateur supprimé." });
      if (selected === c.id) {
        setSelected(null);
        setMesures([]);
      }
      loadConsommateurs();
    } catch (err) {
      if (err?.status === 409 && err?.detail?.requiresCascade) {
        if (confirm(`Ce consommateur a ${err.detail.mesures.length} mesure(s). Supprimer aussi ?`)) {
          await consommateurApi.delete(c.id, true);
          setMessage({ type: "success", text: "Consommateur et mesures supprimés." });
          if (selected === c.id) {
            setSelected(null);
            setMesures([]);
          }
          loadConsommateurs();
        }
      } else {
        setMessage({ type: "error", text: err.message });
      }
    }
  };

  const selectConsumer = (c) => {
    setSelected(c.id);
    setMesureForm((f) => ({ ...f, concerne: c.id }));
    loadMesures(c.id);
  };

  const submitMesure = async (e) => {
    e.preventDefault();
    setMesureSaving(true);
    setMessage(null);
    const body = {
      type: mesureForm.type,
      valeur: Number(mesureForm.valeur),
      unite: mesureForm.unite,
      dateMesure: mesureForm.dateMesure.includes("T") ? mesureForm.dateMesure : `${mesureForm.dateMesure}T00:00:00`,
      concerne: mesureForm.concerne,
      sourceDonnees: mesureForm.sourceDonnees || null,
    };
    try {
      await mesureApi.create(body);
      setMessage({ type: "success", text: "Mesure ajoutée." });
      setMesureForm((f) => ({ ...EMPTY_MESURE, concerne: f.concerne }));
      if (selected) loadMesures(selected);
      loadConsommateurs();
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
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Consommateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion des consommateurs et de leurs mesures de consommation.</p>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-2 text-sm ${message.type === "error" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{form.id ? "Modifier un consommateur" : "Nouveau consommateur"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
            <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES_CONSOMMATEUR.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <Input placeholder="Surface m²" type="number" value={form.surfaceM2} onChange={(e) => setForm({ ...form, surfaceM2: e.target.value })} />
            <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} required>
              <option value="">-- Ville --</option>
              {villes.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
            </select>
            <div className="md:col-span-4 flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : form.id ? "Mettre à jour" : "Créer"}</Button>
              {form.id && <Button type="button" variant="outline" onClick={resetForm}><X className="w-4 h-4" /> Annuler</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={filtreType} onChange={(e) => setFiltreType(e.target.value)}>
            <option value="">Tous les types</option>
            {TYPES_CONSOMMATEUR.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={filtreVille} onChange={(e) => setFiltreVille(e.target.value)}>
            <option value="">Toutes les villes</option>
            {villes.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liste des consommateurs</CardTitle>
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
                    <th className="text-left py-2">Mesures</th>
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
                      <td className="py-2">{c.nbMesures}</td>
                      <td className="py-2 text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => selectConsumer(c)}>Mesures</Button>
                        <Button size="sm" variant="ghost" onClick={() => edit(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(c)}><Trash2 className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))}
                  {consommateurs.length === 0 && (
                    <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Aucun consommateur</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mesures — {consommateurs.find((c) => c.id === selected)?.nom}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={submitMesure} className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={mesureForm.type} onChange={(e) => setMesureForm({ ...mesureForm, type: e.target.value })}>
                {TYPES_MESURE.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <Input placeholder="Valeur" type="number" value={mesureForm.valeur} onChange={(e) => setMesureForm({ ...mesureForm, valeur: e.target.value })} required />
              <Input placeholder="Unité" value={mesureForm.unite} onChange={(e) => setMesureForm({ ...mesureForm, unite: e.target.value })} required />
              <Input placeholder="Date (YYYY-MM-DD)" value={mesureForm.dateMesure} onChange={(e) => setMesureForm({ ...mesureForm, dateMesure: e.target.value })} required />
              <Input placeholder="Source" value={mesureForm.sourceDonnees} onChange={(e) => setMesureForm({ ...mesureForm, sourceDonnees: e.target.value })} />
              <Button type="submit" disabled={mesureSaving}>{mesureSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}</Button>
            </form>

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
                  {mesures.map((m) => (
                    <tr key={m.id} className="border-b hover:bg-muted/40">
                      <td className="py-2">{m.type}</td>
                      <td className="py-2">{m.valeur}</td>
                      <td className="py-2">{m.unite}</td>
                      <td className="py-2">{m.dateMesure}</td>
                      <td className="py-2">{m.sourceDonnees || "—"}</td>
                      <td className="py-2 text-right">
                        <Button size="sm" variant="ghost" onClick={() => removeMesure(m)}><Trash2 className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))}
                  {mesures.length === 0 && (
                    <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Aucune mesure</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}