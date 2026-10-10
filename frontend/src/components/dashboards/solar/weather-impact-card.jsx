import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CloudSun } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { mockDashboardData } from "@/lib/mock-data";
function WeatherImpactCard() {
  const data = mockDashboardData.weatherImpact;
  return <Card variant="glass" expandable className="col-span-12 lg:col-span-6 flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CloudSun className="w-4 h-4 text-[var(--primary)]" />
            <span>Weather Impact</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">Actual vs Expected</span>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/80">
          Environmental parameters affecting daily photovoltaic yield
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" />
              <XAxis dataKey="metric" stroke="rgba(255,255,255,0.7)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.7)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
    contentStyle={{
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: "12px",
      fontSize: "12px",
      color: "#FFFFFF"
    }}
    formatter={(val, name, item) => [
      `${val} ${item.payload.unit} (Expected: ${item.payload.expected} ${item.payload.unit})`,
      "Actual Telemetry"
    ]}
  />
              <ReferenceLine y={20} stroke="var(--primary)" strokeDasharray="4 4" label={{ value: "Expected Baseline", fill: "var(--primary)", fontSize: 10, position: "top" }} />
              {
    /* Vivid Yellow Vertical Bars */
  }
              <Bar dataKey="actual" name="Actual Level" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>;
}
export {
  WeatherImpactCard
};
