import { Badge } from "@/components/ui/badge";
import { Sun, CheckCircle2 } from "lucide-react";
function SolarHeader() {
  return <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Good evening, Montaha
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here’s an overview of your solar energy system.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-primary/20 text-primary dark:text-primary text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>System Healthy • 4.82 kW Generating</span>
        </div>

        <Badge variant="outline" className="hidden sm:inline-flex gap-1.5 text-xs py-1">
          <Sun className="w-3.5 h-3.5 text-primary fill-amber-500" />
          <span>Peak Production Active</span>
        </Badge>
      </div>
    </div>;
}
export {
  SolarHeader
};
