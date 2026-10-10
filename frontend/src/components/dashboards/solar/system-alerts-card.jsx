import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, TrendingUp, ShieldCheck, Bell, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
function SystemAlertsCard() {
  const alerts = [
    {
      title: "Battery charging normally",
      time: "10 mins ago",
      icon: CheckCircle2,
      iconColor: "text-primary",
      badge: "Normal",
      badgeClass: "bg-emerald-500/10 text-primary dark:text-primary border-primary/20"
    },
    {
      title: "Solar production above expected level",
      time: "2 hours ago",
      icon: TrendingUp,
      iconColor: "text-primary",
      badge: "Optimal",
      badgeClass: "bg-amber-500/10 text-primary dark:text-primary border-primary/20"
    },
    {
      title: "No critical issues detected",
      time: "System Check 14:00",
      icon: ShieldCheck,
      iconColor: "text-primary",
      badge: "Healthy",
      badgeClass: "bg-blue-500/10 text-primary dark:text-primary border-primary/20"
    }
  ];
  return <Card className="col-span-12 lg:col-span-6 shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-primary dark:text-primary border border-primary/20">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">System Status & Alerts</CardTitle>
            <p className="text-xs text-muted-foreground">Recent telemetry & operational events</p>
          </div>
        </div>

        <Link
    to="/alerts"
    className="text-xs font-semibold text-primary dark:text-primary hover:underline flex items-center gap-0.5"
  >
          <span>All Alerts</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>

      <CardContent>
        <div className="space-y-2.5">
          {alerts.map((alert, idx) => {
    const Icon = alert.icon;
    return <div
      key={idx}
      className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
    >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${alert.iconColor}`} />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="text-[11px] text-muted-foreground">{alert.time}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${alert.badgeClass}`}>
                  {alert.badge}
                </span>
              </div>;
  })}
        </div>
      </CardContent>
    </Card>;
}
export {
  SystemAlertsCard
};
