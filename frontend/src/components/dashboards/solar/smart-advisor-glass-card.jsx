import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { mockDashboardData } from "@/lib/mock-data";
function SmartAdvisorGlassCard() {
  const { smartAdvisor } = mockDashboardData;
  return <Card variant="glass" expandable className="col-span-12 lg:col-span-6 border-[var(--primary)]/30">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">Smart Advisor</CardTitle>
            <p className="text-xs text-muted-foreground">AI Optimization Insight</p>
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30">
          High Confidence
        </span>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="p-4 rounded-2xl bg-card/50 border border-border text-sm leading-relaxed text-muted-foreground">
          <div className="flex gap-3 items-start">
            <Lightbulb className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />
            <p className="text-foreground text-xs sm:text-sm leading-relaxed">
              {smartAdvisor.recommendation}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-muted-foreground">
            Est. daily impact: <strong className="text-[var(--primary)] font-mono font-bold">+{smartAdvisor.potentialDailySavings}/day</strong>
          </div>

          <Button
    size="sm"
    variant="outline"
    className="h-8 text-xs gap-1.5 bg-card/50 hover:bg-[var(--primary)] text-foreground hover:text-primary-foreground border-border hover:border-[var(--primary)] font-bold cursor-pointer transition-colors"
    render={<Link to="/ai-advisor" />}
  >
            <span>View insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>;
}
export {
  SmartAdvisorGlassCard
};
