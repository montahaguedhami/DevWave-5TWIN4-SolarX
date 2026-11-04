import { useState, useEffect } from "react";
import { X, Loader2, AlertTriangle, Wrench, ShieldAlert } from "lucide-react";

const inputCls =
  "w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

export function IncidentModal({ isOpen, onClose, initialData, mode = "incident", onSubmit }) {
  const [formData, setFormData] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const isMaint = mode === "maintenance";
  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        dateOccurrence: initialData.dateOccurrence || new Date().toISOString().slice(0, 19),
      });
    } else {
      setFormData({
        type: isMaint ? "Inspection" : "Panne",
        gravite: "Moyenne",
        dateOccurrence: new Date().toISOString().slice(0, 19),
        equipement: "Onduleur_01",
        affecte: "Onduleur_01",
        detectePar: "Capteur_01",
      });
    }
    setError(null);
  }, [initialData, isMaint, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg border ${
              isMaint
                ? "bg-sky-500/10 text-sky-500 border-sky-500/20"
                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
            }`}>
              {isMaint ? <Wrench className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            </span>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {isEdit
                  ? `Modifier ${isMaint ? "la maintenance" : "l'incident"}`
                  : `Enregistrer ${isMaint ? "une maintenance" : "un incident"}`}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {isMaint ? "Planification et suivi des interventions" : "Signalement d'anomalie réseau"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Type <span className="text-destructive">*</span>
              </label>
              {isMaint ? (
                <select
                  disabled={isEdit}
                  className={inputCls}
                  value={formData.type || "Inspection"}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Inspection">Inspection</option>
                  <option value="MaintenanceCorrective">Maintenance Corrective</option>
                  <option value="MaintenancePredictive">Maintenance Prédictive</option>
                  <option value="MaintenancePreventive">Maintenance Préventive</option>
                </select>
              ) : (
                <select
                  disabled={isEdit}
                  className={inputCls}
                  value={formData.type || "Panne"}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Panne">Panne</option>
                  <option value="Alerte">Alerte</option>
                  <option value="Surcharge">Surcharge</option>
                </select>
              )}
            </div>

            {!isMaint && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Niveau de gravité
                </label>
                <select
                  className={inputCls}
                  value={formData.gravite || "Moyenne"}
                  onChange={(e) => setFormData({ ...formData, gravite: e.target.value })}
                >
                  <option value="Critique">Critique</option>
                  <option value="Élevée">Élevée</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Faible">Faible</option>
                </select>
              </div>
            )}

            <div className={isMaint ? "sm:col-span-2" : "sm:col-span-2"}>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Intitulé / Désignation <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                className={inputCls}
                placeholder={isMaint ? "Ex. Contrôle thermographique semestriel" : "Ex. Échauffement anormal dissipateur"}
                value={formData.nom || ""}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {isMaint ? "Équipement concerné" : "Composant affecté"}
              </label>
              <select
                className={inputCls}
                value={isMaint ? formData.equipement || "" : formData.affecte || ""}
                onChange={(e) => {
                  if (isMaint) setFormData({ ...formData, equipement: e.target.value });
                  else setFormData({ ...formData, affecte: e.target.value });
                }}
              >
                <option value="Onduleur_01">Onduleur Principal (Onduleur_01)</option>
                <option value="Capteur_04">Anémomètre Parc Éolien (Capteur_04)</option>
                <option value="Compteur_04">Compteur École Tunis (Compteur_04)</option>
                <option value="Batterie_05">Batterie École Tunis (Batterie_05)</option>
                <option value="LigneHauteTension_01">Ligne Haute Tension 01</option>
                <option value="LigneMoyenneTension_01">Ligne Moyenne Tension 01</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Date et heure
              </label>
              <input
                type="datetime-local"
                className={inputCls}
                value={(formData.dateOccurrence || "").slice(0, 16)}
                onChange={(e) => setFormData({ ...formData, dateOccurrence: e.target.value ? `${e.target.value}:00` : "" })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Description technique détaillée
              </label>
              <textarea
                rows={3}
                className={inputCls}
                placeholder="Rapport d'intervention ou diagnostic d'avarie..."
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? "Mettre à jour" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

