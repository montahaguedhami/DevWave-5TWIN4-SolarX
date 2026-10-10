import { Button } from "@/components/ui/button";
import { Wrench, Power } from "lucide-react";
import { mockDashboardData } from "@/lib/mock-data";
function SolarDashboardHeader() {
  return <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Good evening, {mockDashboardData.user.name}
        </h1>
        <p className="text-sm text-muted-foreground/80 mt-1">
          Here’s an overview of your solar energy system.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {
    /* Yellow primary button */
  }
        <Button
    className="bg-[var(--primary)] hover:bg-[var(--primary)] text-primary-foreground font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-amber-400/10 cursor-pointer transition-transform active:scale-95"
  >
          <Wrench className="w-4 h-4 mr-2 stroke-[2.5]" />
          Schedule Maintenance
        </Button>

        {
    /* Grey secondary button */
  }
        <Button
    variant="outline"
    className="bg-card/50 hover:bg-card/200 text-foreground border-border text-xs sm:text-sm px-4 py-2.5 rounded-xl cursor-pointer transition-transform active:scale-95"
  >
          <Power className="w-4 h-4 mr-2 text-rose-400" />
          Deactivate System
        </Button>
      </div>
    </div>;
}
export {
  SolarDashboardHeader
};
