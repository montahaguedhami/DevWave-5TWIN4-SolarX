import { useEffect, useState } from "react";
import { Cpu, Gauge, Radio, Zap, Search, CheckCircle2, Wrench, XCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EtatBadge from "@/components/stockage/etat-badge";
import { LoadingState, ErrorState } from "@/components/stockage/api-state";
import { useApi, formatKw, equipementApi, label } from "@/services/stockage-api";
import { FormModal, ConfirmModal, ActionButton } from "@/components/stockage/form-modal";

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

function champs(proprietaires, creation) {
  return [
    creation && {
      name: "type", label: "Type", type: "select", required: true,
      options: Object.entries(TYPES).map(([k, v]) => ({ value: k, label: v.label })),
    },
    creation && { name: "id", label: "Identifiant", placeholder: "Généré si vide (ex. Capteur_06)" },
    { name: "nom", label: "Nom", required: true, full: !creation },
    { name: "marque", label: "Marque", placeholder: "Ex. Huawei" },
    { name: "puissanceMaxKW", label: "Puissance max (kW)", type: "number", min: 0, hint: "Surtout pour les onduleurs" },
    { name: "etat", label: "État", type: "select", options: ETATS.map((e) => ({ value: e, label: e })),
      placeholder: "Automatique" },
    { name: "proprietaire", label: "Installé dans", type: "select", full: true,
      options: (proprietaires || []).map((r) => ({ value: r.id, label: r.nom || label(r.id) })) },
  ].filter(Boolean);
}

function useDebounce(valeur, delai = 350) {
  const [v, setV] = useState(valeur);
  useEffect(() => {
    const t = setTimeout(() => setV(valeur), delai);
    return () => clearTimeout(t);
  }, [valeur, delai]);
  return v;
}

function EquipementsPage() {
  const [modal, setModal] = useState(null);
  const proprietaires = useApi("/equipements/proprietaires");
  const [type, setType] = useState("");
  const [etat, setEtat] = useState("");
  const [search, setSearch] = useState("");

  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (etat) params.set("etat", etat);
  const qRecherche = useDebounce(search).trim();
  if (qRecherche) params.set("q", qRecherche); // recherche faite par Fuseki (FILTER CONTAINS)
  const qs = params.toString();
  const listPath = `/equipements${qs ? `?${qs}` : ""}`;

  const stats = useApi("/equipements/stats");
  const list = useApi(listPath);
  const error = stats.error || list.error;

  const rows = list.data || [];

  const s = stats.data;
  const dispo = s && s.total ? Math.round(((s.parEtat.Fonctionnel || 0) / s.total) * 100) : 0;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
        <button
          type="button"
          onClick={() => setModal({ mode: "creer" })}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" /> Ajouter un équipement
        </button>
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
                  aria-label="Rechercher un équipement"
                />
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              {list.data ? `${rows.length} équipement${rows.length > 1 ? "s" : ""}` : "Recherche…"}
            </div>

            {!list.data ? (
              <LoadingState />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Équipement</TableHead>
                      <TableHead>Marque</TableHead>
                      <TableHead>Installé dans</TableHead>
                      <TableHead>Localisation</TableHead>
                      <TableHead className="text-right">Mesures</TableHead>
                      <TableHead>État</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                                  {T.label} · {e.id}{e.puissanceMax != null && ` · ${formatKw(e.puissanceMax)}`}
                                </div>
                              </div>
                            </div>
                          </TableCell>
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
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <ActionButton icon={Pencil} label="Modifier" onClick={() => setModal({ mode: "modifier", item: e })} />
                              <ActionButton icon={Trash2} label="Supprimer" danger onClick={() => setModal({ mode: "supprimer", item: e })} />
                            </div>
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

      {modal?.mode === "creer" && (
        <FormModal
          title="Ajouter un équipement"
          subtitle="Renseignez les informations du nouvel équipement"
          fields={champs(proprietaires.data, true)}
          initial={{ type: type || "Capteur" }}
          submitLabel="Créer"
          onSubmit={(body) => equipementApi.creer(body)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.mode === "modifier" && (
        <FormModal
          title={`Modifier ${modal.item.nom || modal.item.id}`}
          subtitle={modal.item.id}
          fields={champs(proprietaires.data, false)}
          initial={{
            nom: modal.item.nom,
            marque: modal.item.marque,
            puissanceMaxKW: modal.item.puissanceMax,
            etat: modal.item.etatDeclare,
            proprietaire: modal.item.proprietaireId,
          }}
          onSubmit={(body) => equipementApi.modifier(modal.item.id, body)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.mode === "supprimer" && (
        <ConfirmModal
          title={`Supprimer ${modal.item.nom || modal.item.id} ?`}
          message="Cet équipement et ses liens seront définitivement supprimés."
          onConfirm={() => equipementApi.supprimer(modal.item.id)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

export { EquipementsPage as default };
