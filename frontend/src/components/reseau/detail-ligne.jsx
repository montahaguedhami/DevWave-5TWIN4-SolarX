// Panneau latéral : détail d'une ligne (GET /lignes/{id})
import { useState } from "react";
import { Link } from "react-router-dom";
import { Cable, Network, Factory, Home, AlertTriangle, MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { EtatLigne, Chargement, Erreur, TYPE_LABEL, TYPE_COLOR, nomDe, formatKm, formatKv, formatDate, label } from "@/components/reseau/ui";
import { FormLigne, Confirmer } from "@/components/reseau/formulaires";
import { lignesApi, useApi } from "@/services/reseau-api";

function Section({ icon: Icon, titre, vide, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="w-3.5 h-3.5" /> {titre}
      </div>
      {children || <div className="text-xs text-muted-foreground">{vide}</div>}
    </div>
  );
}

function Element({ x }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
      <div className="min-w-0">
        <div className="font-medium text-foreground truncate">{nomDe(x)}</div>
        <div className="text-xs text-muted-foreground">{label(x.type)}</div>
      </div>
      {x.ville && (
        <span
          className="flex items-center gap-1 text-xs text-muted-foreground shrink-0"
          title={x.lieuDeduit ? `Lieu déduit de ${x.stockageNom || label(x.stockage)} : pas de ville dans l'ontologie` : undefined}
        >
          <MapPin className="w-3 h-3" /> {x.villeNom || label(x.ville)}{x.lieuDeduit && " (déduit)"}
        </span>
      )}
    </div>
  );
}

function Contenu({ ligneId, onClose }) {
  const { data: l, error } = useApi(`/lignes/${ligneId}`);
  const [edition, setEdition] = useState(false);
  const [suppression, setSuppression] = useState(false);
  if (error) return <Erreur error={error} />;
  if (!l) return <Chargement />;

  return (
    <>
      <SheetHeader className="border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ background: `${TYPE_COLOR[l.type]}22`, color: TYPE_COLOR[l.type] }}>
            <Cable className="w-4 h-4" />
          </div>
          <SheetTitle className="text-base font-bold">{nomDe(l)}</SheetTitle>
        </div>
        <SheetDescription className="flex items-center gap-2">
          {TYPE_LABEL[l.type] || l.type} <EtatLigne etat={l.etat} />
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-xs text-muted-foreground">Tension</div>
            <div className="font-mono font-bold text-foreground">{formatKv(l.tensionKV)}</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-xs text-muted-foreground">Longueur</div>
            <div className="font-mono font-bold text-foreground">{formatKm(l.longueurKm)}</div>
          </div>
        </div>

        <Section icon={Network} titre="Réseau" vide="Rattachée à aucun réseau.">
          {l.reseaux.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {l.reseaux.map((r) => (
                <Link
                  key={r.id}
                  to={`/reseaux?id=${r.id}`}
                  onClick={onClose}
                  className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary/20"
                >
                  {nomDe(r)}
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section icon={Factory} titre="Installations reliées" vide="Aucune installation reliée.">
          {l.relie.length > 0 && <div className="space-y-2">{l.relie.map((x) => <Element key={x.id} x={x} />)}</div>}
        </Section>

        <Section icon={Home} titre="Consommateurs desservis" vide="Aucun consommateur desservi.">
          {l.dessert.length > 0 && <div className="space-y-2">{l.dessert.map((x) => <Element key={x.id} x={x} />)}</div>}
        </Section>

        <Section icon={AlertTriangle} titre="Incidents" vide="Aucun incident sur cette ligne.">
          {l.incidents.length > 0 && (
            <div className="space-y-2">
              {l.incidents.map((i) => (
                <div key={i.id} className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-foreground">{i.type}</b>
                    <span className="text-muted-foreground">{formatDate(i.date)}</span>
                  </div>
                  {i.gravite && <div className="text-foreground">Gravité : {i.gravite}</div>}
                  {i.description && <div className="text-muted-foreground">{i.description}</div>}
                </div>
              ))}
            </div>
          )}
        </Section>

        <div className="text-xs text-muted-foreground border-t border-border pt-3">
          Identifiant dans l'ontologie : <span className="font-mono">{l.id}</span>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setEdition(true)}>
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </Button>
            <Button variant="destructive" className="flex-1" disabled={l.incidents.length > 0} onClick={() => setSuppression(true)}>
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </Button>
          </div>
          {l.incidents.length > 0 && (
            <div className="text-xs text-muted-foreground">Suppression impossible : un incident concerne cette ligne.</div>
          )}
        </div>
      </div>

      <FormLigne open={edition} ligne={l} onClose={() => setEdition(false)} onSaved={() => setEdition(false)} />
      <Confirmer
        open={suppression}
        onClose={() => setSuppression(false)}
        titre="Supprimer cette ligne ?"
        texte={`« ${nomDe(l)} » sera retirée de l'ontologie, avec ses liens vers les réseaux, les installations et les consommateurs.`}
        onConfirm={async () => {
          await lignesApi.supprimer(l.id);
          onClose();
        }}
      />
    </>
  );
}

export function DetailLigne({ ligneId, onClose }) {
  return (
    <Sheet open={!!ligneId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md gap-0">
        {ligneId && <Contenu ligneId={ligneId} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}
