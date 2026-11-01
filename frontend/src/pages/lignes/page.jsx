import { useState } from "react";
import { Cable, Network, Ruler, AlertTriangle, Home, Factory, Zap } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Kpi, EtatLigne, Chargement, Erreur, TYPE_LABEL, TYPE_COLOR, label, formatKm, formatKv } from "@/components/reseau/ui";
import { useApi } from "@/services/reseau-api";

const TYPES = [
  { key: "", label: "Toutes" },
  { key: "LigneHauteTension", label: "Haute tension" },
  { key: "LigneMoyenneTension", label: "Moyenne tension" },
  { key: "LigneBasseTension", label: "Basse tension" },
];

function LigneCard({ l }) {
  return (
    <Card expandable={false}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg shrink-0" style={{ background: `${TYPE_COLOR[l.type]}22`, color: TYPE_COLOR[l.type] }}>
              <Cable className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate" title={l.nom}>{l.nom || label(l.id)}</div>
              <div className="text-xs text-muted-foreground">{TYPE_LABEL[l.type] || l.type} · {l.id}</div>
            </div>
          </div>
          <EtatLigne etat={l.etat} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-muted-foreground">Tension</div>
            <div className="font-mono font-bold text-foreground">{formatKv(l.tensionKV)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Longueur</div>
            <div className="font-mono font-bold text-foreground">{formatKm(l.longueurKm)}</div>
          </div>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground border-t border-border pt-3">
          {l.reseaux.length > 0 && (
            <div className="flex items-center gap-1"><Network className="w-3 h-3 shrink-0" /> {l.reseaux.map((r) => r.nom || label(r.id)).join(", ")}</div>
          )}
          {l.relie.length > 0 && (
            <div className="flex items-center gap-1"><Factory className="w-3 h-3 shrink-0" /> Relie {l.relie.map((i) => label(i.id)).join(", ")}</div>
          )}
          {l.dessert.length > 0 && (
            <div className="flex items-center gap-1"><Home className="w-3 h-3 shrink-0" /> Dessert {l.dessert.map((c) => label(c.id)).join(", ")}</div>
          )}
        </div>

        {l.incidents.length > 0 && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-2 text-xs space-y-0.5">
            {l.incidents.map((i) => (
              <div key={i.id} className="flex gap-1.5">
                <AlertTriangle className="w-3 h-3 text-orange-500 shrink-0 mt-0.5" />
                <span className="text-foreground">
                  <b>{i.type}</b>{i.gravite && ` · gravité ${i.gravite}`}{i.description && ` — ${i.description}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LignesPage() {
  const [type, setType] = useState("");
  const stats = useApi("/lignes/stats");
  const list = useApi(`/lignes${type ? `?type=${type}` : ""}`);

  const error = stats.error || list.error;
  const s = stats.data;
  const items = list.data || [];
  const chartData = (s?.parType || []).map((p) => ({ type: p.type, name: TYPE_LABEL[p.type] || p.type, km: p.longueurKm, nombre: p.nombre }));

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-primary border border-border">
              <Cable className="w-5 h-5" />
            </div>
            Lignes de transport
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lignes basse, moyenne et haute tension du smart grid, issues de l'ontologie SolarX (requêtes SPARQL).
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

      {error && <Erreur error={error} />}
      {!error && (!s || !list.data) && <Chargement />}

      {!error && s && list.data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi icon={Cable} label="Lignes" value={s.nombre} hint={s.parType.map((p) => `${p.nombre} ${(TYPE_LABEL[p.type] || p.type).toLowerCase()}`).join(" · ")} />
            <Kpi icon={Ruler} label="Longueur totale" value={formatKm(s.longueurTotaleKm)} hint="Somme de longueurKm (SPARQL SUM)" />
            <Kpi icon={AlertTriangle} label="Lignes en panne" value={s.lignesEnPanne} hint="Panne qui affecte la ligne" />
            <Kpi icon={Home} label="Consommateurs desservis" value={s.consommateursDesservis} hint="Relation dessert" />
          </div>

          <Card expandable={false}>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">Par niveau de tension</CardTitle>
              <CardDescription className="text-xs">Longueur du réseau (km) et plage de tension par type de ligne</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="h-[220px] w-full lg:col-span-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} unit=" km" stroke="var(--muted-foreground)" />
                    <Tooltip
                      cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                      contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: 12, fontSize: 12 }}
                      formatter={(v, _n, item) => [`${formatKm(v)} · ${item.payload.nombre} ligne(s)`, item.payload.name]}
                    />
                    <Bar dataKey="km" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {chartData.map((d) => <Cell key={d.type} fill={TYPE_COLOR[d.type]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 text-sm">
                {s.parType.map((p) => (
                  <div key={p.type} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLOR[p.type] }} />
                      {TYPE_LABEL[p.type] || p.type}
                    </span>
                    <span className="font-mono text-foreground">
                      {p.tensionMinKV === p.tensionMaxKV ? formatKv(p.tensionMaxKV) : `${formatKv(p.tensionMinKV)} – ${formatKv(p.tensionMaxKV)}`}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((l) => <LigneCard key={l.id} l={l} />)}
          </div>
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8 flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" /> Aucune ligne de ce type dans l'ontologie.
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { LignesPage as default };
