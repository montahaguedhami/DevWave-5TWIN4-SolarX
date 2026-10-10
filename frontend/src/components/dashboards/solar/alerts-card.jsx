import { SYSTEM_ALERTS_DATA } from "@/data/dashboard";
import { CheckCircle2, AlertTriangle, Info, Bell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
function AlertsCard() {
  return <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-6 shadow-xs hover:shadow-md transition-all h-full flex flex-col justify-between">
      <div>
        {
    /* Header */
  }
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-muted/60 text-primary dark:text-primary flex items-center justify-center">
              <Bell className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-foreground dark:text-foreground font-bold text-xl tracking-tight">
              System Alerts
            </h3>
          </div>

          <Link
    to="/alerts"
    className="text-xs font-bold text-primary dark:text-primary hover:underline flex items-center gap-1"
  >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {
    /* List of Alerts */
  }
        <div className="space-y-3">
          {SYSTEM_ALERTS_DATA.map((alert) => {
    const isSuccess = alert.type === "success";
    const isWarning = alert.type === "warning";
    return <div
      key={alert.id}
      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${isSuccess ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40 text-foreground dark:text-foreground" : isWarning ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40 text-foreground dark:text-foreground" : "bg-muted dark:bg-muted/50 border-border/60 dark:border-border/60"}`}
    >
                <div className="flex items-center gap-3">
                  {isSuccess ? <CheckCircle2 className="w-5 h-5 text-primary dark:text-primary shrink-0" /> : isWarning ? <AlertTriangle className="w-5 h-5 text-primary shrink-0" /> : <Info className="w-5 h-5 text-primary shrink-0" />}

                  <div>
                    <span className="text-sm font-bold block leading-snug">
                      {alert.message}
                    </span>
                    <span className="text-[11px] text-muted-foreground dark:text-muted-foreground font-medium">
                      {alert.timestamp}
                    </span>
                  </div>
                </div>

                <span
      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${isSuccess ? "bg-emerald-100 dark:bg-emerald-950 text-primary dark:text-emerald-300" : isWarning ? "bg-amber-100 dark:bg-amber-950 text-primary dark:text-primary" : "bg-muted dark:bg-muted text-foreground dark:text-muted-foreground"}`}
    >
                  {alert.status}
                </span>
              </div>;
  })}
        </div>
      </div>
    </div>;
}
export {
  AlertsCard
};
