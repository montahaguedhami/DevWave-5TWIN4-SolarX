import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, CheckCircle2, Cloud, CloudRain, CloudSun, Droplets, Loader2, RefreshCw, Sun, Thermometer, Wind, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeatherAlertList } from "@/components/meteo/weather-alerts";
import { MeteoAssistant } from "@/components/meteo/meteo-assistant";
import { localisationApi, meteoApi } from "@/services/semantic-api";

const ICONS = {
  Temperature: Thermometer,
  Ensoleillement: Sun,
  Precipitation: CloudRain,
  VitesseVent: Wind,
  Humidite: Droplets,
  CouvertureNuageuse: Cloud,
};

const selectClass =
  "h-9 min-w-56 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30";

function MeteoPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const villeId = searchParams.get("ville") || "";
  const [villes, setVilles] = useState([]);
  const [meteo, setMeteo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    localisationApi
      .villes()
      .then(setVilles)
      .catch((e) => setMessage({ type: "error", text: e.message }));
  }, []);

  const ville = villes.find((v) => v.id === villeId);

  // Each consultation is saved automatically in the ontology (history).
  const loadMeteo = useCallback(() => {
    if (!villeId) return undefined;
    let active = true;
    setLoading(true);
    setMeteo(null);
    setMessage(null);
    meteoApi
      .consulter(villeId)
      .then((data) => active && setMeteo(data))
      .catch((e) => active && setMessage({ type: "error", text: e.message }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [villeId]);

  useEffect(loadMeteo, [loadMeteo]);

  const selectVille = (id) => setSearchParams(id ? { ville: id } : {});

  const chartData = (meteo?.previsions || []).map((p) => ({ ...p, heure: p.time.slice(11, 16) }));
  const enregistre = meteo?.enregistrement?.enregistrees.length
    ? "Météo du jour enregistrée dans l'historique"
    : meteo?.enregistrement?.dejaPresentes.length
      ? "Déjà enregistrée aujourd'hui pour cette ville"
      : null;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-[var(--primary)] border border-border">
              <CloudSun className="w-5 h-5" />
            </div>
            Météo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Météo en temps réel d'une ville. La météo est enregistrée une seule fois par jour et par ville dans l'historique.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={villeId} onChange={(e) => selectVille(e.target.value)} className={selectClass}>
            <option value="">Choisir une ville...</option>
            {villes.map((v) => (
              <option key={v.id} value={v.id} disabled={v.latitude == null}>
                {v.nom} {v.regionNom ? `— ${v.regionNom}` : ""}
              </option>
            ))}
          </select>
          <Button variant="outline" size="icon" onClick={loadMeteo} disabled={!villeId || loading} aria-label="Rafraîchir">
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
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

      {!villeId && (
        <Card variant="glass" expandable={false}>
          <CardContent className="text-sm text-muted-foreground">
            Sélectionnez une ville, ou utilisez « Voir la météo » depuis la page Localisation.
          </CardContent>
        </Card>
      )}

      {villeId && loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Récupération des données Open-Meteo...
        </div>
      )}

      {meteo && (
        <>
          <Card variant="glass" expandable={false}>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {meteo.villeNom} {ville?.regionNom && <span className="text-sm font-normal text-muted-foreground">— {ville.regionNom}</span>}
                </CardTitle>
                <CardDescription className="text-xs">
                  Mesure de {meteo.dateMesure.slice(11, 16)} le {meteo.dateMesure.slice(0, 10)} · {meteo.estJour ? "Jour" : "Nuit"} · Source : {meteo.source}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {enregistre ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" /> {enregistre}
                  </span>
                ) : null}
                <Button variant="outline" size="sm" render={<Link to={`/historique-meteo?ville=${encodeURIComponent(villeId)}`} />}>
                  <CalendarDays /> Historique
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {meteo.mesures.map((m) => {
                  const Icon = ICONS[m.classe] || Cloud;
                  return (
                    <div key={m.classe} className="p-4 rounded-2xl border border-border bg-card/50 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Icon className="w-4 h-4 text-[var(--primary)]" />
                        {m.label}
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {m.valeur} <span className="text-sm font-medium text-muted-foreground">{m.unite}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <MeteoAssistant villeId={meteo.ville} dateMesure={meteo.dateMesure} />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card variant="glass" expandable={false} className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Alertes météo</CardTitle>
                <CardDescription className="text-xs">Évaluées sur les valeurs actuelles récupérées.</CardDescription>
              </CardHeader>
              <CardContent>
                <WeatherAlertList alertes={meteo.alertes} emptyText="Aucune alerte pour les conditions actuelles." />
              </CardContent>
            </Card>

            <Card variant="glass" expandable={false} className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Prévisions 24 h</CardTitle>
                <CardDescription className="text-xs">Température (°C) et rayonnement solaire (W/m²).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="heure" fontSize={11} />
                      <YAxis yAxisId="t" fontSize={11} unit="°" />
                      <YAxis yAxisId="r" orientation="right" fontSize={11} />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="t" type="monotone" dataKey="temperature" name="Température" stroke="#ef4444" dot={false} />
                      <Line yAxisId="r" type="monotone" dataKey="rayonnement" name="Rayonnement" stroke="#f59e0b" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export { MeteoPage as default };
