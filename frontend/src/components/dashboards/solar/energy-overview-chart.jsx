import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
const hourlyDemoData = [
  { time: "00:00", solar: 0, consumption: 0.8 },
  { time: "02:00", solar: 0, consumption: 0.6 },
  { time: "04:00", solar: 0, consumption: 0.5 },
  { time: "06:00", solar: 0.4, consumption: 1.2 },
  { time: "08:00", solar: 2.1, consumption: 2.5 },
  { time: "10:00", solar: 4.5, consumption: 2.1 },
  { time: "12:00", solar: 6.2, consumption: 2.8 },
  { time: "14:00", solar: 5.8, consumption: 2.3 },
  { time: "16:00", solar: 3.9, consumption: 2.6 },
  { time: "18:00", solar: 1.5, consumption: 3.8 },
  { time: "20:00", solar: 0.2, consumption: 3.2 },
  { time: "22:00", solar: 0, consumption: 1.5 }
];
function EnergyOverviewChart() {
  const [range, setRange] = useState("24h");
  return <Card className="col-span-12 lg:col-span-8 shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-2">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <span>Energy Overview</span>
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              Real-time Telemetry
            </span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            24-hour comparative solar generation vs home load consumption
          </CardDescription>
        </div>

        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg">
          {["24h", "7d", "30d"].map((r) => <Button
    key={r}
    variant={range === r ? "default" : "ghost"}
    size="sm"
    className="h-7 px-2.5 text-xs rounded-md"
    onClick={() => setRange(r)}
  >
              {r.toUpperCase()}
            </Button>)}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-3 rounded-lg bg-muted/40 border border-border/50 text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="font-semibold text-foreground">Solar Production</span>
              <span className="text-muted-foreground font-mono">(Peak 6.2 kW)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="font-semibold text-foreground">Energy Consumption</span>
              <span className="text-muted-foreground font-mono">(Avg 2.2 kW)</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-primary dark:text-primary font-medium">
            <Info className="w-3.5 h-3.5" />
            <span>Self-consumption Ratio: 76.8%</span>
          </div>
        </div>

        <div className="h-[310px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyDemoData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="consumptionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} unit=" kW" />
              <Tooltip
    contentStyle={{
      backgroundColor: "var(--card)",
      borderColor: "var(--border)",
      borderRadius: "8px",
      fontSize: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    }}
    formatter={(value) => [`${Number(value || 0).toFixed(2)} kW`]}
  />
              <Area
    type="monotone"
    dataKey="solar"
    name="Solar Production"
    stroke="#10B981"
    strokeWidth={2.5}
    fillOpacity={1}
    fill="url(#solarGradient)"
  />
              <Area
    type="monotone"
    dataKey="consumption"
    name="Energy Consumption"
    stroke="#F59E0B"
    strokeWidth={2}
    fillOpacity={1}
    fill="url(#consumptionGradient)"
  />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>;
}
export {
  EnergyOverviewChart
};
