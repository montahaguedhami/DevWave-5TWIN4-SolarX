import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sun, CheckCircle2, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
const productionDetailData = [
  { hour: "06:00", output: 0.4 },
  { hour: "08:00", output: 2.1 },
  { hour: "10:00", output: 4.5 },
  { hour: "12:00", output: 6.2 },
  { hour: "14:00", output: 5.8 },
  { hour: "16:00", output: 3.9 },
  { hour: "18:00", output: 1.5 },
  { hour: "20:00", output: 0.2 }
];
function SolarProductionPage() {
  return <div className="space-y-6 pb-8">
      {
    /* Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-[var(--primary)] border border-border">
              <Sun className="w-5 h-5" />
            </div>
            Solar Production
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time photovoltaic yield, array efficiency, and peak power output telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Generating • 4.82 kW Active</span>
        </div>
      </div>

      {
    /* KPI Row */
  }
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Today's Total Output</div>
            <div className="text-3xl font-black font-mono text-foreground mt-1">32.4 kWh</div>
            <div className="text-xs text-[var(--primary)] mt-2 flex items-center gap-1 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12.5% vs 7-day average
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Peak Power Reached</div>
            <div className="text-3xl font-black font-mono text-[var(--primary)] mt-1">6.2 kW</div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">Recorded at 12:45 PM</div>
          </CardContent>
        </Card>

        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Array Efficiency Rate</div>
            <div className="text-3xl font-black font-mono text-foreground mt-1">98.2%</div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">Optimal Panel Thermal Response</div>
          </CardContent>
        </Card>
      </div>

      {
    /* Hourly Output Chart */
  }
      <Card variant="glass" expandable>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">Today's Photovoltaic Generation Curve</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Hourly power yield curve in yellow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productionDetailData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pvCurveYellow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} unit=" kW" />
                <Tooltip
    contentStyle={{
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "var(--primary)",
      borderRadius: "12px",
      fontSize: "12px",
      color: "#FFF"
    }}
    formatter={(val) => [`${val} kW`, "Solar Generation"]}
  />
                <Area type="monotone" dataKey="output" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#pvCurveYellow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>;
}
export {
  SolarProductionPage as default
};
