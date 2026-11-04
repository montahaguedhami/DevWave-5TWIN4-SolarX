import { X, Copy, Check } from "lucide-react";
import { useState } from "react";

export function SparqlModal({ isOpen, onClose, sparql, title = "Requête SPARQL exécutée" }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copy = () => {
    navigator.clipboard.writeText(sparql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copié !" : "Copier"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4 bg-neutral-950 font-mono text-xs text-neutral-200 overflow-x-auto max-h-[60vh] leading-relaxed">
          <pre>{sparql}</pre>
        </div>
      </div>
    </div>
  );
}

