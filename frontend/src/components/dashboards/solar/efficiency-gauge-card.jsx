import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity } from "lucide-react";
function EfficiencyGaugeCard() {
  const percentage = 90;
  const strokeDasharray = 220;
  const strokeDashoffset = strokeDasharray * (1 - percentage / 100);
  return <Card variant="glass" expandable className="col-span-12 sm:col-span-6 lg:col-span-3 flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-[var(--primary)]" />
          <span>Efficiency Trend</span>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/80">
          Photovoltaic conversion gauge
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2 pb-4 flex flex-col items-center justify-center">
        {
    /* Semicircle Gauge SVG */
  }
        <div className="relative w-44 h-24 flex items-end justify-center">
          <svg className="w-44 h-28 overflow-visible" viewBox="0 0 160 90">
            {
    /* Background Arc */
  }
            <path
    d="M 15 85 A 65 65 0 0 1 145 85"
    fill="none"
    stroke="rgba(255, 255, 255, 0.15)"
    strokeWidth="12"
    strokeLinecap="round"
  />
            {
    /* Vivid Yellow Arc */
  }
            <path
    d="M 15 85 A 65 65 0 0 1 145 85"
    fill="none"
    stroke="var(--primary)"
    strokeWidth="12"
    strokeLinecap="round"
    strokeDasharray={strokeDasharray}
    strokeDashoffset={strokeDashoffset}
    className="transition-all duration-1000 ease-out"
  />
          </svg>

          {
    /* Centered Percentage Overlay */
  }
          <div className="absolute bottom-1 flex flex-col items-center">
            <span className="text-3xl font-black font-mono text-foreground tracking-tight">{percentage}%</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Optimal</span>
          </div>
        </div>

        <div className="mt-2 text-xs text-muted-foreground text-center font-medium">
          +4.2% higher than seasonal baseline
        </div>
      </CardContent>
    </Card>;
}
export {
  EfficiencyGaugeCard
};
