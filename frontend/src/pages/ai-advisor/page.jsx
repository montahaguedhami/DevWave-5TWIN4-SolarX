import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Lightbulb, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
function AiAdvisorPage() {
  const recommendations = [
    {
      id: "REC-101",
      type: "Self-Consumption Optimization",
      title: "Peak Solar Production Window",
      description: "Your production is expected to peak between 11:00 and 14:00. Running high-consumption appliances (heat pump, EV charger, washing machine) during this period could increase self-consumption by 18.2%.",
      impact: "+3.40 DT / day savings",
      severity: "High Impact"
    },
    {
      id: "REC-102",
      type: "Battery Scheduling",
      title: "Pre-Charge Battery Before Evening Peak",
      description: "Grid tariffs increase between 19:00 and 22:00. Ensure your battery reaches \u226585% charge by 17:30 to avoid draw during high-tier utility rates.",
      impact: "+48.00 DT / month savings",
      severity: "Medium Impact"
    }
  ];
  const anomalies = [
    {
      id: "ANO-201",
      title: "Minor Inverter Efficiency Dip at 13:45",
      description: "Temperature sensor on Inverter String B reported 58\xB0C under direct exposure. Passive cooling active. Output stabilized normally.",
      status: "Resolved Automatically"
    }
  ];
  return <div className="space-y-6 pb-8">
      {
    /* Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-[var(--primary)] border border-border">
              <Sparkles className="w-5 h-5" />
            </div>
            SolarX AI Advisor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Autonomous energy optimization, anomaly detection, and predictive savings engine.
          </p>
        </div>

        <Badge variant="outline" className="w-fit gap-1.5 py-1 text-xs text-[var(--primary)] border-[var(--primary)]/30 bg-[var(--primary)]/10">
          <Cpu className="w-3.5 h-3.5" />
          <span>Model v4.2 Active • Live Telemetry</span>
        </Badge>
      </div>

      {
    /* System Summary Banner */
  }
      <Card variant="glass" expandable className="border-[var(--primary)]/30">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[var(--primary)] text-primary-foreground shrink-0 font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Current System Health & Optimization Index</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  System operating at <strong className="text-[var(--primary)]">94.8% potential efficiency</strong>. 2 active optimization opportunities detected today.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Expected Optimization Savings</div>
                <div className="text-lg font-black font-mono text-[var(--primary)]">+148.50 DT / mo</div>
              </div>
              <Button size="sm" className="bg-[var(--primary)] hover:bg-[var(--primary)] text-primary-foreground font-bold text-xs">
                Apply All Optimizations
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {
    /* Recommendations & Optimization Section */
  }
      <div className="grid grid-cols-12 gap-6">
        <Card variant="glass" expandable className="col-span-12 lg:col-span-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[var(--primary)]" />
              <span>Active Recommendations & Optimization Suggestions</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Prioritized by financial return and battery longevity impact
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {recommendations.map((rec) => <div
    key={rec.id}
    className="p-4 rounded-2xl border border-border bg-card/50 hover:bg-card/50 transition-all space-y-3"
  >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {rec.type}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30">
                    {rec.severity}
                  </span>
                </div>

                <h4 className="text-base font-bold text-foreground">{rec.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {rec.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs font-bold text-[var(--primary)]">
                    Impact: {rec.impact}
                  </span>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 bg-card/50 text-foreground hover:bg-[var(--primary)] hover:text-primary-foreground border-border font-bold">
                    <span>Execute Schedule</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>)}
          </CardContent>
        </Card>

        {
    /* Anomalies & Diagnostics Sidebar */
  }
        <Card variant="glass" expandable className="col-span-12 lg:col-span-4 flex flex-col justify-between">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <span>Detected Anomalies</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              AI sensor cross-validation and diagnostics log
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 flex-1">
            {anomalies.map((ano) => <div key={ano.id} className="p-3.5 rounded-2xl border border-border bg-card/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{ano.title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{ano.description}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--primary)] font-bold pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>{ano.status}</span>
                </div>
              </div>)}

            <div className="p-3.5 rounded-2xl border border-border bg-card/50 text-xs space-y-2">
              <div className="font-bold text-foreground">AI Predictive Battery Health</div>
              <div className="text-muted-foreground">Estimated battery life span: 14.2 years remaining (98% State of Health).</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
export {
  AiAdvisorPage as default
};
