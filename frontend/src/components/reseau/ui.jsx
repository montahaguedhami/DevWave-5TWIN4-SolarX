// Composants, libellés et formats communs aux pages Lignes, Réseaux et Assistant IA
import { CheckCircle2, XCircle, HelpCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const TYPE_LABEL = {
  LigneHauteTension: "Haute tension",
  LigneMoyenneTension: "Moyenne tension",
  LigneBasseTension: "Basse tension",
  ReseauElectrique: "Réseau électrique",
  ReseauTransport: "Réseau de transport",
  ReseauDistribution: "Réseau de distribution",
};

export const TYPE_COLOR = { LigneHauteTension: "#ef4444", LigneMoyenneTension: "#f59e0b", LigneBasseTension: "#22c55e" };
export const TYPES_LIGNE = ["LigneHauteTension", "LigneMoyenneTension", "LigneBasseTension"];
export const ETATS_LIGNE = ["Fonctionnel", "Alerte", "En panne"];

export const label = (id) => (id ? id.replaceAll("_", " ") : "—");
// Nom lisible d'un élément renvoyé par l'API ({ id, nom }) : le nom de l'ontologie, sinon l'identifiant
export const nomDe = (x) => x?.nom || label(x?.id);
export const formatDate = (d) => {
  const date = d ? new Date(d) : null;
  return date && !isNaN(date) ? date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : d || "—";
};
export const formatKm = (km) => (km == null ? "—" : `${km.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`);
export const formatKv = (kv) => (kv == null ? "—" : `${kv.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} kV`);

// alerte : la valeur s'affiche en rouge quand elle est supérieure à 0 (ex. lignes en panne)
export function Kpi({ icon: Icon, label, value, hint, alerte = false }) {
  const rouge = alerte && Number(value) > 0;
  return (
    <Card expandable={false} className={rouge ? "border-red-500/40" : undefined}>
      <CardContent className="p-5">
        <div className={cn("flex items-center gap-2 text-xs", rouge ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>
          <Icon className="w-3.5 h-3.5" /> {label}
        </div>
        <div className={cn("text-2xl font-black font-mono mt-1", rouge ? "text-red-600 dark:text-red-400" : "text-foreground")}>{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}

const ETATS = {
  Fonctionnel: { cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", Icon: CheckCircle2 },
  Alerte: { cls: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30", Icon: AlertTriangle },
  "En panne": { cls: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30", Icon: XCircle },
};

// État d'une ligne, calculé par l'API à partir des incidents qui l'affectent
export function EtatLigne({ etat }) {
  const { cls, Icon } = ETATS[etat] || { cls: "bg-muted text-muted-foreground border-border", Icon: HelpCircle };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap", cls)}>
      <Icon className="w-3 h-3" />
      {etat || "Inconnu"}
    </span>
  );
}

export function Chargement() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" /> Chargement des données de l'ontologie…
    </div>
  );
}

export function Erreur({ error }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
      <div className="font-semibold flex items-center gap-2"><XCircle className="w-4 h-4" /> Impossible de charger les données</div>
      <div className="mt-1">{error?.message}</div>
      <div className="mt-1 text-xs text-muted-foreground">Vérifiez que Fuseki et le backend sont lancés.</div>
    </div>
  );
}
