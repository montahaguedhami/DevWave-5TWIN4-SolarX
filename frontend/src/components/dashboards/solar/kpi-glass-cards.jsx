import { Card, CardContent } from "@/components/ui/card";
import { Sun, Zap, BatteryCharging, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { mockDashboardData } from "@/lib/mock-data";
function KpiGlassCards() {
  const kpis = [
    {
      title: "Solar Production",
      value: mockDashboardData.kpis.solarProduction.value,
      period: mockDashboardData.kpis.solarProduction.period,
      change: mockDashboardData.kpis.solarProduction.change,
      isPositive: true,
      icon: Sun,
      iconColor: "text-[var(--primary)]"
    },
    {
      title: "Energy Consumption",
      value: mockDashboardData.kpis.energyConsumption.value,
      period: mockDashboardData.kpis.energyConsumption.period,
      change: mockDashboardData.kpis.energyConsumption.change,
      isPositive: true,
      icon: Zap,
      iconColor: "text-primary"
    },
    {
      title: "Battery",
      value: mockDashboardData.kpis.battery.value,
      period: mockDashboardData.kpis.battery.period,
      change: mockDashboardData.kpis.battery.change,
      isPositive: true,
      icon: BatteryCharging,
      iconColor: "text-[var(--primary)]",
      isBattery: true,
      batteryLevel: 78
    },
    {
      title: "Savings",
      value: mockDashboardData.kpis.savings.value,
      period: mockDashboardData.kpis.savings.period,
      change: mockDashboardData.kpis.savings.change,
      isPositive: true,
      icon: TrendingUp,
      iconColor: "text-[var(--primary)]"
    }
  ];
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => {
    const Icon = kpi.icon;
    return <Card key={idx} variant="glass" expandable className="hover:border-[var(--primary)]/40 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {kpi.title}
                </span>
                <div className="p-2 rounded-xl bg-card/50 border border-border">
                  <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
                </div>
              </div>

              {
      /* Huge Bold Value */
    }
              <div className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-foreground font-mono">
                {kpi.value}
              </div>

              {kpi.isBattery ? <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{kpi.period}</span>
                    <span className="font-semibold text-[var(--primary)]">{kpi.change}</span>
                  </div>
                  <div className="w-full bg-card/50 h-2 rounded-full overflow-hidden border border-border">
                    <div
      className="bg-[var(--primary)] h-full rounded-full transition-all duration-500 shadow-sm"
      style={{ width: `${kpi.batteryLevel}%` }}
    />
                  </div>
                </div> : <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{kpi.period}</span>
                  <span className="inline-flex items-center gap-0.5 font-bold px-2 py-0.5 rounded bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30">
                    {kpi.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {kpi.change}
                  </span>
                </div>}
            </CardContent>
          </Card>;
  })}
    </div>;
}
export {
  KpiGlassCards
};
