import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, CloudSun, Info, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { meteoApi } from "@/services/semantic-api";

const STYLES = {
  critical: { icon: AlertCircle, box: "border-rose-500/40 bg-rose-500/10", text: "text-rose-500" },
  warning: { icon: AlertTriangle, box: "border-amber-500/40 bg-amber-500/10", text: "text-amber-500" },
  info: { icon: Info, box: "border-sky-500/40 bg-sky-500/10", text: "text-sky-500" },
};

export function WeatherAlertList({ alertes, emptyText = "Aucune alerte météo." }) {
  if (!alertes?.length) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <div className="space-y-2">
      {alertes.map((a, i) => {
        const style = STYLES[a.niveau] || STYLES.info;
        const Icon = style.icon;
        return (
          <div key={`${a.ville}-${a.type}-${i}`} className={`flex items-start gap-3 p-3 rounded-xl border ${style.box}`}>
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.text}`} />
            <div className="flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground text-sm">{a.titre}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${style.box} ${style.text}`}>
                  {a.gravite}
                </span>
                <span className="text-xs text-muted-foreground">{a.villeNom}</span>
              </div>
              <p className="text-xs text-muted-foreground">{a.message}</p>
              {a.dateMesure && <p className="text-[11px] font-mono text-muted-foreground">{a.dateMesure}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WeatherAlertsCard() {
  const [alertes, setAlertes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    meteoApi
      .alertes()
      .then((data) => {
        setAlertes(data);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <Card variant="glass" expandable={false}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <CloudSun className="w-4 h-4 text-[var(--primary)]" />
            Alertes météo ({alertes.length})
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Dernières mesures ConditionMeteo de chaque ville (Fuseki) — chaleur &gt; 40 °C, vent &gt; 25 m/s, rayonnement &lt; 200 W/m².
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={load} disabled={loading} aria-label="Rafraîchir">
          <RefreshCw className={loading ? "animate-spin" : ""} />
        </Button>
      </CardHeader>
      <CardContent>
        {error ? <p className="text-sm text-rose-500">{error}</p> : <WeatherAlertList alertes={alertes} />}
      </CardContent>
    </Card>
  );
}
