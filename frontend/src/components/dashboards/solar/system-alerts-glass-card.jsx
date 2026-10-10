import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, TrendingUp, ShieldCheck, Bell, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { mockDashboardData } from "@/lib/mock-data";
function SystemAlertsGlassCard() {
  const { alerts } = mockDashboardData;
  return <Card variant="glass" expandable className="col-span-12 lg:col-span-6">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-card/50 border border-border text-foreground">
            <Bell className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">System Status & Alerts</CardTitle>
            <p className="text-xs text-muted-foreground">Live operational telemetry</p>
          </div>
        </div>

        <Link
    to="/alerts"
    className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-0.5"
  >
          <span>All Alerts</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>

      <CardContent>
        <div className="space-y-2.5">
          {alerts.map((alert) => {
    const getIcon = () => {
      if (alert.type === "warning") return <TrendingUp className="w-4 h-4 text-[var(--primary)]" />;
      if (alert.type === "info") return <ShieldCheck className="w-4 h-4 text-primary" />;
      return <CheckCircle2 className="w-4 h-4 text-primary" />;
    };
    return <div
      key={alert.id}
      className="flex items-center justify-between p-3 rounded-2xl border border-border bg-card/50 hover:bg-card/50 transition-colors"
    >
                <div className="flex items-center gap-3">
                  {getIcon()}
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-foreground">{alert.title}</p>
                    <p className="text-[11px] text-muted-foreground">{alert.time}</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30">
                  {alert.status}
                </span>
              </div>;
  })}
        </div>
      </CardContent>
    </Card>;
}
export {
  SystemAlertsGlassCard
};
