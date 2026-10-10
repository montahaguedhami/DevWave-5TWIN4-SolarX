import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BatteryCharging } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
const batteryTelemetryData = [
  { time: "00:00", soc: 45 },
  { time: "03:00", soc: 40 },
  { time: "06:00", soc: 38 },
  { time: "09:00", soc: 52 },
  { time: "12:00", soc: 68 },
  { time: "15:00", soc: 78 },
  { time: "18:00", soc: 85 },
  { time: "21:00", soc: 72 }
];
function BatteryPage() {
  return <div className="space-y-6 pb-8">
      {
    /* Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-[var(--primary)] border border-border">
              <BatteryCharging className="w-5 h-5" />
            </div>
            Battery & Storage Systems
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lithium battery health metrics, charge/discharge telemetry, and backup autonomy.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] text-xs font-bold">
          <BatteryCharging className="w-4 h-4" />
          <span>Charging • +1.20 kW</span>
        </div>
      </div>

      {
    /* KPI Cards */
  }
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">State of Charge (SoC)</div>
            <div className="text-3xl font-black font-mono text-foreground mt-1">78%</div>
            <div className="w-full bg-card/50 h-2 rounded-full mt-3 overflow-hidden border border-border">
              <div className="bg-[var(--primary)] h-full rounded-full" style={{ width: "78%" }} />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">State of Health (SoH)</div>
            <div className="text-3xl font-black font-mono text-[var(--primary)] mt-1">98.4%</div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">Optimal LFP Cell Balance</div>
          </CardContent>
        </Card>

        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Est. Backup Autonomy</div>
            <div className="text-3xl font-black font-mono text-foreground mt-1">18.5 <span className="text-sm font-normal text-muted-foreground">hrs</span></div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">Essential Load Profile</div>
          </CardContent>
        </Card>

        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Lifetime Cycles</div>
            <div className="text-3xl font-black font-mono text-foreground mt-1">142 <span className="text-sm font-normal text-muted-foreground">/ 6000</span></div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">2.3% Warranty Used</div>
          </CardContent>
        </Card>
      </div>

      {
    /* Charge Curve Chart */
  }
      <Card variant="glass" expandable>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">24-Hour Battery SoC Telemetry (% Charge)</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Continuous charge/discharge profile over 24-hour solar cycle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={batteryTelemetryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="batterySoCYellow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                <Tooltip
    contentStyle={{
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "var(--primary)",
      borderRadius: "12px",
      fontSize: "12px",
      color: "#FFF"
    }}
    formatter={(val) => [`${val}%`, "State of Charge"]}
  />
                <Area type="monotone" dataKey="soc" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#batterySoCYellow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>;
}
export {
  BatteryPage as default
};
