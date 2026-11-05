import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Cable, Network, Ruler, AlertTriangle, Home, Factory, Zap, Map as MapIcon, ChevronRight, Plus, Search } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Kpi, EtatLigne, Chargement, Erreur, TYPE_LABEL, TYPE_COLOR, TYPES_LIGNE, ETATS_LIGNE, nomDe, formatKm, formatKv, formatDate } from "@/components/reseau/ui";
import { DetailLigne } from "@/components/reseau/detail-ligne";
import { CarteLignes } from "@/components/reseau/carte-lignes";
import { FormLigne } from "@/components/reseau/formulaires";
import { useApi } from "@/services/reseau-api";

// Une carte montre les incidents les plus récents ; tout l'historique est dans le panneau de détail
const INCIDENTS_MAX = 3;
const ETAT_LABEL = { Fonctionnel: "Fonctionnelles", Alerte: "En alerte", "En panne": "En panne" };

function Filtre({ options, valeur, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-muted/60 border border-border w-fit">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            valeur === o.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label} <span className="font-mono opacity-70">({o.n})</span>
        </button>
      ))}
    </div>
  );
}

function LigneCard({ l, onOpen }) {
  return (
    <Card expandable={false} className="cursor-pointer" onClick={() => onOpen(l.id)}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg shrink-0" style={{ background: `${TYPE_COLOR[l.type]}22`, color: TYPE_COLOR[l.type] }}>
              <Cable className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate" title={nomDe(l)}>{nomDe(l)}</div>
              <div className="text-xs text-muted-foreground">{TYPE_LABEL[l.type] || l.type}</div>
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
            <div className="flex items-center gap-1 flex-wrap">
              <Network className="w-3 h-3 shrink-0" />
              {l.reseaux.map((r, i) => (
                <span key={r.id}>
                  {i > 0 && ", "}
                  <Link to={`/reseaux?id=${r.id}`} onClick={(e) => e.stopPropagation()} className="text-foreground underline-offset-2 hover:underline">
                    {nomDe(r)}
                  </Link>
                </span>
              ))}
            </div>
          )}
          {l.relie.length > 0 && (
            <div className="flex items-center gap-1"><Factory className="w-3 h-3 shrink-0" /> Relie {l.relie.map(nomDe).join(", ")}</div>
          )}
          {l.dessert.length > 0 && (
            <div className="flex items-center gap-1"><Home className="w-3 h-3 shrink-0" /> Dessert {l.dessert.map(nomDe).join(", ")}</div>
          )}
        </div>

        {l.incidents.length > 0 && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-2 text-xs space-y-0.5">
            {l.incidents.slice(0, INCIDENTS_MAX).map((i) => (
              <div key={i.id} className="flex gap-1.5">
                <AlertTriangle className="w-3 h-3 text-orange-500 shrink-0 mt-0.5" />
                <span className="text-foreground">
                  <b>{i.type}</b> · {formatDate(i.date)}{i.gravite && ` · gravité ${i.gravite}`}
                </span>
              </div>
            ))}
            {l.incidents.length > INCIDENTS_MAX && (
              <div className="text-muted-foreground pl-[18px]">et {l.incidents.length - INCIDENTS_MAX} autre(s) dans le détail</div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-0.5 text-xs font-medium text-primary">
          Voir le détail <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </CardContent>
    </Card>
  );
}

function LignesPage() {
  // réseau et ligne ouverte dans l'adresse : /lignes?reseau=ReseauNational_01&ligne=LigneHauteTension_02
  const [params, setParams] = useSearchParams();
  const reseau = params.get("reseau") || "";
  const ligneOuverte = params.get("ligne");
  const changer = (cle, valeur) => {
    const p = new URLSearchParams(params);
    if (valeur) p.set(cle, valeur);
    else p.delete(cle);
    setParams(p, { replace: cle === "ligne" ? false : true });
  };

  const [type, setType] = useState("");
  const [etat, setEtat] = useState("");
  const [saisie, setSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [ajout, setAjout] = useState(false);
  // la recherche part quand la frappe s'arrête, pas à chaque lettre
  useEffect(() => {
    const t = setTimeout(() => setRecherche(saisie.trim()), 250);
    return () => clearTimeout(t);
  }, [saisie]);

  const stats = useApi("/lignes/stats");
  const reseaux = useApi("/reseaux");
  const filtres = new URLSearchParams();
  if (reseau) filtres.set("reseau", reseau);
  if (recherche) filtres.set("q", recherche);
  const list = useApi(`/lignes${filtres.size ? `?${filtres}` : ""}`);

  const error = stats.error || list.error;
  const s = stats.data;
  const base = list.data || [];
  // Les nombres de chaque filtre tiennent compte de l'autre filtre
  const parEtat = base.filter((l) => !etat || l.etat === etat);
  const parType = base.filter((l) => !type || l.type === type);
  const items = parEtat.filter((l) => !type || l.type === type);
  const chartData = (s?.parType || []).map((p) => ({ type: p.type, name: TYPE_LABEL[p.type] || p.type, km: p.longueurKm, nombre: p.nombre }));

  const optionsType = [
    { key: "", label: "Toutes", n: parEtat.length },
    ...TYPES_LIGNE.map((t) => ({ key: t, label: TYPE_LABEL[t], n: parEtat.filter((l) => l.type === t).length })),
  ];
  const optionsEtat = [
    { key: "", label: "Tous états", n: parType.length },
    ...ETATS_LIGNE.map((e) => ({ key: e, label: ETAT_LABEL[e], n: parType.filter((l) => l.etat === e).length })),
  ];

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
            Lignes basse, moyenne et haute tension du smart grid, issues de l'ontologie SolarX.
          </p>
        </div>
        <Button className="w-fit" onClick={() => setAjout(true)}>
          <Plus className="w-4 h-4" /> Ajouter une ligne
        </Button>
      </div>

      {error && <Erreur error={error} />}
      {!error && (!s || !list.data) && <Chargement />}

      {!error && s && list.data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi icon={Cable} label="Lignes" value={s.nombre} hint={s.parType.map((p) => `${p.nombre} ${(TYPE_LABEL[p.type] || p.type).toLowerCase()}`).join(" · ")} />
            <Kpi icon={Ruler} label="Longueur totale" value={formatKm(s.longueurTotaleKm)} hint="Toutes les lignes mises bout à bout" />
            <Kpi icon={AlertTriangle} label="Lignes en panne" value={s.lignesEnPanne} hint="Panne dans les 30 derniers jours" alerte />
            <Kpi icon={Home} label="Consommateurs desservis" value={s.consommateursDesservis} hint="Alimentés par au moins une ligne" />
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

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder="Rechercher une ligne par son nom…"
              aria-label="Rechercher une ligne"
              className="pl-8"
            />
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center gap-3">
            <Filtre options={optionsType} valeur={type} onChange={setType} />
            <Filtre options={optionsEtat} valeur={etat} onChange={setEtat} />
            <NativeSelect value={reseau} onChange={(e) => changer("reseau", e.target.value)} className="xl:ml-auto w-full sm:w-64" aria-label="Filtrer par réseau">
              <NativeSelectOption value="">Tous les réseaux</NativeSelectOption>
              {(reseaux.data || []).map((r) => (
                <NativeSelectOption key={r.id} value={r.id}>{nomDe(r)}</NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <Card expandable={false}>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2"><MapIcon className="w-4 h-4" /> Carte des lignes</CardTitle>
              <CardDescription className="text-xs">
                Chaque ligne relie la ville de ses installations à celle de ses consommateurs. Cliquez sur une ligne pour voir son détail.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CarteLignes lignes={items} onSelect={(id) => changer("ligne", id)} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((l) => <LigneCard key={l.id} l={l} onOpen={(id) => changer("ligne", id)} />)}
          </div>
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8 flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" /> Aucune ligne ne correspond à ces filtres.
            </div>
          )}
        </>
      )}

      <DetailLigne ligneId={ligneOuverte} onClose={() => changer("ligne", null)} />
      <FormLigne
        open={ajout}
        onClose={() => setAjout(false)}
        onSaved={(l) => {
          setAjout(false);
          changer("ligne", l.id);
        }}
      />
    </div>
  );
}

export { LignesPage as default };
