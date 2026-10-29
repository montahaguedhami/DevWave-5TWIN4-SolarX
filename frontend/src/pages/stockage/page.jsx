import { useState } from "react";
import { BatteryCharging, Droplets, MapPin, Zap, Gauge, Layers, Home, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CapacityGauge from "@/components/solarx/capacity-gauge";
import EtatBadge from "@/components/solarx/etat-badge";
import { LoadingState, ErrorState } from "@/components/solarx/api-state";
import { useApi, formatKwh, formatKw } from "@/services/solarx-api";

const TYPES = [
  { key: "", label: "Tous" },
  { key: "Batterie", label: "Batteries" },
  { key: "StockageHydraulique", label: "Stockage hydraulique" },
];

const TYPE_LABEL = { Batterie: "Batterie", StockageHydraulique: "Stockage hydraulique" };
const TYPE_PLURAL = { Batterie: "batteries", StockageHydraulique: "stockages hydrauliques" };
const levelColor = (n) => (n < 25 ? "#ef4444" : n < 50 ? "#f59e0b" : "#22c55e");

function Kpi({ icon: Icon, label, value, hint }) {
  return (
    <Card expandable={false}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="w-3.5 h-3.5" /> {label}
        </div>
        <div className="text-2xl font-black font-mono text-foreground mt-1">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function StockageCard({ s }) {
  const Icon = s.type === "StockageHydraulique" ? Droplets : BatteryCharging;
  const niveau = s.niveauCharge ?? 0;
  return (
    <Card expandable={false}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate">{s.nom || s.id}</div>
              <div className="text-xs text-muted-foreground">{TYPE_LABEL[s.type] || s.type} · {s.id}</div>
            </div>
          </div>
          <EtatBadge etat={s.etat} />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Niveau de charge</span>
            <span className="font-mono font-bold text-foreground">{niveau}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${niveau}%`, background: levelColor(niveau) }} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatKwh(s.energieStockee)} sur {formatKwh(s.capacite)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-muted-foreground">Puissance max</div>
            <div className="font-medium text-foreground">{formatKw(s.puissanceMax)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Technologie</div>
            <div className="font-medium text-foreground truncate" title={s.technologie}>{s.technologie || "—"}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border pt-3">
          {s.localisation && (
            <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.localisation}</span>
          )}
          {s.alimentePar?.length > 0 && (
            <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3" /> Alimenté par {s.alimentePar.join(", ").replaceAll("_", " ")}</span>
          )}
          {s.alimente?.length > 0 && (
            <span className="inline-flex items-center gap-1"><Home className="w-3 h-3" /> Alimente {s.alimente.join(", ").replaceAll("_", " ")}</span>
          )}
        </div>
        {s.incidents?.length > 0 && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-2 text-xs space-y-0.5">
            {s.incidents.map((i) => (
              <div key={i.incident} className="flex gap-1.5">
                <AlertTriangle className="w-3 h-3 text-orange-500 shrink-0 mt-0.5" />
                <span className="text-foreground">
                  <b>{i.typeIncident}</b>{i.gravite && ` · gravité ${i.gravite}`}{i.description && ` — ${i.description}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StockagePage() {
  const [type, setType] = useState("");
  const query = type ? `?type=${type}` : "";
  const totals = useApi(`/api/stockage/capacite-totale${query}`);
  const list = useApi(`/api/stockage${query}`);

  const error = totals.error || list.error;
  const t = totals.data;
  const items = list.data || [];
  const puissanceTotale = items.reduce((acc, s) => acc + (s.puissanceMax || 0), 0);
  const chartData = items.map((s) => ({ name: s.id.replace("StockageHydraulique", "Hydro").replaceAll("_", " "), niveau: s.niveauCharge ?? 0, nom: s.nom }));

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-primary border border-border">
              <BatteryCharging className="w-5 h-5" />
            </div>
            Stockage de l'énergie
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Batteries et stockage hydraulique du smart grid, issus de l'ontologie SolarX (requêtes SPARQL).
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-muted/60 border border-border w-fit">
          {TYPES.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setType(o.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                type === o.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorState error={error} />}
      {!error && (!t || !list.data) && <LoadingState />}

      {!error && t && list.data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi icon={Layers} label="Capacité totale" value={formatKwh(t.capaciteTotale)} hint="Somme des capacités (SPARQL SUM)" />
            <Kpi icon={BatteryCharging} label="Énergie stockée" value={formatKwh(t.energieStockee)} hint="Somme de energieStockeeKWh" />
            <Kpi icon={Gauge} label="Unités de stockage" value={t.nombre} hint={t.parType.map((p) => `${p.nombre} ${p.nombre > 1 ? TYPE_PLURAL[p.type] : TYPE_LABEL[p.type]}`).join(" · ")} />
            <Kpi icon={Zap} label="Puissance max cumulée" value={formatKw(puissanceTotale)} hint="Restitution instantanée possible" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card expandable={false}>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Taux de remplissage</CardTitle>
                <CardDescription className="text-xs">Énergie stockée / capacité totale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CapacityGauge percent={t.tauxRemplissage} label="du stockage rempli" />
                <div className="space-y-2">
                  {t.parType.map((p) => {
                    const pct = p.capacite ? (p.energieStockee / p.capacite) * 100 : 0;
                    return (
                      <div key={p.type} className="text-xs">
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">{TYPE_LABEL[p.type] || p.type}</span>
                          <span className="font-mono text-foreground">{formatKwh(p.capacite)}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card expandable={false} className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Niveau de charge par unité</CardTitle>
                <CardDescription className="text-xs">Rouge &lt; 25 %, orange &lt; 50 %, vert au-delà</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={60} stroke="var(--muted-foreground)" />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} stroke="var(--muted-foreground)" />
                      <Tooltip
                        cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                        contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: 12, fontSize: 12 }}
                        formatter={(v, _n, item) => [`${v}%`, item.payload.nom]}
                      />
                      <Bar dataKey="niveau" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {chartData.map((d) => <Cell key={d.name} fill={levelColor(d.niveau)} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((s) => <StockageCard key={s.id} s={s} />)}
          </div>
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              Aucune instance de stockage dans l'ontologie. Ajoutez des individus Batterie / StockageHydraulique (avec capaciteKWh) dans Protégé.
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { StockagePage as default };
