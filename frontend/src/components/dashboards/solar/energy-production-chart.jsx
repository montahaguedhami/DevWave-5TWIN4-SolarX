import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { ENERGY_PRODUCTION_CHART_DATA } from "@/data/dashboard";
import { Sun, Zap } from "lucide-react";
function EnergyProductionChart() {
  return <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-6 shadow-xs hover:shadow-md transition-all h-full flex flex-col justify-between">
      {
    /* Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-foreground dark:text-foreground font-bold text-xl tracking-tight">
            Energy Production
          </h3>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground font-medium mt-0.5">
            Real-time Solar Generation vs Energy Consumption (kWh)
          </p>
        </div>

        {
    /* Legend Summary badges */
  }
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-primary dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            <Sun className="w-3.5 h-3.5" /> Solar: <strong>26.8 kWh</strong>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-muted/60 text-primary dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
            <Zap className="w-3.5 h-3.5" /> Consumption: <strong>19.7 kWh</strong>
          </span>
        </div>
      </div>

      {
    /* Chart */
  }
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
    data={ENERGY_PRODUCTION_CHART_DATA}
    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
  >
            <defs>
              <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="consumeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />

            <XAxis
    dataKey="time"
    tickLine={false}
    axisLine={false}
    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
    dy={10}
  />

            <YAxis
    tickLine={false}
    axisLine={false}
    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
    unit=" kWh"
  />

            <Tooltip
    contentStyle={{
      backgroundColor: "rgba(15, 23, 42, 0.9)",
      borderColor: "#334155",
      borderRadius: "12px",
      color: "#ffffff",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
    }}
    itemStyle={{ fontSize: "13px", fontWeight: "600" }}
    formatter={(value) => [`${value} kWh`]}
  />

            <Legend
    verticalAlign="top"
    align="right"
    wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }}
  />

            <Area
    type="monotone"
    dataKey="solar"
    name="Solar Production"
    stroke="#10b981"
    strokeWidth={3}
    fillOpacity={1}
    fill="url(#solarGrad)"
    activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2, fill: "#ffffff" }}
  />

            <Area
    type="monotone"
    dataKey="consumption"
    name="Energy Consumption"
    stroke="#3b82f6"
    strokeWidth={2.5}
    fillOpacity={1}
    fill="url(#consumeGrad)"
    strokeDasharray="4 4"
  />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>;
}
export {
  EnergyProductionChart
};
