import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sliders, Sparkles, CheckCircle2 } from "lucide-react";
import { mockDashboardData } from "@/lib/mock-data";
function PowerGenEfficiencyCard() {
  const { powerGenEfficiency } = mockDashboardData;
  return <Card variant="glass" expandable className="col-span-12 sm:col-span-6 lg:col-span-3 flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[var(--primary)]" />
          <span>Power Generating Efficiency</span>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/80">
          Array output ratio & optimization gain
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Current Yield Efficiency</span>
            <span className="text-xl font-black font-mono text-[var(--primary)]">
              {powerGenEfficiency.percentage}%
            </span>
          </div>

          {
    /* Horizontal Yellow Progress Bar */
  }
          <div className="w-full bg-card/50 h-3 rounded-full overflow-hidden border border-border p-0.5">
            <div
    className="bg-[var(--primary)] h-full rounded-full transition-all duration-700 shadow-sm"
    style={{ width: `${powerGenEfficiency.percentage}%` }}
  />
          </div>
        </div>

        {
    /* Recommendation list */
  }
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[var(--primary)]" />
            <span>Optimization Recommendations</span>
          </div>

          {powerGenEfficiency.recommendations.map((rec, idx) => <div
    key={idx}
    className="flex items-center justify-between p-2 rounded-xl bg-card/50 border border-border text-xs text-muted-foreground"
  >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                {rec.text}
              </span>
              <span className="font-mono font-bold text-[var(--primary)]">{rec.gain}</span>
            </div>)}
        </div>
      </CardContent>
    </Card>;
}
export {
  PowerGenEfficiencyCard
};
