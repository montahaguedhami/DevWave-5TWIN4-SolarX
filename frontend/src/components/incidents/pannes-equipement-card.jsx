import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertCircle, ChevronDown, ChevronRight, Cpu, Calendar, Clock, AlertTriangle } from "lucide-react";
import { IncidentBadge, GraviteBadge } from "./incident-badge";

export function PannesEquipementCard({ pannesGroupes, onSelectEquipement }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (eqId) => {
    setExpanded((prev) => ({ ...prev, [eqId]: !prev[eqId] }));
  };

  const totalPannes = (pannesGroupes || []).reduce((acc, curr) => acc + (curr.nbPannes || 0), 0);

  return (
    <Card variant="glass" className="border-border">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <AlertCircle className="w-4 h-4" />
              </span>
              Pannes par équipement
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Agrégation du nombre d'avaries détectées par composant et historique d'intervention.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 w-fit">
            <span>Total : {totalPannes} pannes recensées</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {(!pannesGroupes || pannesGroupes.length === 0) ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Aucune panne enregistrée sur les équipements.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pannesGroupes.map((item) => {
              const isExp = !!expanded[item.equipement];
              return (
                <div
                  key={item.equipement}
                  className="rounded-xl border border-border bg-card/60 p-4 transition-all hover:border-rose-500/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-muted font-mono font-bold text-foreground">
                          {item.equipement}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {item.equipementType}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground line-clamp-1">
                        {item.equipementNom}
                      </h4>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                        {item.nbPannes}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {item.nbPannes > 1 ? "Pannes" : "Panne"}
                      </span>
                    </div>
                  </div>

                  {item.dernierePanne && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Dernier incident :{" "}
                        <strong className="text-foreground">
                          {new Date(item.dernierePanne).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </strong>
                      </span>
                    </div>
                  )}

                  {item.pannes && item.pannes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <button
                        type="button"
                        onClick={() => toggle(item.equipement)}
                        className="flex items-center justify-between w-full text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        <span>Détail des {item.pannes.length} pannes</span>
                        {isExp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      {isExp && (
                        <div className="mt-2.5 space-y-2">
                          {item.pannes.map((p) => (
                            <div
                              key={p.id}
                              className="p-2 rounded-lg bg-background/80 border border-border/60 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-foreground line-clamp-1">
                                  {p.nom || p.id}
                                </span>
                                <GraviteBadge gravite={p.gravite} />
                              </div>
                              <p className="text-[11px] text-muted-foreground line-clamp-2">
                                {p.description}
                              </p>
                              {p.dateOccurrence && (
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1 pt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {new Date(p.dateOccurrence).toLocaleString("fr-FR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

