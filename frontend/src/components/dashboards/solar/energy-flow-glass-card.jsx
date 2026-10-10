import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sun, Home, BatteryCharging, Radio, ArrowRight, Zap } from "lucide-react";
import { mockDashboardData } from "@/lib/mock-data";
function EnergyFlowGlassCard() {
  const { energyFlow } = mockDashboardData;
  const nodes = [
    {
      title: "Solar Panels",
      metric: `${energyFlow.solarPanelKw} kW`,
      status: "Generating",
      icon: Sun,
      iconColor: "text-[var(--primary)]"
    },
    {
      title: "Home",
      metric: `${energyFlow.homeKw} kW`,
      status: "Self-powered",
      icon: Home,
      iconColor: "text-[var(--primary)]"
    },
    {
      title: "Battery",
      metric: `${energyFlow.batterySoc}% (${energyFlow.batteryKw} kW)`,
      status: "Charging",
      icon: BatteryCharging,
      iconColor: "text-[var(--primary)]"
    },
    {
      title: "Grid",
      metric: `${energyFlow.gridExportKw} kW`,
      status: "Exporting",
      icon: Radio,
      iconColor: "text-[var(--primary)]"
    }
  ];
  return <Card variant="glass" expandable className="col-span-12 lg:col-span-4 flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-foreground flex items-center justify-between">
          <span>Energy Flow</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] bg-[var(--primary)]/15 px-3 py-1 rounded-full border border-[var(--primary)]/30">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
            Live Flow
          </span>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/80">
          Real-time energy routing across nodes
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-3 pb-5 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {nodes.map((node, index) => {
    const Icon = node.icon;
    const isLast = index === nodes.length - 1;
    return <div key={node.title} className="relative group">
                <div className="p-3.5 rounded-2xl border border-border bg-card/50 hover:bg-card/50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-card/50 border border-border">
                        <Icon className={`w-4 h-4 ${node.iconColor}`} />
                      </div>
                      <span className="text-xs font-bold text-foreground">{node.title}</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30">
                      {node.status}
                    </span>
                  </div>

                  <div className="text-base font-black text-foreground font-mono tracking-tight">
                    {node.metric}
                  </div>
                </div>

                {!isLast && index % 2 === 0 && <div className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-card border border-[var(--primary)] items-center justify-center text-[var(--primary)] shadow-md">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>}
              </div>;
  })}
        </div>

        {
    /* Independence Status */
  }
        <div className="mt-4 p-3 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="w-4 h-4 text-[var(--primary)]" />
            <span>Grid Independence Ratio:</span>
          </div>
          <span className="font-bold text-[var(--primary)] font-mono text-sm">100% Active</span>
        </div>
      </CardContent>
    </Card>;
}
export {
  EnergyFlowGlassCard
};
