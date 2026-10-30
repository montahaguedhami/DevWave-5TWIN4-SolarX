import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { ChevronLeft, ChevronRight, CloudSun, Loader2, MapPin, Pencil, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { localisationApi } from "@/services/semantic-api";

const TUNISIA_CENTER = [34.6, 9.6];
const REGION_COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6", "#ef4444", "#14b8a6"];
const EMPTY_FORM = { mode: null, id: null, nom: "", region: "", latitude: "", longitude: "" };
const PAGE_SIZES = [5, 10, 20, 50];
const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30";

function MapClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
}

function FlyToVille({ ville }) {
  const map = useMap();
  useEffect(() => {
    if (ville?.latitude != null && ville?.longitude != null) map.flyTo([ville.latitude, ville.longitude], 9);
  }, [ville, map]);
  return null;
}

function LocalisationPage() {
  const navigate = useNavigate();
  const [villes, setVilles] = useState([]);
  const [regions, setRegions] = useState([]);
  const [q, setQ] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(null);
  const [geo, setGeo] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const regionColor = useMemo(
    () => Object.fromEntries(regions.map((r, i) => [r.id, REGION_COLORS[i % REGION_COLORS.length]])),
    [regions]
  );

  const loadRegions = useCallback(() => {
    localisationApi.regions().then(setRegions).catch((e) => setMessage({ type: "error", text: e.message }));
  }, []);

  const loadVilles = useCallback(() => {
    setLoading(true);
    return localisationApi
      .villes({ q, region: regionFilter })
      .then(setVilles)
      .catch((e) => setMessage({ type: "error", text: e.message }))
      .finally(() => setLoading(false));
  }, [q, regionFilter]);

  useEffect(loadRegions, [loadRegions]);
  useEffect(() => {
    const t = setTimeout(loadVilles, 250);
    return () => clearTimeout(t);
  }, [loadVilles]);

  useEffect(() => setPage(1), [q, regionFilter, pageSize]);

  const nbPages = Math.max(1, Math.ceil(villes.length / pageSize));
  const pageCourante = Math.min(page, nbPages);
  const villesPage = villes.slice((pageCourante - 1) * pageSize, pageCourante * pageSize);

  const resetFilters = () => {
    setQ("");
    setRegionFilter("");
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, mode: "create", region: regions[0]?.id || "" });
    setGeo(null);
    setMessage(null);
  };

  const openEdit = (v) => {
    setForm({
      mode: "edit",
      id: v.id,
      nom: v.nom,
      region: v.region || regions[0]?.id || "",
      latitude: v.latitude ?? "",
      longitude: v.longitude ?? "",
    });
    setGeo(null);
    setFocused(v);
    setMessage(null);
  };

  const closeForm = () => {
    setForm(EMPTY_FORM);
    setGeo(null);
  };

  const handleMapClick = async ({ lat, lng }) => {
    const coords = { latitude: lat.toFixed(4), longitude: lng.toFixed(4) };
    if (form.mode === "edit") {
      setForm((f) => ({ ...f, ...coords }));
      return;
    }
    // Clicking anywhere on the map starts a new city with the fields filled in.
    setForm({ ...EMPTY_FORM, mode: "create", region: regions[0]?.id || "", ...coords });
    setGeo(null);
    setMessage(null);
    setGeoLoading(true);
    try {
      const result = await localisationApi.geocodageInverse(lat, lng);
      setGeo(result);
      setForm((f) => ({
        ...f,
        nom: result.nom || f.nom,
        region: result.regionSuggeree || f.region,
      }));
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nom: form.nom.trim(),
      region: form.region,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    };
    if (!payload.nom || !payload.region || Number.isNaN(payload.latitude) || Number.isNaN(payload.longitude)) {
      setMessage({ type: "error", text: "Nom, région, latitude et longitude sont obligatoires." });
      return;
    }
    setSaving(true);
    try {
      const ville =
        form.mode === "create"
          ? await localisationApi.createVille(payload)
          : await localisationApi.updateVille(form.id, payload);
      setMessage({
        type: "success",
        text: `Ville « ${ville.nom} » ${form.mode === "create" ? "ajoutée" : "modifiée"}.`,
      });
      closeForm();
      setFocused(ville);
      await loadVilles();
      loadRegions();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`Supprimer la ville « ${v.nom} » de l'ontologie ?`)) return;
    try {
      let result;
      try {
        result = await localisationApi.deleteVille(v.id);
      } catch (err) {
        if (err.status === 409 && err.detail?.requiresCascade) {
          if (!window.confirm(err.detail.message)) return;
          result = await localisationApi.deleteVille(v.id, true);
        } else throw err;
      }
      const extra = result.mesuresSupprimees?.length ? ` et ${result.mesuresSupprimees.length} mesure(s) météo` : "";
      setMessage({ type: "success", text: `Ville « ${v.nom} »${extra} supprimée(s).` });
      if (form.id === v.id) closeForm();
      await loadVilles();
      loadRegions();
    } catch (err) {
      const deps = err.detail?.dependances?.length ? ` Liée à : ${err.detail.dependances.join(", ")}.` : "";
      setMessage({ type: "error", text: `${err.message}${deps}` });
    }
  };

  const voirMeteo = (v) => navigate(`/meteo?ville=${encodeURIComponent(v.id)}`);
  const mappable = villes.filter((v) => v.latitude != null && v.longitude != null);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-[var(--primary)] border border-border">
              <MapPin className="w-5 h-5" />
            </div>
            Localisation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les villes et leurs régions. Cliquez sur la carte pour ajouter une ville.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> Ajouter une ville
        </Button>
      </div>

      {message && (
        <div
          className={`flex items-start justify-between gap-3 p-3 rounded-xl border text-sm ${
            message.type === "error"
              ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
          }`}
        >
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <div className="relative md:w-72">
          <Search className="absolute left-2.5 top-2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une ville..." className="pl-8" />
        </div>
        <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className={selectClass}>
          <option value="">Toutes les régions</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nom} ({r.nbVilles})
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={resetFilters} disabled={!q && !regionFilter}>
          <RotateCcw /> Réinitialiser
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card variant="glass" expandable={false} className={form.mode ? "lg:col-span-3" : "lg:col-span-5"}>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Carte des villes</CardTitle>
            <CardDescription className="text-xs">
              {form.mode === "edit"
                ? "Cliquez sur la carte pour déplacer la ville."
                : "Cliquez n'importe où sur la carte : le nom, la région et les coordonnées sont remplis automatiquement."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative z-0 h-[420px] rounded-xl overflow-hidden border border-border">
              <MapContainer center={TUNISIA_CENTER} zoom={6} scrollWheelZoom className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onClick={handleMapClick} />
                <FlyToVille ville={focused} />
                {mappable.map((v) => (
                  <CircleMarker
                    key={v.id}
                    center={[v.latitude, v.longitude]}
                    radius={focused?.id === v.id ? 11 : 8}
                    bubblingMouseEvents={false}
                    pathOptions={{ color: regionColor[v.region] || "#64748b", fillOpacity: 0.7 }}
                  >
                    <Popup>
                      <div className="space-y-1">
                        <p className="font-bold">{v.nom}</p>
                        <p className="text-xs">{v.regionNom || "Sans région"}</p>
                        <p className="text-xs font-mono">
                          {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                        </p>
                        <button type="button" className="text-xs text-blue-600 underline" onClick={() => voirMeteo(v)}>
                          Voir la météo
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
                {form.mode && form.latitude !== "" && form.longitude !== "" && !Number.isNaN(Number(form.latitude)) && (
                  <CircleMarker
                    center={[Number(form.latitude), Number(form.longitude)]}
                    radius={10}
                    pathOptions={{ color: "#000", dashArray: "4", fillOpacity: 0.2 }}
                  />
                )}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {form.mode && (
          <Card variant="glass" expandable={false} className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-foreground">
                {form.mode === "create" ? "Nouvelle ville" : `Modifier ${form.nom}`}
              </CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={closeForm} aria-label="Fermer">
                <X />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                {geoLoading && (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Recherche du lieu...
                  </p>
                )}
                {geo && (
                  <div className="text-xs text-muted-foreground space-y-1 p-2.5 rounded-lg border border-border bg-card/50">
                    {geo.adresse && <p>Lieu détecté : {geo.adresse}</p>}
                    {geo.villeProche && (
                      <p>
                        Région proposée d'après la ville la plus proche : {geo.villeProche} ({geo.distanceKm} km).
                      </p>
                    )}
                    {geo.villeExistante && (
                      <p className="text-amber-500">
                        Cette ville existe déjà.{" "}
                        <button
                          type="button"
                          className="underline"
                          onClick={() => navigate(`/meteo?ville=${encodeURIComponent(geo.villeExistante)}`)}
                        >
                          Voir sa météo
                        </button>
                      </p>
                    )}
                  </div>
                )}
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">Nom</span>
                  <Input value={form.nom} maxLength={80} required onChange={(e) => setForm({ ...form, nom: e.target.value })} />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">Région</span>
                  <select
                    value={form.region}
                    required
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className={`${selectClass} w-full`}
                  >
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nom}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground">Latitude</span>
                    <Input type="number" step="0.0001" min={-90} max={90} required value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground">Longitude</span>
                    <Input type="number" step="0.0001" min={-180} max={180} required value={form.longitude}
                      onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
                  </label>
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving && <Loader2 className="animate-spin" />}
                  {form.mode === "create" ? "Ajouter" : "Enregistrer"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <Card variant="glass" expandable={false}>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">Villes ({villes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement depuis Fuseki...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3">Nom</th>
                    <th className="py-2 pr-3">Région</th>
                    <th className="py-2 pr-3">Latitude</th>
                    <th className="py-2 pr-3">Longitude</th>
                    <th className="py-2 pr-3">Mesures météo</th>
                    <th className="py-2 pr-3">Éléments liés</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {villesPage.map((v) => (
                    <tr key={v.id} className="border-b border-border/50 hover:bg-card/50">
                      <td className="py-2 pr-3">
                        <button type="button" className="font-semibold text-foreground hover:underline" onClick={() => setFocused(v)}>
                          {v.nom}
                        </button>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: regionColor[v.region] || "#64748b" }} />
                          {v.regionNom || "—"}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-mono">{v.latitude?.toFixed(4) ?? "—"}</td>
                      <td className="py-2 pr-3 font-mono">{v.longitude?.toFixed(4) ?? "—"}</td>
                      <td className="py-2 pr-3">{v.nbMesures}</td>
                      <td className="py-2 pr-3">{v.nbLiens}</td>
                      <td className="py-2">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => voirMeteo(v)}>
                            <CloudSun /> Voir la météo
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => openEdit(v)} aria-label="Modifier">
                            <Pencil />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="destructive"
                            onClick={() => handleDelete(v)}
                            disabled={v.nbLiens > 0}
                            title={v.nbLiens > 0 ? "Utilisée par d'autres modules : suppression impossible" : "Supprimer"}
                            aria-label="Supprimer"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!villes.length && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground">
                        Aucune ville ne correspond aux filtres.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {villes.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Afficher</span>
                    <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className={selectClass}>
                      {PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <span>
                      {(pageCourante - 1) * pageSize + 1}–{Math.min(pageCourante * pageSize, villes.length)} sur {villes.length} villes
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon-sm" variant="ghost" disabled={pageCourante === 1} onClick={() => setPage(pageCourante - 1)} aria-label="Page précédente">
                      <ChevronLeft />
                    </Button>
                    {Array.from({ length: nbPages }, (_, i) => i + 1).map((n) => (
                      <Button
                        key={n}
                        size="icon-sm"
                        variant={n === pageCourante ? "default" : "ghost"}
                        onClick={() => setPage(n)}
                        aria-label={`Page ${n}`}
                      >
                        {n}
                      </Button>
                    ))}
                    <Button size="icon-sm" variant="ghost" disabled={pageCourante === nbPages} onClick={() => setPage(pageCourante + 1)} aria-label="Page suivante">
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { LocalisationPage as default };
