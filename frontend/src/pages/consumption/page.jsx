import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, ArrowDownRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
const categoryConsumptionData = [
  { category: "HVAC Climate", consumption: 8.5 },
  { category: "EV Charger", consumption: 6.2 },
  { category: "Home Appliances", consumption: 4.8 },
  { category: "Water Heater", consumption: 3.4 },
  { category: "Lighting & Tech", consumption: 1.8 }
];
function ConsumptionPage() {
  return <div className="space-y-6 pb-8">
      {
    /* Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-primary border border-border">
              <Zap className="w-5 h-5" />
            </div>
            Energy Consumption
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time household load monitoring, appliance breakdown, and demand profiling.
          </p>
        </div>
      </div>

      {
    /* KPI Row */
  }
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Today's Consumption</div>
            <div className="text-3xl font-black font-mono text-foreground mt-1">24.7 kWh</div>
            <div className="text-xs text-[var(--primary)] mt-2 flex items-center gap-1 font-bold">
              <ArrowDownRight className="w-3.5 h-3.5" /> -5.2% vs baseline
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Solar-Powered Ratio</div>
            <div className="text-3xl font-black font-mono text-[var(--primary)] mt-1">86.4%</div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">Direct Clean Solar Offset</div>
          </CardContent>
        </Card>

        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Grid Energy Drawn</div>
            <div className="text-3xl font-black font-mono text-foreground mt-1">3.35 kWh</div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">Minimal Off-Peak Import</div>
          </CardContent>
        </Card>
      </div>

      {
    /* Consumption Breakdown Chart */
  }
      <Card variant="glass" expandable>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">Appliance & Load Breakdown (kWh)</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Distribution of daily household energy consumption by circuit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryConsumptionData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" />
                <XAxis dataKey="category" stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} unit=" kWh" />
                <Tooltip
    contentStyle={{
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "var(--primary)",
      borderRadius: "12px",
      fontSize: "12px",
      color: "#FFF"
    }}
    formatter={(val) => [`${val} kWh`, "Consumption"]}
  />
                <Bar dataKey="consumption" name="Consumption" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>;
}
export {
  ConsumptionPage as default
};
