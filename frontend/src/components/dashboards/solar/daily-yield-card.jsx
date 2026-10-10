import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { DAILY_YIELD_DATA } from "@/data/dashboard";
import { Sun, ArrowUpRight, Home } from "lucide-react";
function DailyYieldCard() {
  const { totalYield, exportedEnergy, selfUseEnergy, hourlyBreakdown } = DAILY_YIELD_DATA;
  return <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-6 shadow-xs hover:shadow-md transition-all h-full flex flex-col justify-between">
      {
    /* Top Header & 3 Main Metrics */
  }
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-foreground dark:text-foreground font-bold text-xl tracking-tight">
            Yield Daily
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground">
            24-Hour Breakdown
          </span>
        </div>

        {
    /* 3 Metric Cards */
  }
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-primary mb-1">
              <Sun className="w-3.5 h-3.5" /> Yield Energy
            </div>
            <span className="text-2xl font-extrabold text-foreground dark:text-foreground">
              {totalYield} <span className="text-xs font-semibold text-muted-foreground">kWh</span>
            </span>
          </div>

          <div className="bg-blue-50/70 dark:bg-muted/40 p-3.5 rounded-xl border border-blue-200/60 dark:border-blue-800/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-primary mb-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Exported Energy
            </div>
            <span className="text-2xl font-extrabold text-foreground dark:text-foreground">
              {exportedEnergy} <span className="text-xs font-semibold text-muted-foreground">kWh</span>
            </span>
          </div>

          <div className="bg-amber-50/70 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-800/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-primary mb-1">
              <Home className="w-3.5 h-3.5" /> Self-use Energy
            </div>
            <span className="text-2xl font-extrabold text-foreground dark:text-foreground">
              {selfUseEnergy} <span className="text-xs font-semibold text-muted-foreground">kWh</span>
            </span>
          </div>
        </div>
      </div>

      {
    /* Hourly Bar Chart */
  }
      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
    data={hourlyBreakdown}
    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
    barGap={4}
  >
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
  />

            <Legend
    verticalAlign="top"
    align="right"
    wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }}
  />

            <Bar
    dataKey="solarProduction"
    name="Solar Production"
    fill="#10b981"
    radius={[4, 4, 0, 0]}
  />
            <Bar
    dataKey="exportedEnergy"
    name="Exported Energy"
    fill="#3b82f6"
    radius={[4, 4, 0, 0]}
  />
            <Bar
    dataKey="selfConsumption"
    name="Self Consumption"
    fill="#f59e0b"
    radius={[4, 4, 0, 0]}
  />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>;
}
export {
  DailyYieldCard
};
