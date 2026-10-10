import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Globe, Leaf, Sun, Trees, Award } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
const co2Data = [
  { month: "Jan", co2: 0.34 },
  { month: "Feb", co2: 0.38 },
  { month: "Mar", co2: 0.45 },
  { month: "Apr", co2: 0.48 },
  { month: "May", co2: 0.53 },
  { month: "Jun", co2: 0.58 },
  { month: "Jul", co2: 0.59 },
  { month: "Aug", co2: 0.56 },
  { month: "Sep", co2: 0.51 }
];
function EnvironmentalImpactPage() {
  return <div className="space-y-6 pb-8">
      {
    /* Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-[var(--primary)] border border-border">
              <Globe className="w-5 h-5" />
            </div>
            Environmental Impact
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quantified carbon offset, equivalent ecological benefits, and clean energy output.
          </p>
        </div>

        <Badge variant="outline" className="w-fit text-xs text-[var(--primary)] border-[var(--primary)]/30 bg-[var(--primary)]/10 py-1">
          <Award className="w-3.5 h-3.5 mr-1" />
          Sustainability Rating: A+
        </Badge>
      </div>

      {
    /* Impact KPI Cards */
  }
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>CO₂ Emissions Avoided</span>
              <Leaf className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-black font-mono text-[var(--primary)] mt-2">4.42 <span className="text-sm font-normal text-muted-foreground">Tons</span></div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">
              18,200 km driven by standard ICE vehicle offset
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Equivalent Trees Planted</span>
              <Trees className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-black font-mono text-foreground mt-2">198 <span className="text-sm font-normal text-muted-foreground">Trees</span></div>
            <div className="text-xs text-muted-foreground mt-2">
              Based on 10-year tree carbon absorption model
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Renewable Energy Generated</span>
              <Sun className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div className="text-3xl font-black font-mono text-[var(--primary)] mt-2">6,800 <span className="text-sm font-normal text-muted-foreground">kWh</span></div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">
              100% Zero-Carbon Photovoltaic Yield
            </div>
          </CardContent>
        </Card>
      </div>

      {
    /* CO2 Monthly Chart */
  }
      <Card variant="glass" expandable>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">Monthly CO₂ Avoided (Metric Tons)</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Tracking your monthly ecological contribution with yellow bar metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={co2Data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} unit=" T" />
                <Tooltip
    contentStyle={{
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "var(--primary)",
      borderRadius: "12px",
      fontSize: "12px",
      color: "#FFF"
    }}
    formatter={(val) => [`${val} Tons CO\u2082`, "Offset"]}
  />
                <Bar dataKey="co2" name="CO₂ Offset" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>;
}
export {
  EnvironmentalImpactPage as default
};
