import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, DollarSign, PiggyBank, ShieldAlert, Award, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
const cumulativeSavingsData = [
  { year: "Year 1", savings: 2312 },
  { year: "Year 2", savings: 4780 },
  { year: "Year 3", savings: 7420 },
  { year: "Year 4", savings: 10250 },
  { year: "Year 5", savings: 13280 },
  { year: "Year 10", savings: 29800 },
  { year: "Year 15", savings: 43500 },
  { year: "Year 20", savings: 57800 }
];
function SavingsPage() {
  return <div className="space-y-6 pb-8">
      {
    /* Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-[var(--primary)] border border-border">
              <TrendingUp className="w-5 h-5" />
            </div>
            Savings & ROI Projections
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Avoided grid costs, monthly returns, and 25-year financial trajectory.
          </p>
        </div>

        <Badge variant="outline" className="w-fit text-xs text-[var(--primary)] border-[var(--primary)]/30 bg-[var(--primary)]/10 py-1">
          <Award className="w-3.5 h-3.5 mr-1" />
          Payback: On Track (3.8 Yrs Left)
        </Badge>
      </div>

      {
    /* Financial KPI Cards */
  }
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Monthly Savings</span>
              <DollarSign className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div className="text-3xl font-black font-mono text-foreground mt-2">24.80 DT</div>
            <div className="text-xs text-[var(--primary)] mt-2 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% vs last month
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Annual Savings</span>
              <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div className="text-3xl font-black font-mono text-[var(--primary)] mt-2">2,312.00 DT</div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">Projected for 2026</div>
          </CardContent>
        </Card>

        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Estimated Lifetime Savings</span>
              <PiggyBank className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-black font-mono text-foreground mt-2">57,800.00 DT</div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">25-Year System Lifecycle</div>
          </CardContent>
        </Card>

        <Card variant="glass" expandable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Energy Cost Avoided</span>
              <ShieldAlert className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-black font-mono text-foreground mt-2">6,800 kWh</div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">100% Utility Tariff Avoidance</div>
          </CardContent>
        </Card>
      </div>

      {
    /* Cumulative Savings Chart */
  }
      <Card variant="glass" expandable>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">25-Year Cumulative Savings Trajectory</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Financial yield trajectory with vivid yellow projection curve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeSavingsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="savingsProjYellow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" />
                <XAxis dataKey="year" stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} unit=" DT" />
                <Tooltip
    contentStyle={{
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "var(--primary)",
      borderRadius: "8px",
      fontSize: "12px",
      color: "#FFF"
    }}
    formatter={(val) => [`${Number(val || 0).toLocaleString()} DT`, "Cumulative Savings"]}
  />
                <Area
    type="monotone"
    dataKey="savings"
    stroke="var(--primary)"
    strokeWidth={3}
    fillOpacity={1}
    fill="url(#savingsProjYellow)"
  />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>;
}
export {
  SavingsPage as default
};
