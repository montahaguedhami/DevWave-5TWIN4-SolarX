import { useMemo, useState } from "react";
import { Cpu, Gauge, Radio, Zap, Search, CheckCircle2, Wrench, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EtatBadge from "@/components/solarx/etat-badge";
import { LoadingState, ErrorState } from "@/components/solarx/api-state";
import { useApi, formatKw } from "@/services/solarx-api";

const TYPES = {
  CompteurIntelligent: { label: "Compteur intelligent", plural: "Compteurs intelligents", Icon: Gauge },
  Capteur: { label: "Capteur", plural: "Capteurs", Icon: Radio },
  Onduleur: { label: "Onduleur", plural: "Onduleurs", Icon: Zap },
};
const ETATS = ["Fonctionnel", "Maintenance", "En panne"];
const ETAT_ICON = { Fonctionnel: CheckCircle2, Maintenance: Wrench, "En panne": XCircle };
const ETAT_COLOR = { Fonctionnel: "text-emerald-500", Maintenance: "text-amber-500", "En panne": "text-red-500" };

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function EquipementsPage() {
  const [type, setType] = useState("");
  const [etat, setEtat] = useState("");
  const [search, setSearch] = useState("");

  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (etat) params.set("etat", etat);
  const qs = params.toString();

  const stats = useApi("/api/equipements/stats");
  const list = useApi(`/api/equipements${qs ? `?${qs}` : ""}`);
  const error = stats.error || list.error;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list.data || [];
    return (list.data || []).filter((e) =>
      [e.id, e.nom, e.marque, e.localisation, e.proprietaire].some((v) => v && String(v).toLowerCase().includes(q))
    );
  }, [list.data, search]);

  const s = stats.data;
  const dispo = s && s.total ? Math.round(((s.parEtat.Fonctionnel || 0) / s.total) * 100) : 0;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-card/50 text-primary border border-border">
            <Cpu className="w-5 h-5" />
          </div>
          Équipements
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Capteurs, compteurs intelligents et onduleurs du réseau, avec leur état, leur propriétaire et les mesures produites.
        </p>
      </div>

      {error && <ErrorState error={error} />}
      {!error && !s && <LoadingState />}

      {!error && s && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card expandable={false}>
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">Total équipements</div>
              <div className="text-3xl font-black font-mono text-foreground mt-1">{s.total}</div>
              <div className="text-xs text-muted-foreground mt-1">Disponibilité {dispo}%</div>
            </CardContent>
          </Card>
          {ETATS.map((e) => {
            const Icon = ETAT_ICON[e];
            return (
              <Card
                key={e}
                expandable={false}
                className={`cursor-pointer ${etat === e ? "border-primary" : ""}`}
                onClick={() => setEtat(etat === e ? "" : e)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className={`w-3.5 h-3.5 ${ETAT_COLOR[e]}`} /> {e}
                  </div>
                  <div className={`text-3xl font-black font-mono mt-1 ${ETAT_COLOR[e]}`}>{s.parEtat[e] || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">{etat === e ? "Filtre actif · cliquer pour retirer" : "Cliquer pour filtrer"}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!error && (
        <Card expandable={false}>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Liste des équipements</CardTitle>
            <CardDescription className="text-xs">
              {s && Object.entries(TYPES).map(([k, v]) => `${s.parType[k] || 0} ${((s.parType[k] || 0) > 1 ? v.plural : v.label).toLowerCase()}`).join(" · ")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex gap-1 p-1 rounded-xl bg-muted/60 border border-border w-fit overflow-x-auto max-w-full">
                <FilterButton active={!type} onClick={() => setType("")}>Tous</FilterButton>
                {Object.entries(TYPES).map(([k, v]) => (
                  <FilterButton key={k} active={type === k} onClick={() => setType(k)}>{v.plural}</FilterButton>
                ))}
              </div>
              <div className="relative md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(ev) => setSearch(ev.target.value)}
                  placeholder="Rechercher nom, marque, lieu…"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {!list.data ? (
              <LoadingState />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Équipement</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Marque</TableHead>
                      <TableHead>Installé dans</TableHead>
                      <TableHead>Localisation</TableHead>
                      <TableHead className="text-right">Mesures</TableHead>
                      <TableHead>État</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((e) => {
                      const T = TYPES[e.type] || { label: e.type, Icon: Cpu };
                      return (
                        <TableRow key={e.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-primary/10 text-primary"><T.Icon className="w-3.5 h-3.5" /></div>
                              <div>
                                <div className="font-medium text-foreground">{e.nom || e.id}</div>
                                <div className="text-xs text-muted-foreground">
                                  {e.id}{e.puissanceMax != null && ` · ${formatKw(e.puissanceMax)}`}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{T.label}</TableCell>
                          <TableCell className="text-muted-foreground">{e.marque || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{e.proprietaire || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{e.localisation || "—"}</TableCell>
                          <TableCell className="text-right font-mono">{e.nbMesures ?? 0}</TableCell>
                          <TableCell>
                            <EtatBadge etat={e.etat} />
                            {e.evenements?.[0] && (
                              <div className="text-[11px] text-muted-foreground mt-1 max-w-[220px]" title={e.evenements[0].description}>
                                {e.evenements[0].typeEvenement.replace(/([a-z])([A-Z])/g, "$1 $2")}
                                {e.evenements[0].date && ` · ${new Date(e.evenements[0].date).toLocaleDateString("fr-FR")}`}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Aucun équipement ne correspond à ces filtres.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { EquipementsPage as default };
