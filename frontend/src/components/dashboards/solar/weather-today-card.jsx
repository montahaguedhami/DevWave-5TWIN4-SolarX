import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CloudRain, Wind, Droplets } from "lucide-react";
import { mockDashboardData } from "@/lib/mock-data";
function WeatherTodayCard() {
  const { weather } = mockDashboardData;
  return <Card variant="glass" expandable className="col-span-12 sm:col-span-6 lg:col-span-3 flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-[var(--primary)]" />
            <span>Weather Today</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-normal">Tunis, TN</span>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/80">
          Local meteorological conditions
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-black font-mono text-foreground tracking-tight">
              {weather.tempC}°C
            </div>
            <div className="text-xs font-semibold text-[var(--primary)] mt-1">
              {weather.condition}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-card/50 border border-border">
            <CloudRain className="w-8 h-8 text-[var(--primary)]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-primary" />
            <span>Humidity: {weather.humidity}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-primary" />
            <span>Wind: {weather.windKm} km/h</span>
          </div>
        </div>
      </CardContent>
    </Card>;
}
export {
  WeatherTodayCard
};
