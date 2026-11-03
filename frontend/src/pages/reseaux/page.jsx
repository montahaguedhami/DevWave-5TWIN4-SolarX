import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Network, Cable, Ruler, Home, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Kpi, EtatLigne, Chargement, Erreur, TYPE_LABEL, TYPE_COLOR, nomDe, formatKm, formatKv } from "@/components/reseau/ui";
import { SchemaFlux } from "@/components/reseau/schema-flux";
import { FormReseau, Confirmer } from "@/components/reseau/formulaires";
import { reseauxApi, useApi } from "@/services/reseau-api";

function DetailReseau({ reseau, onSupprime }) {
  const navigate = useNavigate();
  const detail = useApi(`/reseaux/${reseau.id}`);
  const [edition, setEdition] = useState(false);
  const [suppression, setSuppression] = useState(false);
  if (detail.error) return <Erreur error={detail.error} />;
  if (!detail.data) return <Chargement />;
  const { lignes } = detail.data;
  const ouvrir = (id) => navigate(`/lignes?ligne=${id}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          Réseau sélectionné : <span className="font-semibold text-foreground">{nomDe(reseau)}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEdition(true)}>
            <Pencil className="w-3.5 h-3.5" /> Modifier
          </Button>
          <Button variant="destructive" size="sm" disabled={lignes.length > 0} onClick={() => setSuppression(true)}>
            <Trash2 className="w-3.5 h-3.5" /> Supprimer
          </Button>
        </div>
      </div>
      {lignes.length > 0 && (
        <div className="text-xs text-muted-foreground text-right -mt-2">Pour supprimer ce réseau, retirez d'abord ses lignes avec « Modifier ».</div>
      )}

      <Card expandable={false}>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">Flux d'énergie : {nomDe(reseau)}</CardTitle>
          <CardDescription className="text-xs">
            Les installations produisent, les lignes transportent, les consommateurs reçoivent. Cliquez sur une ligne pour voir son détail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lignes.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">Ce réseau ne contient aucune ligne.</div>
          ) : (
            <>
              <SchemaFlux lignes={lignes} onSelect={ouvrir} />
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {Object.entries(TYPE_COLOR).map(([t, c]) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <span className="inline-block w-4 h-0.5" style={{ background: c }} /> {TYPE_LABEL[t]}
                  </span>
                ))}
                <span>Pointillés : ligne en panne</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {lignes.length > 0 && (
        <Card expandable={false}>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Lignes du réseau</CardTitle>
            <CardDescription className="text-xs">{lignes.length} ligne(s), de la plus haute à la plus basse tension</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ligne</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Tension</TableHead>
                    <TableHead className="text-right">Longueur</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((l) => (
                    <TableRow key={l.id} className="cursor-pointer" onClick={() => ouvrir(l.id)}>
                      <TableCell className="font-medium text-foreground">{nomDe(l)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap">
                          <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLOR[l.type] }} />
                          {TYPE_LABEL[l.type] || l.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatKv(l.tensionKV)}</TableCell>
                      <TableCell className="text-right font-mono">{formatKm(l.longueurKm)}</TableCell>
                      <TableCell><EtatLigne etat={l.etat} /></TableCell>
                      <TableCell className="text-right"><ChevronRight className="w-4 h-4 text-muted-foreground inline" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 text-right">
              <Link to={`/lignes?reseau=${reseau.id}`} className="text-xs font-medium text-primary hover:underline">
                Voir ces lignes sur la carte →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <FormReseau open={edition} reseau={reseau} lignesActuelles={lignes} onClose={() => setEdition(false)} onSaved={() => setEdition(false)} />
      <Confirmer
        open={suppression}
        onClose={() => setSuppression(false)}
        titre="Supprimer ce réseau ?"
        texte={`« ${nomDe(reseau)} » sera retiré de l'ontologie.`}
        onConfirm={async () => {
          await reseauxApi.supprimer(reseau.id);
          setSuppression(false);
          onSupprime();
        }}
      />
    </div>
  );
}

function ReseauxPage() {
  // réseau sélectionné dans l'adresse : /reseaux?id=ReseauNational_01
  const [params, setParams] = useSearchParams();
  const [ajout, setAjout] = useState(false);
  const list = useApi("/reseaux");
  const stats = useApi("/reseaux/stats");
  const nets = list.data || [];
  const selected = nets.find((r) => r.id === params.get("id")) || nets[0];
  const chartData = nets.map((r) => ({ name: nomDe(r), km: r.longueurTotaleKm, lignes: r.nombreLignes }));
  const error = list.error || stats.error;
  const s = stats.data;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-primary border border-border">
              <Network className="w-5 h-5" />
            </div>
            Réseaux électriques
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Réseaux de transport et de distribution, et les lignes qu'ils contiennent, issus de l'ontologie SolarX.
          </p>
        </div>
        <Button className="w-fit" onClick={() => setAjout(true)}>
          <Plus className="w-4 h-4" /> Ajouter un réseau
        </Button>
      </div>

      {error && <Erreur error={error} />}
      {!error && (!list.data || !s) && <Chargement />}

      {!error && list.data && s && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi icon={Network} label="Réseaux" value={s.nombre} hint={[...new Set(nets.map((r) => TYPE_LABEL[r.type] || r.type))].join(" · ")} />
            <Kpi icon={Cable} label="Lignes rattachées" value={s.lignes} hint="Chaque ligne comptée une seule fois" />
            <Kpi icon={Ruler} label="Longueur totale" value={formatKm(s.longueurTotaleKm)} hint="Lignes rattachées à un réseau" />
            <Kpi icon={Home} label="Consommateurs desservis" value={s.consommateursDesservis} hint="Alimentés par les lignes des réseaux" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              {nets.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setParams({ id: r.id }, { replace: true })}
                  className={`w-full text-left rounded-xl border p-4 transition-colors cursor-pointer bg-card ${
                    selected?.id === r.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Network className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate" title={nomDe(r)}>{nomDe(r)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{TYPE_LABEL[r.type] || r.type}</div>
                  <div className="text-xs text-foreground mt-2 font-mono">
                    {r.nombreLignes} ligne(s) · {formatKm(r.longueurTotaleKm)} · {r.consommateursDesservis} consommateur(s)
                  </div>
                </button>
              ))}
            </div>

            <Card expandable={false} className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Longueur par réseau</CardTitle>
                <CardDescription className="text-xs">Somme des longueurs des lignes de chaque réseau (km)</CardDescription>
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

          {selected && <DetailReseau key={selected.id} reseau={selected} onSupprime={() => setParams({}, { replace: true })} />}
        </>
      )}

      <FormReseau
        open={ajout}
        onClose={() => setAjout(false)}
        onSaved={(r) => {
          setAjout(false);
          setParams({ id: r.id }, { replace: true });
        }}
      />
    </div>
  );
}

export { ReseauxPage as default };
