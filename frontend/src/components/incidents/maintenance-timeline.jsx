import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Wrench, Calendar as CalendarIcon, Clock, List, ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { MaintenanceBadge } from "./incident-badge";

const TYPES_MAINTENANCE = [
  { key: "", label: "Toutes" },
  { key: "Inspection", label: "Inspections" },
  { key: "MaintenanceCorrective", label: "Correctives" },
  { key: "MaintenancePredictive", label: "Prédictives" },
  { key: "MaintenancePreventive", label: "Préventives" },
];

export function MaintenanceTimeline({ maintenances, onCreer, onModifier, onSupprimer }) {
  const [viewMode, setViewMode] = useState("timeline"); // "timeline" | "calendrier"
  const [filtreType, setFiltreType] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date(2026, 9, 1)); // Octobre 2026

  const filtered = useMemo(() => {
    return (maintenances || []).filter((m) => {
      if (!filtreType) return true;
      return m.type === filtreType;
    });
  }, [maintenances, filtreType]);

  // Groupement par date pour la timeline
  const groupedByDate = useMemo(() => {
    const map = {};
    for (const m of filtered) {
      const d = m.dateOccurrence ? m.dateOccurrence.split("T")[0] : "Non planifiée";
      if (!map[d]) map[d] = [];
      map[d].push(m);
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  // Générateur de jours pour le mode calendrier
  const daysInMonth = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Lundi en premier (0 = lundi, ..., 6 = dimanche)
    const startOffset = (firstDay + 6) % 7;
    const days = [];

    // Jours vides au début
    for (let i = 0; i < startOffset; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const items = (maintenances || []).filter((m) => m.dateOccurrence && m.dateOccurrence.startsWith(dateStr));
      days.push({ day: d, dateStr, items, empty: false, key: `day-${d}` });
    }
    return days;
  }, [selectedMonth, maintenances]);

  const monthLabel = selectedMonth.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <Card variant="glass" className="border-border">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20">
                <Wrench className="w-4 h-4" />
              </span>
              Planning & Maintenances
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Suivi chronologique des inspections, maintenances préventives, correctives et prédictives.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Bascule Timeline / Calendrier */}
            <div className="flex items-center rounded-xl border border-border p-1 bg-card/60">
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  viewMode === "timeline"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Timeline
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendrier")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  viewMode === "calendrier"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                Calendrier
              </button>
            </div>

            {onCreer && (
              <button
                type="button"
                onClick={onCreer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Planifier maintenance
              </button>
            )}
          </div>
        </div>

        {/* Filtres par sous-classe de maintenance */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto">
          {TYPES_MAINTENANCE.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFiltreType(tab.key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filtreType === tab.key
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {viewMode === "timeline" ? (
          /* ================= VUE TIMELINE ================= */
          <div className="relative pl-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60 space-y-6">
            {groupedByDate.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Aucune intervention de maintenance correspondante.
              </div>
            ) : (
              groupedByDate.map(([dateStr, items]) => (
                <div key={dateStr} className="relative space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="absolute -left-6 mt-1 w-3.5 h-3.5 rounded-full border-2 border-primary bg-background shadow" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-md">
                      {dateStr !== "Non planifiée"
                        ? new Date(dateStr).toLocaleDateString("fr-FR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Non planifiée"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1">
                    {items.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-xl border border-border bg-card/50 p-3.5 space-y-2 transition-all hover:border-primary/40 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <MaintenanceBadge type={m.type} size="sm" />
                              <span className="font-mono text-[11px] text-muted-foreground font-semibold">
                                {m.id}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-foreground">
                              {m.nom}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1">
                            {onModifier && (
                              <button
                                type="button"
                                onClick={() => onModifier(m)}
                                className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Modifier"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onSupprimer && (
                              <button
                                type="button"
                                onClick={() => onSupprimer(m.id)}
                                className="p-1 rounded text-muted-foreground hover:text-rose-500 cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {m.description}
                        </p>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 text-[11px]">
                          <div className="flex items-center gap-1 text-muted-foreground font-medium">
                            <span>Équipement ciblé :</span>
                            <span className="px-1.5 py-0.5 rounded bg-muted font-semibold text-foreground">
                              {m.equipementNom || m.equipement || "Réseau"}
                            </span>
                          </div>

                          {m.dateOccurrence && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(m.dateOccurrence).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* ================= VUE CALENDRIER ================= */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <h3 className="text-sm font-extrabold capitalize text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                {monthLabel}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedMonth(
                      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1)
                    )
                  }
                  className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedMonth(
                      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1)
                    )
                  }
                  className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground pb-1">
              <div>Lun</div>
              <div>Mar</div>
              <div>Mer</div>
              <div>Jeu</div>
              <div>Ven</div>
              <div>Sam</div>
              <div>Dim</div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {daysInMonth.map((d) => {
                if (d.empty) {
                  return (
                    <div
                      key={d.key}
                      className="min-h-[85px] rounded-lg bg-muted/20 border border-transparent p-1.5"
                    />
                  );
                }
                const hasItems = d.items && d.items.length > 0;
                return (
                  <div
                    key={d.key}
                    className={`min-h-[85px] rounded-lg border p-1.5 flex flex-col justify-between transition-colors ${
                      hasItems
                        ? "bg-card border-primary/30 shadow-xs"
                        : "bg-card/40 border-border/50"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                      <span>{d.day}</span>
                      {hasItems && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </div>

                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[60px]">
                      {d.items.map((it) => (
                        <div
                          key={it.id}
                          onClick={() => onModifier && onModifier(it)}
                          className="text-[10px] p-1 rounded bg-muted/80 hover:bg-muted font-semibold truncate cursor-pointer border border-border/40"
                          title={`${it.type} : ${it.nom} (${it.equipementNom || it.equipement})`}
                        >
                          {it.nom || it.id}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

