import { useState } from "react";
import { Network, Cable, Ruler, Home, Factory, ArrowRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Kpi, EtatLigne, Chargement, Erreur, TYPE_LABEL, TYPE_COLOR, label, formatKm, formatKv } from "@/components/reseau/ui";
import { useApi } from "@/services/reseau-api";

function Noeud({ icon: Icon, children, className }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${className}`}>
      <Icon className="w-3 h-3" /> {children}
    </span>
  );
}

function DetailReseau({ reseauId }) {
  const detail = useApi(`/reseaux/${reseauId}`);
  if (detail.error) return <Erreur error={detail.error} />;
  if (!detail.data) return <Chargement />;
  const { lignes, flux } = detail.data;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Card expandable={false}>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">Lignes du réseau</CardTitle>
          <CardDescription className="text-xs">Relation contient (réseau → ligne)</CardDescription>
        </CardHeader>
        <CardContent>
          {lignes.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">Ce réseau ne contient aucune ligne.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ligne</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Tension</TableHead>
                    <TableHead className="text-right">Longueur</TableHead>
                    <TableHead>État</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{l.nom || label(l.id)}</div>
                        <div className="text-xs text-muted-foreground">{l.id}</div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap">
                          <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLOR[l.type] }} />
                          {TYPE_LABEL[l.type] || l.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatKv(l.tensionKV)}</TableCell>
                      <TableCell className="text-right font-mono">{formatKm(l.longueurKm)}</TableCell>
                      <TableCell><EtatLigne etat={l.etat} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card expandable={false}>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">Flux d'énergie</CardTitle>
          <CardDescription className="text-xs">Chemin dans le graphe : installation --relie--&gt; ligne --dessert--&gt; consommateur</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {flux.length === 0 && <div className="text-sm text-muted-foreground text-center py-6">Aucun flux.</div>}
          {flux.map((f, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
              <Noeud icon={Factory} className={f.installation ? "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400" : "border-border text-muted-foreground"}>
                {f.installation ? label(f.installation) : "aucune installation"}
              </Noeud>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              <Noeud icon={Cable} className="border-primary/40 bg-primary/10 font-semibold text-foreground">{label(f.ligne)}</Noeud>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              <Noeud icon={Home} className={f.consommateur ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-border text-muted-foreground"}>
                {f.consommateur ? label(f.consommateur) : "aucun consommateur"}
              </Noeud>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ReseauxPage() {
  const [reseau, setReseau] = useState(null);
  const list = useApi("/reseaux");
  const nets = list.data || [];
  const selected = reseau || nets[0]?.id;
  const chartData = nets.map((r) => ({ name: r.nom || label(r.id), km: r.longueurTotaleKm, lignes: r.nombreLignes }));

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-card/50 text-primary border border-border">
            <Network className="w-5 h-5" />
          </div>
          Réseaux électriques
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Réseaux de transport et de distribution, et les lignes qu'ils contiennent, issus de l'ontologie SolarX (requêtes SPARQL).
        </p>
      </div>

      {list.error && <Erreur error={list.error} />}
      {!list.error && !list.data && <Chargement />}

      {list.data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi icon={Network} label="Réseaux" value={nets.length} hint={[...new Set(nets.map((r) => TYPE_LABEL[r.type] || r.type))].join(" · ")} />
            <Kpi icon={Cable} label="Lignes rattachées" value={nets.reduce((a, r) => a + r.nombreLignes, 0)} hint="Relation contient" />
            <Kpi icon={Ruler} label="Longueur cumulée" value={formatKm(nets.reduce((a, r) => a + r.longueurTotaleKm, 0))} hint="SUM(longueurKm) par réseau" />
            <Kpi icon={Home} label="Consommateurs desservis" value={nets.reduce((a, r) => a + r.consommateursDesservis, 0)} hint="Via les lignes de chaque réseau" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              {nets.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReseau(r.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-colors cursor-pointer bg-card ${
                    selected === r.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Network className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate" title={r.nom}>{r.nom || label(r.id)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{TYPE_LABEL[r.type] || r.type} · {r.id}</div>
                  <div className="text-xs text-foreground mt-2 font-mono">
                    {r.nombreLignes} ligne(s) · {formatKm(r.longueurTotaleKm)} · {r.consommateursDesservis} consommateur(s)
                  </div>
                </button>
              ))}
            </div>

            <Card expandable={false} className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Longueur par réseau</CardTitle>
                <CardDescription className="text-xs">Somme des longueurs des lignes contenues (km)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                      <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} unit=" km" stroke="var(--muted-foreground)" />
                      <YAxis type="category" dataKey="name" width={170} fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
                      <Tooltip
                        cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                        contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: 12, fontSize: 12 }}
                        formatter={(v, _n, item) => [`${formatKm(v)} · ${item.payload.lignes} ligne(s)`, "Longueur"]}
                      />
                      <Bar dataKey="km" fill="var(--primary)" radius={[0, 6, 6, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {selected && <DetailReseau reseauId={selected} />}
        </>
      )}
    </div>
  );
}

export { ReseauxPage as default };
