import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, Sun, Zap, RefreshCw, Radio, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { Button } from "@/components/ui/button";
const monthlyAnalyticsData = [
  { month: "Jan", production: 520, consumption: 410, gridExport: 140 },
  { month: "Feb", production: 580, consumption: 420, gridExport: 180 },
  { month: "Mar", production: 690, consumption: 430, gridExport: 270 },
  { month: "Apr", production: 740, consumption: 410, gridExport: 350 },
  { month: "May", production: 820, consumption: 450, gridExport: 390 },
  { month: "Jun", production: 890, consumption: 490, gridExport: 430 },
  { month: "Jul", production: 910, consumption: 540, gridExport: 420 },
  { month: "Aug", production: 870, consumption: 530, gridExport: 390 },
  { month: "Sep", production: 780, consumption: 460, gridExport: 350 }
];
function EnergyAnalyticsPage() {
  const [metric, setMetric] = useState("all");
  return <div className="space-y-6 pb-8">
      {
    /* Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-[var(--primary)] border border-border">
              <BarChart3 className="w-5 h-5" />
            </div>
            Energy Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed telemetry for production, consumption, self-consumption ratio, and grid exports.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-card/50 p-1 rounded-xl border border-border">
          {["all", "production", "consumption", "export"].map((m) => <Button
    key={m}
    variant="ghost"
    size="sm"
    className={`h-7 text-xs capitalize cursor-pointer ${metric === m ? "bg-[var(--primary)] text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
    onClick={() => setMetric(m)}
  >
              {m}
            </Button>)}
        </div>
      </div>

      {
    /* Metric Cards */
  }
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Production</span>
              <Sun className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div className="text-3xl font-black font-mono text-foreground mt-2">6.80 MWh</div>
            <div className="text-xs text-[var(--primary)] mt-2 flex items-center gap-1 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% YTD
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Consumption</span>
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-black font-mono text-foreground mt-2">4.17 MWh</div>
            <div className="text-xs text-[var(--primary)] mt-2 flex items-center gap-1 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" /> -3.8% Efficiency Gain
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Self-Consumption</span>
              <RefreshCw className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div className="text-3xl font-black font-mono text-[var(--primary)] mt-2">3.88 MWh</div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">78.4% Direct Offset</div>
          </CardContent>
        </Card>

        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Grid Export</span>
              <Radio className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-black font-mono text-foreground mt-2">2.92 MWh</div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">Feed-in Credit Generated</div>
          </CardContent>
        </Card>
      </div>

      {
    /* Main Analytics Chart */
  }
      <Card variant="glass" expandable>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">Monthly Energy Dynamics</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Comparison across monthly production (yellow), consumption, and grid export (kWh)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyAnalyticsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} unit=" kWh" />
                <Tooltip
    contentStyle={{
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "var(--primary)",
      borderRadius: "12px",
      fontSize: "12px",
      color: "#FFF"
    }}
  />
                <Bar dataKey="production" name="Production" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="consumption" name="Consumption" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gridExport" name="Grid Export" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>;
}
export {
  EnergyAnalyticsPage as default
};
