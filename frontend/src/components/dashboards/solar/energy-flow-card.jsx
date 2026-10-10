import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sun, Home, BatteryCharging, ArrowRight, Zap, Radio } from "lucide-react";
function EnergyFlowCard() {
  const nodes = [
    {
      title: "Solar Panels",
      metric: "4.82 kW",
      status: "Generating",
      badgeColor: "bg-emerald-500/10 text-primary dark:text-primary border-primary/20",
      icon: Sun,
      iconColor: "text-primary",
      glowColor: "shadow-emerald-500/10"
    },
    {
      title: "Home",
      metric: "2.10 kW",
      status: "Self-powered",
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-primary border-primary/20",
      icon: Home,
      iconColor: "text-primary dark:text-primary",
      glowColor: "shadow-amber-500/10"
    },
    {
      title: "Battery",
      metric: "78% (1.20 kW)",
      status: "Charging",
      badgeColor: "bg-blue-500/10 text-primary dark:text-primary border-primary/20",
      icon: BatteryCharging,
      iconColor: "text-primary",
      glowColor: "shadow-blue-500/10"
    },
    {
      title: "Grid",
      metric: "1.52 kW",
      status: "Exporting",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      icon: Radio,
      iconColor: "text-purple-500",
      glowColor: "shadow-purple-500/10"
    }
  ];
  return <Card className="col-span-12 lg:col-span-4 shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center justify-between">
          <span>Energy Flow</span>
          <span className="flex items-center gap-1.5 text-xs font-normal text-primary dark:text-primary bg-emerald-500/10 px-2.5 py-1 rounded-full border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Flow
          </span>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Real-time energy routing across nodes
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-3 pb-5 flex-1 flex flex-col justify-center">
        {
    /* Flow Chain Visualization */
  }
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {nodes.map((node, index) => {
    const Icon = node.icon;
    const isLast = index === nodes.length - 1;
    return <div key={node.title} className="relative group">
                <div className="p-3.5 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all duration-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className={`w-4 h-4 ${node.iconColor}`} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{node.title}</span>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${node.badgeColor}`}>
                      {node.status}
                    </span>
                  </div>

                  <div className="text-lg font-bold text-foreground tracking-tight font-mono">
                    {node.metric}
                  </div>
                </div>

                {!isLast && index % 2 === 0 && <div className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-background border border-border items-center justify-center text-muted-foreground">
                    <ArrowRight className="w-3 h-3 text-primary dark:text-primary" />
                  </div>}
              </div>;
  })}
        </div>

        {
    /* Energy Balance Summary */
  }
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary dark:text-primary" />
            <span className="text-muted-foreground">Grid Independence:</span>
          </div>
          <span className="font-bold text-primary dark:text-primary font-mono text-sm">100% Active</span>
        </div>
      </CardContent>
    </Card>;
}
export {
  EnergyFlowCard
};
