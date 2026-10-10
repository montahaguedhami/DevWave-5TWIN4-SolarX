import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";
import { Sun, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockDashboardData } from "@/lib/mock-data";
function EnergyOverviewGlassChart() {
  const [range, setRange] = useState("24h");
  const data = mockDashboardData.energyOverview24h;
  return <Card variant="glass" expandable className="col-span-12 lg:col-span-8 shadow-xl">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-2">
        <div>
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Sun className="w-4 h-4 text-[var(--primary)]" />
            <span>Energy Overview</span>
            <span className="text-[10px] font-mono text-[var(--primary)] bg-[var(--primary)]/15 px-2 py-0.5 rounded-full border border-[var(--primary)]/30">
              Peak: 6.2 kW
            </span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground/80">
            24-hour yellow line comparison: Photovoltaic production vs household load
          </CardDescription>
        </div>

        <div className="flex items-center gap-1.5 bg-card/50 p-1 rounded-xl border border-border">
          {["24h", "7d", "30d"].map((r) => <Button
    key={r}
    variant="ghost"
    size="sm"
    className={`h-7 px-2.5 text-xs rounded-lg cursor-pointer ${range === r ? "bg-[var(--primary)] text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
    onClick={() => setRange(r)}
  >
              {r.toUpperCase()}
            </Button>)}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3 p-3 rounded-2xl bg-card/50 border border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--primary)] inline-block shadow-xs" />
              <span className="font-bold text-foreground">Solar Production</span>
              <span className="text-muted-foreground font-mono">(Peak 6.2 kW at 12:00)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
              <span className="font-bold text-foreground">Consumption</span>
              <span className="text-muted-foreground font-mono">(Avg 2.2 kW)</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--primary)] font-semibold">
            <Info className="w-3.5 h-3.5" />
            <span>Self-Consumption: 76.8%</span>
          </div>
        </div>

        <div className="h-[310px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {
    /* Vivid Yellow Gradient */
  }
                <linearGradient id="solarYellowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="consumptionSoftGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#CBD5E1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#CBD5E1" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} unit=" kW" />
              <Tooltip
    contentStyle={{
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "var(--primary)",
      borderRadius: "12px",
      fontSize: "12px",
      color: "#FFFFFF",
      boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
    }}
    formatter={(val, name) => [
      `${Number(val || 0).toFixed(2)} kW`,
      name === "solar" ? "Solar Production" : "Energy Consumption"
    ]}
  />

              {
    /* Peak Value Reference Dot */
  }
              <ReferenceDot
    x="12:00"
    y={6.2}
    r={6}
    fill="var(--primary)"
    stroke="#FFFFFF"
    strokeWidth={2}
    label={{ value: "Peak 6.2 kW", fill: "var(--primary)", fontSize: 11, position: "top" }}
  />

              <Area
    type="monotone"
    dataKey="solar"
    name="solar"
    stroke="var(--primary)"
    strokeWidth={3}
    fillOpacity={1}
    fill="url(#solarYellowGrad)"
  />
              <Area
    type="monotone"
    dataKey="consumption"
    name="consumption"
    stroke="#CBD5E1"
    strokeWidth={2}
    strokeDasharray="3 3"
    fillOpacity={1}
    fill="url(#consumptionSoftGrad)"
  />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>;
}
export {
  EnergyOverviewGlassChart
};
