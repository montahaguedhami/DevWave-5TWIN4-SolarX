import { ShieldAlert, AlertTriangle, Layers, Bell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardData } from "@/services/dashboard-api";

function getIncidentIcon(type) {
  switch (type) {
    case "Panne":
      return <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />;
    case "Alerte":
      return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
    case "Surcharge":
      return <Layers className="w-4 h-4 text-purple-500 shrink-0" />;
    default:
      return <Bell className="w-4 h-4 text-primary shrink-0" />;
  }
}

function getBadgeStyle(type) {
  switch (type) {
    case "Panne":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30";
    case "Alerte":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30";
    case "Surcharge":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
}

function AlertsCard() {
  const { incidents, incidentsStats } = useDashboardData();
  const listeIncidents = incidents.slice(0, 4);

  return (
    <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-6 shadow-xs hover:shadow-md transition-all h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Bell className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-foreground font-bold text-xl tracking-tight">
                Alertes & Incidents
              </h3>
              <span className="text-xs text-muted-foreground">
                {incidentsStats?.total ?? 13} événements télémétriques
              </span>
            </div>
          </div>

          <Link
            to="/incidents"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            Registre complet <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* List of Real Incidents */}
        <div className="space-y-2.5">
          {listeIncidents.map((incident) => (
            <div
              key={incident.id}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-card/60 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                {getIncidentIcon(incident.type)}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground truncate">
                      {incident.nom || incident.id}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted font-bold text-muted-foreground">
                      {incident.affecteNom || incident.affecte || "Réseau"}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground line-clamp-1">
                    {incident.description || "Événement opérationnel sur le composant"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${getBadgeStyle(incident.type)}`}>
                  {incident.type}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {incident.dateOccurrence
                    ? new Date(incident.dateOccurrence).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
                    : "Récent"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Pannes : <strong className="text-rose-500 font-bold">{incidentsStats?.parType?.Panne ?? 5}</strong> • Alertes : <strong className="text-amber-500 font-bold">{incidentsStats?.parType?.Alerte ?? 5}</strong>
        </span>
        <Link to="/incidents" className="text-primary font-semibold hover:underline">
          Consulter les détails &rarr;
        </Link>
      </div>
    </div>
  );
}

export { AlertsCard };
