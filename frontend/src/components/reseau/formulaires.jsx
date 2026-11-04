// Formulaires de création / modification (lignes, réseaux) et confirmation de suppression
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { TYPE_LABEL, TYPES_LIGNE, nomDe } from "@/components/reseau/ui";
import { lignesApi, reseauxApi, useApi } from "@/services/reseau-api";

const TENSION_AIDE = {
  LigneBasseTension: "Moins de 1 kV",
  LigneMoyenneTension: "De 1 à 50 kV",
  LigneHauteTension: "Plus de 50 kV",
};
const TYPES_RESEAU = ["ReseauTransport", "ReseauDistribution"];

const ids = (items) => (items || []).map((x) => x.id);

function Champ({ label, aide, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {aide && <div className="text-xs text-muted-foreground">{aide}</div>}
    </div>
  );
}

// Liste de cases à cocher : une relation peut avoir plusieurs valeurs
function Choix({ label, options, valeurs, onChange }) {
  const basculer = (id) => onChange(valeurs.includes(id) ? valeurs.filter((v) => v !== id) : [...valeurs, id]);
  return (
    <Champ label={label}>
      <div className="max-h-32 overflow-y-auto rounded-lg border border-input p-2 space-y-1">
        {(options || []).length === 0 && <div className="text-xs text-muted-foreground">Aucun choix disponible.</div>}
        {(options || []).map((o) => (
          <label key={o.id} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="accent-primary" checked={valeurs.includes(o.id)} onChange={() => basculer(o.id)} />
            <span className="truncate">{nomDe(o)}</span>
          </label>
        ))}
      </div>
    </Champ>
  );
}

function Fenetre({ open, onClose, titre, description, enregistrer, children }) {
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  const soumettre = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      await enregistrer();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titre}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={soumettre} className="space-y-3">
          {children}
          {erreur && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-600 dark:text-red-400">{erreur}</div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={envoi}>{envoi ? "Enregistrement…" : "Enregistrer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContenuLigne({ ligne, onClose, onSaved }) {
  const referentiel = useApi("/lignes/referentiel");
  const reseaux = useApi("/reseaux");
  const [type, setType] = useState(ligne?.type || TYPES_LIGNE[0]);
  const [nom, setNom] = useState(ligne?.nom || "");
  const [tension, setTension] = useState(ligne?.tensionKV ?? "");
  const [longueur, setLongueur] = useState(ligne?.longueurKm ?? "");
  const [reseauxChoisis, setReseauxChoisis] = useState(ids(ligne?.reseaux));
  const [relie, setRelie] = useState(ids(ligne?.relie));
  const [dessert, setDessert] = useState(ids(ligne?.dessert));

  const enregistrer = async () => {
    const corps = { nom, tensionKV: Number(tension), longueurKm: Number(longueur), reseaux: reseauxChoisis, relie, dessert };
    const resultat = ligne ? await lignesApi.modifier(ligne.id, corps) : await lignesApi.creer({ ...corps, type });
    onSaved(resultat);
  };

  return (
    <Fenetre
      open
      onClose={onClose}
      titre={ligne ? "Modifier la ligne" : "Ajouter une ligne"}
      description="Les changements sont enregistrés dans le système."
      enregistrer={enregistrer}
    >
      <Champ label="Type" aide={ligne ? "Le type ne se modifie pas : il fait partie de l'identifiant de la ligne." : undefined}>
        <NativeSelect value={type} onChange={(e) => setType(e.target.value)} disabled={!!ligne} className="w-full">
          {TYPES_LIGNE.map((t) => <NativeSelectOption key={t} value={t}>{TYPE_LABEL[t]}</NativeSelectOption>)}
        </NativeSelect>
      </Champ>
      <Champ label="Nom">
        <Input required maxLength={120} value={nom} onChange={(e) => setNom(e.target.value)} />
      </Champ>
      <div className="grid grid-cols-2 gap-3">
        <Champ label="Tension (kV)" aide={TENSION_AIDE[type]}>
          <Input required type="number" min="0" step="any" value={tension} onChange={(e) => setTension(e.target.value)} />
        </Champ>
        <Champ label="Longueur (km)">
          <Input required type="number" min="0" step="any" value={longueur} onChange={(e) => setLongueur(e.target.value)} />
        </Champ>
      </div>
      <Choix label="Réseaux" options={reseaux.data} valeurs={reseauxChoisis} onChange={setReseauxChoisis} />
      <Choix label="Installations reliées" options={referentiel.data?.installations} valeurs={relie} onChange={setRelie} />
      <Choix label="Consommateurs desservis" options={referentiel.data?.consommateurs} valeurs={dessert} onChange={setDessert} />
    </Fenetre>
  );
}

// Le contenu n'existe que pendant l'ouverture : le formulaire repart toujours des bonnes valeurs
export const FormLigne = ({ open, ...props }) => (open ? <ContenuLigne {...props} /> : null);

function ContenuReseau({ reseau, lignesActuelles, onClose, onSaved }) {
  const lignes = useApi("/lignes");
  const [type, setType] = useState(reseau?.type || TYPES_RESEAU[0]);
  const [nom, setNom] = useState(reseau?.nom || "");
  const [choisies, setChoisies] = useState(ids(lignesActuelles));

  const enregistrer = async () => {
    const corps = { nom, lignes: choisies };
    const resultat = reseau ? await reseauxApi.modifier(reseau.id, corps) : await reseauxApi.creer({ ...corps, type });
    onSaved(resultat);
  };

  return (
    <Fenetre
      open
      onClose={onClose}
      titre={reseau ? "Modifier le réseau" : "Ajouter un réseau"}
      description="Les changements sont enregistrés dans le système."
      enregistrer={enregistrer}
    >
      {!reseau && (
        <Champ label="Type">
          <NativeSelect value={type} onChange={(e) => setType(e.target.value)} className="w-full">
            {TYPES_RESEAU.map((t) => <NativeSelectOption key={t} value={t}>{TYPE_LABEL[t]}</NativeSelectOption>)}
          </NativeSelect>
        </Champ>
      )}
      <Champ label="Nom">
        <Input required maxLength={120} value={nom} onChange={(e) => setNom(e.target.value)} />
      </Champ>
      <Choix label="Lignes du réseau" options={lignes.data} valeurs={choisies} onChange={setChoisies} />
    </Fenetre>
  );
}

export const FormReseau = ({ open, ...props }) => (open ? <ContenuReseau {...props} /> : null);

export function Confirmer({ open, onClose, titre, texte, onConfirm }) {
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  const confirmer = async () => {
    setEnvoi(true);
    setErreur(null);
    try {
      await onConfirm();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titre}</AlertDialogTitle>
          <AlertDialogDescription>{texte}</AlertDialogDescription>
        </AlertDialogHeader>
        {erreur && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-600 dark:text-red-400">{erreur}</div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <Button variant="destructive" disabled={envoi} onClick={confirmer}>{envoi ? "Suppression…" : "Supprimer"}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
