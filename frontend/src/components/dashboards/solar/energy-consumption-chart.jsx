import { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { PERIOD_CONSUMPTION_DATA } from "@/data/dashboard";
import { cn } from "@/lib/utils";
function EnergyConsumptionChart() {
  const [period, setPeriod] = useState("thisWeek");
  const periodData = PERIOD_CONSUMPTION_DATA[period];
  const periodLabels = {
    today: "Today",
    thisWeek: "This Week",
    thisMonth: "This Month",
    thisYear: "This Year"
  };
  return <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-6 shadow-xs hover:shadow-md transition-all h-full flex flex-col justify-between">
      {
    /* Header & Period Selectors */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-foreground dark:text-foreground font-bold text-xl tracking-tight">
            Energy Consumption Trend
          </h3>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground font-medium mt-0.5">
            Historical load analysis comparing current vs previous period
          </p>
        </div>

        {
    /* Period Switcher Tabs */
  }
        <div className="flex items-center p-1 bg-muted dark:bg-muted rounded-xl">
          {["today", "thisWeek", "thisMonth", "thisYear"].map((p) => <button
    key={p}
    type="button"
    onClick={() => setPeriod(p)}
    className={cn(
      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none",
      period === p ? "bg-card dark:bg-muted text-primary dark:text-primary shadow-xs" : "text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
    )}
  >
              {periodLabels[p]}
            </button>)}
        </div>
      </div>

      {
    /* Chart */
  }
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
    data={periodData}
    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
  >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />

            <XAxis
    dataKey="label"
    tickLine={false}
    axisLine={false}
    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
    dy={10}
  />

            <YAxis
    tickLine={false}
    axisLine={false}
    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
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

            <Line
    type="monotone"
    dataKey="current"
    name="Current Period"
    stroke="#3b82f6"
    strokeWidth={3}
    dot={{ r: 4, fill: "#3b82f6" }}
    activeDot={{ r: 7, stroke: "#3b82f6", strokeWidth: 2, fill: "#ffffff" }}
  />

            <Line
    type="monotone"
    dataKey="previous"
    name="Previous Period"
    stroke="#94a3b8"
    strokeWidth={2}
    strokeDasharray="5 5"
    dot={false}
  />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>;
}
export {
  EnergyConsumptionChart
};
