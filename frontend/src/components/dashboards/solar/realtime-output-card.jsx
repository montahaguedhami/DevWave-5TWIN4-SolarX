import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { mockDashboardData } from "@/lib/mock-data";
function RealtimeOutputCard() {
  return <Card variant="glass" expandable className="col-span-12 sm:col-span-6 lg:col-span-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--primary)]" />
          <span>Real-Time Energy Output</span>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/80">
          Live generation metrics in Watts
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        <div className="p-3 rounded-2xl bg-card/50 border border-border">
          <div className="text-xs text-muted-foreground">Current output</div>
          <div className="text-3xl font-black text-foreground font-mono mt-1">
            {mockDashboardData.realTimeOutput.currentW.toLocaleString()} <span className="text-xs font-semibold text-[var(--primary)]">W</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-card/50 border border-border">
          <div className="text-xs text-muted-foreground">Peak output</div>
          <div className="text-3xl font-black text-[var(--primary)] font-mono mt-1">
            {mockDashboardData.realTimeOutput.peakW.toLocaleString()} <span className="text-xs font-semibold text-foreground">W</span>
          </div>
        </div>
      </CardContent>
    </Card>;
}
export {
  RealtimeOutputCard
};
