import { useEffect, useState } from "react";
import { Loader2, X, AlertTriangle, Trash2 } from "lucide-react";

const inputCls =
  "w-full px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

function Overlay({ children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Formulaire générique (création / modification).
 * fields : [{ name, label, type: "text" | "number" | "select", options, required, min, step, hint, disabled }]
 */
export function FormModal({ title, subtitle, fields, initial, submitLabel = "Enregistrer", onSubmit, onClose }) {
  const [values, setValues] = useState(initial || {});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (name, v) => setValues((old) => ({ ...old, [name]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // champs vides -> non envoyés ; nombres convertis
      const body = {};
      for (const f of fields) {
        if (f.disabled) continue;
        const v = values[f.name];
        if (v === undefined || v === "" || v === null) continue;
        body[f.name] = f.type === "number" ? Number(v) : v;
      }
      await onSubmit(body);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <form onSubmit={submit}>
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer" aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <label key={f.name} className={`text-xs space-y-1 ${f.full ? "sm:col-span-2" : ""}`}>
              <span className="font-medium text-muted-foreground">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </span>
              {f.type === "select" ? (
                <select
                  className={inputCls}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                  required={f.required}
                  disabled={f.disabled}
                >
                  <option value="">{f.placeholder || "—"}</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  className={inputCls}
                  type={f.type || "text"}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                  required={f.required}
                  min={f.min}
                  step={f.step || (f.type === "number" ? "any" : undefined)}
                  placeholder={f.placeholder}
                  disabled={f.disabled}
                />
              )}
              {f.hint && <span className="block text-[11px] text-muted-foreground">{f.hint}</span>}
            </label>
          ))}
        </div>

        {error && (
          <div className="mx-5 mb-4 flex gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted cursor-pointer">
            Annuler
          </button>
          <button type="submit" disabled={busy} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2 cursor-pointer">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} {submitLabel}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

export function ConfirmModal({ title, message, onConfirm, onClose }) {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  return (
    <Overlay onClose={onClose}>
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Trash2 className="w-5 h-5 text-red-500" /> {title}
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
      <div className="flex justify-end gap-2 p-5 border-t border-border">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted cursor-pointer">
          Annuler
        </button>
        <button type="button" onClick={go} disabled={busy} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 inline-flex items-center gap-2 cursor-pointer">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Supprimer
        </button>
      </div>
    </Overlay>
  );
}

export function ActionButton({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`p-1.5 rounded-md border border-border cursor-pointer transition-colors ${
        danger ? "text-red-500 hover:bg-red-500/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
