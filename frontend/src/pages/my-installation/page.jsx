import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, MapPin, Calendar, Sun, Cpu, Battery, Zap, Activity, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { mockDashboardData } from "@/lib/mock-data";
const productionSummaryData = [
  { day: "Mon", production: 28.4 },
  { day: "Tue", production: 31.2 },
  { day: "Wed", production: 29.8 },
  { day: "Thu", production: 33.5 },
  { day: "Fri", production: 30.1 },
  { day: "Sat", production: 34.8 },
  { day: "Sun", production: 32 }
];
function MyInstallationPage() {
  const specs = [
    { label: "Installation Name", value: mockDashboardData.user.installation, icon: Sun },
    { label: "Location", value: "Tunis, Tunisia (36.8065\xB0 N, 10.1815\xB0 E)", icon: MapPin },
    { label: "Installation Date", value: "March 15, 2025", icon: Calendar },
    { label: "System Capacity", value: "6.4 kWp", icon: Zap },
    { label: "Number of Panels", value: "16 \xD7 400W Monocrystalline", icon: Activity },
    { label: "Inverter Unit", value: "SmartSolar Hybrid Pro 6kW", icon: Cpu },
    { label: "Battery Unit", value: "SolarVolt LFP 10.2 kWh", icon: Battery },
    { label: "Warranty", value: "25-Year Guarantee", icon: ShieldCheck }
  ];
  return <div className="space-y-6 pb-8">
      {
    /* Header & Status Badge */
  }
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-[var(--primary)] border border-border">
              <ShieldCheck className="w-5 h-5" />
            </div>
            My Installation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hardware specifications, asset topology, and system status badge.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>System Healthy</span>
        </div>
      </div>

      {
    /* Solar Panel Graphic Hero Banner */
  }
      <Card variant="glass" expandable className="p-6 relative overflow-hidden border-[var(--primary)]/30">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <Badge className="bg-[var(--primary)] text-primary-foreground font-bold hover:bg-[var(--primary)]">
              Active Site Telemetry
            </Badge>
            <h2 className="text-2xl font-extrabold text-foreground">Villa Soleil Residence Array</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              16 High-Efficiency Monocrystalline modules with dual hybrid inverter bypass. Operating at 98.4% efficiency.
            </p>
          </div>

          {
    /* Tilted Solar Panel visual */
  }
          <div className="relative w-full max-w-xs aspect-[16/9] rounded-xl overflow-hidden shadow-xl border border-border transform rotate-2 bg-gradient-to-tr from-card via-muted to-card p-2">
            <div className="grid grid-cols-4 gap-1 h-full w-full">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="rounded bg-primary/10 border border-primary/30" />)}
            </div>
          </div>
        </div>
      </Card>

      {
    /* Grid Specs & Summary */
  }
      <div className="grid grid-cols-12 gap-6">
        <Card variant="glass" expandable className="col-span-12 lg:col-span-7">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-foreground">System Hardware Specs</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Complete hardware inventory and configuration
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {specs.map((s, idx) => {
    const Icon = s.icon;
    return <div key={idx} className="p-3 rounded-2xl border border-border bg-card/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Icon className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>{s.label}</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-foreground">{s.value}</div>
                  </div>;
  })}
            </div>
          </CardContent>
        </Card>

        {
    /* Weekly Production Summary Chart */
  }
        <Card variant="glass" expandable className="col-span-12 lg:col-span-5 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-foreground flex items-center justify-between">
              <span>Production Summary</span>
              <span className="text-xs font-mono bg-[var(--primary)]/15 text-[var(--primary)] px-2.5 py-1 rounded-md border border-[var(--primary)]/30 font-bold">
                219.6 kWh
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Daily cumulative output for past 7 days
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2 flex-1">
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productionSummaryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="installYieldYellow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} unit=" kWh" />
                  <Tooltip
    contentStyle={{
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "var(--primary)",
      borderRadius: "8px",
      fontSize: "12px",
      color: "#FFF"
    }}
    formatter={(val) => [`${val} kWh`, "Daily Yield"]}
  />
                  <Area
    type="monotone"
    dataKey="production"
    stroke="var(--primary)"
    strokeWidth={2.5}
    fillOpacity={1}
    fill="url(#installYieldYellow)"
  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
export {
  MyInstallationPage as default
};
