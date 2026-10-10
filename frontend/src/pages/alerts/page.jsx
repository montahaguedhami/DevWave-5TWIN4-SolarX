import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, AlertTriangle, AlertCircle, Info, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
const demoAlerts = [
  {
    id: "ALT-801",
    timestamp: "2026-09-24 14:10:00",
    component: "Solar Battery Storage",
    description: "Battery charging state transitioning to float mode (78% SoC). Thermal check normal.",
    severity: "Informational",
    status: "Active"
  },
  {
    id: "ALT-802",
    timestamp: "2026-09-24 12:30:15",
    component: "Smart Inverter String A",
    description: "Solar production exceeded expected baseline by 14% during peak sun hours (6.2 kW).",
    severity: "Informational",
    status: "Active"
  },
  {
    id: "ALT-803",
    timestamp: "2026-09-24 09:15:00",
    component: "Grid Tie Gateway",
    description: "Grid frequency fluctuation detected (49.8 Hz). Automatic voltage stabilization engaged.",
    severity: "Warning",
    status: "Active"
  },
  {
    id: "ALT-804",
    timestamp: "2026-09-23 18:45:22",
    component: "Sub-panel Breaker #3",
    description: "Brief overcurrent protection trigger during high-load HVAC startup. Reset executed automatically.",
    severity: "Warning",
    status: "Resolved"
  },
  {
    id: "ALT-805",
    timestamp: "2026-09-22 11:05:10",
    component: "AC Disconnect Switch",
    description: "Grid voltage drop below 190V threshold for 450ms. Safety isolation completed successfully.",
    severity: "Critical",
    status: "Resolved"
  }
];
function AlertsPage() {
  const [filterSeverity, setFilterSeverity] = useState("All");
  const filteredAlerts = demoAlerts.filter((item) => {
    if (filterSeverity === "All") return true;
    if (filterSeverity === "Resolved") return item.status === "Resolved";
    return item.severity === filterSeverity;
  });
  return <div className="space-y-6 pb-8">
      {
    /* Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-[var(--primary)] border border-border">
              <Bell className="w-5 h-5" />
            </div>
            System Alerts & Events
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time telemetry logging, fault monitoring, and status tracking.
          </p>
        </div>

        {
    /* Filter buttons */
  }
        <div className="flex items-center gap-1.5 bg-card/50 p-1 rounded-xl border border-border">
          {["All", "Critical", "Warning", "Informational", "Resolved"].map((tab) => <Button
    key={tab}
    variant="ghost"
    size="sm"
    className={`h-7 text-xs cursor-pointer ${filterSeverity === tab ? "bg-[var(--primary)] text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
    onClick={() => setFilterSeverity(tab)}
  >
              {tab}
            </Button>)}
        </div>
      </div>

      {
    /* Alerts List Card */
  }
      <Card variant="glass" expandable>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">System Events ({filteredAlerts.length})</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Filter applied: {filterSeverity}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Telemetry Stream: Online</span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
    const getIcon = () => {
      if (alert.severity === "Critical") return <AlertCircle className="w-4 h-4 text-rose-400" />;
      if (alert.severity === "Warning") return <AlertTriangle className="w-4 h-4 text-[var(--primary)]" />;
      return <Info className="w-4 h-4 text-primary" />;
    };
    return <div
      key={alert.id}
      className="p-4 rounded-2xl border border-border bg-card/50 hover:bg-card/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-card/50 shrink-0 mt-0.5">
                      {getIcon()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[var(--primary)]">{alert.id}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs font-semibold text-foreground">
                          {alert.component}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-snug">{alert.description}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{alert.timestamp}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30">
                      {alert.status === "Resolved" ? "Resolved" : alert.severity}
                    </span>
                  </div>
                </div>;
  })}
          </div>
        </CardContent>
      </Card>
    </div>;
}
export {
  AlertsPage as default
};
