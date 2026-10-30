import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudRain,
  Droplets,
  Loader2,
  MapPin,
  Sun,
  Thermometer,
  Trash2,
  Wind,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { localisationApi, meteoApi } from "@/services/semantic-api";

const MESURES = {
  Temperature: { label: "Température", icon: Thermometer },
  Ensoleillement: { label: "Rayonnement", icon: Sun },
  Precipitation: { label: "Pluie", icon: CloudRain },
  VitesseVent: { label: "Vent", icon: Wind },
  Humidite: { label: "Humidité", icon: Droplets },
  CouvertureNuageuse: { label: "Nuages", icon: Cloud },
};
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const pad = (n) => String(n).padStart(2, "0");
const dayKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const todayKey = () => {
  const t = new Date();
  return dayKey(t.getFullYear(), t.getMonth(), t.getDate());
};
const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30";

function valeurDe(releve, classe) {
  return releve.mesures.find((m) => m.classe === classe);
}

function niveauJour(releves) {
  const alertes = releves.flatMap((r) => r.alertes);
  if (alertes.some((a) => a.niveau === "critical")) return "critical";
  if (alertes.length) return "warning";
  return null;
}

function HistoriqueMeteoPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const villeFiltre = searchParams.get("ville") || "";
  const [mois, setMois] = useState(() => {
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() };
  });
  const [jour, setJour] = useState(todayKey);
  const [villes, setVilles] = useState([]);
  const [toutesSources, setToutesSources] = useState(false);
  const [releves, setReleves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    localisationApi.villes().then(setVilles).catch(() => {});
  }, []);

  const load = useCallback(() => {
    const { year, month } = mois;
    const fin = new Date(year, month + 1, 0).getDate();
    setLoading(true);
    return meteoApi
      .historique({ debut: dayKey(year, month, 1), fin: dayKey(year, month, fin), ville: villeFiltre, toutesSources })
      .then(setReleves)
      .catch((e) => setMessage({ type: "error", text: e.message }))
      .finally(() => setLoading(false));
  }, [mois, villeFiltre, toutesSources]);

  useEffect(() => {
    load();
  }, [load]);

  const parJour = useMemo(() => {
    const map = {};
    releves.forEach((r) => {
      const k = r.dateMesure.slice(0, 10);
      (map[k] ||= []).push(r);
    });
    return map;
  }, [releves]);

  const stats = useMemo(() => {
    const temps = releves.map((r) => valeurDe(r, "Temperature")?.valeur).filter((v) => v != null);
    return {
      consultations: releves.length,
      villes: new Set(releves.map((r) => r.ville)).size,
      joursAlerte: Object.values(parJour).filter((rs) => niveauJour(rs)).length,
      tMax: temps.length ? Math.max(...temps) : null,
      tMin: temps.length ? Math.min(...temps) : null,
    };
  }, [releves, parJour]);

  const changerMois = (delta) =>
    setMois(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const allerAujourdhui = () => {
    const t = new Date();
    setMois({ year: t.getFullYear(), month: t.getMonth() });
    setJour(todayKey());
  };

  const supprimerReleve = async (r) => {
    if (!window.confirm(`Supprimer la météo de ${r.villeNom} du ${r.dateMesure.slice(0, 10)} ?`)) return;
    try {
      const res = await meteoApi.supprimerJour({ jour: r.dateMesure.slice(0, 10), ville: r.ville, toutesSources });
      const prot = res.protegees.length ? ` (${res.protegees.length} mesure(s) liée(s) à une installation conservée(s))` : "";
      setMessage({ type: "success", text: `Consultation supprimée${prot}.` });
      await load();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  };

  const supprimerJournee = async () => {
    const libelle = villeFiltre ? ` pour ${villes.find((v) => v.id === villeFiltre)?.nom || villeFiltre}` : "";
    if (!window.confirm(`Supprimer tout l'historique du ${jour}${libelle} ?`)) return;
    try {
      const res = await meteoApi.supprimerJour({ jour, ville: villeFiltre, toutesSources });
      setMessage({ type: "success", text: `${res.supprimees.length} mesure(s) supprimée(s).` });
      await load();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  };

  const { year, month } = mois;
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const nbJours = new Date(year, month + 1, 0).getDate();
  const cellules = [...Array(offset).fill(null), ...Array.from({ length: nbJours }, (_, i) => i + 1)];
  const titreMois = new Date(year, month, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const relevesJour = parJour[jour] || [];
  const titreJour = new Date(`${jour}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-[var(--primary)] border border-border">
              <CalendarDays className="w-5 h-5" />
            </div>
            Historique météo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Toutes les météos consultées, jour par jour et ville par ville. Choisissez une date pour voir ou supprimer.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={villeFiltre}
            onChange={(e) => setSearchParams(e.target.value ? { ville: e.target.value } : {})}
            className={selectClass}
          >
            <option value="">Toutes les villes</option>
            {villes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nom}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input type="checkbox" checked={toutesSources} onChange={(e) => setToutesSources(e.target.checked)} />
            Inclure les données de démonstration
          </label>
        </div>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Relevés ce mois", stats.consultations],
          ["Villes consultées", stats.villes],
          ["Jours avec alerte", stats.joursAlerte],
          ["Températures", stats.tMax != null ? `${stats.tMin}° / ${stats.tMax}°` : "—"],
        ].map(([label, value]) => (
          <div key={label} className="p-4 rounded-2xl border border-border bg-card/50">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card variant="glass" expandable={false} className="xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground capitalize">{titreMois}</CardTitle>
            <div className="flex items-center gap-1">
              {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              <Button variant="ghost" size="icon-sm" onClick={() => changerMois(-1)} aria-label="Mois précédent">
                <ChevronLeft />
              </Button>
              <Button variant="outline" size="sm" onClick={allerAujourdhui}>
                Aujourd'hui
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => changerMois(1)} aria-label="Mois suivant">
                <ChevronRight />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5">
              {JOURS.map((j) => (
                <div key={j} className="text-center text-[11px] font-semibold text-muted-foreground py-1">
                  {j}
                </div>
              ))}
              {cellules.map((d, i) => {
                if (!d) return <div key={`vide-${i}`} />;
                const k = dayKey(year, month, d);
                const rs = parJour[k] || [];
                const niveau = niveauJour(rs);
                const temps = rs.map((r) => valeurDe(r, "Temperature")?.valeur).filter((v) => v != null);
                const nomsVilles = [...new Set(rs.map((r) => r.villeNom))];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setJour(k)}
                    className={`min-h-20 p-1.5 rounded-xl border text-left transition-all flex flex-col gap-0.5 ${
                      k === jour
                        ? "border-[var(--primary)] bg-[var(--primary)]/10"
                        : rs.length
                          ? "border-border bg-card/60 hover:border-[var(--primary)]/50"
                          : "border-border/40 hover:bg-card/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${k === todayKey() ? "text-[var(--primary)]" : "text-foreground"}`}>{d}</span>
                      {niveau && (
                        <span className={`w-2 h-2 rounded-full ${niveau === "critical" ? "bg-rose-500" : "bg-amber-500"}`} />
                      )}
                    </div>
                    {rs.length > 0 && (
                      <>
                        {temps.length > 0 && (
                          <span className="text-[11px] font-semibold text-foreground">
                            {Math.min(...temps)}°{temps.length > 1 ? ` / ${Math.max(...temps)}°` : ""}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground truncate">
                          {nomsVilles.slice(0, 2).join(", ")}
                          {nomsVilles.length > 2 ? ` +${nomsVilles.length - 2}` : ""}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{rs.length} ville(s)</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Alerte critique
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Avertissement
              </span>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" expandable={false} className="xl:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold text-foreground capitalize">{titreJour}</CardTitle>
              <CardDescription className="text-xs">{relevesJour.length} ville(s) enregistrée(s)</CardDescription>
            </div>
            {relevesJour.length > 0 && (
              <Button size="sm" variant="destructive" onClick={supprimerJournee}>
                <Trash2 /> Tout supprimer
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {!relevesJour.length && (
              <p className="text-sm text-muted-foreground">
                Aucune météo consultée ce jour-là. <Link to="/meteo" className="underline">Consulter la météo</Link>
              </p>
            )}
            {relevesJour.map((r) => (
              <div key={`${r.ville}-${r.dateMesure}`} className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
                      {r.villeNom}
                      <span className="text-xs font-normal text-muted-foreground">{r.regionNom}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Météo de {r.dateMesure.slice(11, 16)}
                      {r.dateRecuperation && ` · consultée le ${new Date(r.dateRecuperation).toLocaleString("fr-FR")}`}
                      {r.source && r.source !== "Open-Meteo" && ` · ${r.source}`}
                    </p>
                  </div>
                  <Button
                    size="icon-sm"
                    variant="destructive"
                    disabled={!r.mesures.some((m) => m.supprimable)}
                    title={r.supprimable ? "Supprimer" : "Mesures liées à une installation : protégées"}
                    onClick={() => supprimerReleve(r)}
                    aria-label="Supprimer"
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {r.mesures.map((m) => {
                    const info = MESURES[m.classe] || { label: m.classe, icon: Cloud };
                    const Icon = info.icon;
                    return (
                      <div key={m.id} className="rounded-lg bg-card/50 border border-border/50 px-2 py-1">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Icon className="w-3 h-3" /> {info.label}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {m.valeur} <span className="text-[10px] text-muted-foreground">{m.unite}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
                {r.alertes.map((a) => (
                  <p
                    key={a.type}
                    className={`text-xs flex items-center gap-1.5 ${a.niveau === "critical" ? "text-rose-500" : "text-amber-500"}`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> {a.titre} ({a.valeur} {a.unite})
                  </p>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { HistoriqueMeteoPage as default };
