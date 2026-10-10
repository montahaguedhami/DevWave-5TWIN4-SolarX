import { Card } from "@/components/ui/card";
import { Sun, Zap, Sparkles, Activity } from "lucide-react";
function SolarHeroSection() {
  return <Card className="relative overflow-hidden p-6 lg:p-8 bg-gradient-to-r from-card/50 via-card/40 to-card/30 backdrop-blur-2xl border border-border rounded-3xl shadow-2xl">
      {
    /* Background radial glow */
  }
      <div className="absolute -right-16 -top-16 w-96 h-96 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-12 gap-6 items-center relative z-10">
        {
    /* Left Hero Overview */
  }
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SolarX Control Center</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
            High-Performance Photovoltaic Array
          </h2>

          <p className="text-sm text-muted-foreground/90 leading-relaxed max-w-lg">
            Real-time telemetry from your 6.4 kWp residential array. Currently routing 4.82 kW directly into household loads and storage.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/50 px-3.5 py-2 rounded-xl border border-border">
              <Sun className="w-4 h-4 text-[var(--primary)]" />
              <span>Solar Irradiance: <strong className="text-foreground font-mono">910 W/m²</strong></span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/50 px-3.5 py-2 rounded-xl border border-border">
              <Activity className="w-4 h-4 text-primary" />
              <span>Grid Frequency: <strong className="text-foreground font-mono">50.0 Hz</strong></span>
            </div>
          </div>
        </div>

        {
    /* Center-Right Tilted Solar Panel Hero Image & Floating Annotations */
  }
        <div className="col-span-12 lg:col-span-6 relative flex items-center justify-center min-h-[260px]">
          {
    /* Tilted Solar Panel Vector Graphic */
  }
          <div className="relative w-full max-w-md aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-border transform -rotate-3 hover:rotate-0 transition-transform duration-500 bg-gradient-to-tr from-card via-muted to-card p-3 flex flex-col justify-between">
            {
    /* Grid of solar cell panels */
  }
            <div className="grid grid-cols-4 gap-1.5 h-full w-full opacity-90">
              {Array.from({ length: 8 }).map((_, i) => <div
    key={i}
    className="rounded bg-gradient-to-br from-primary/10 via-muted to-muted border border-blue-400/20 relative group overflow-hidden"
  >
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[var(--primary)]/10 to-transparent" />
                </div>)}
            </div>

            {
    /* Gloss reflection overlay */
  }
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
          </div>

          {
    /* SVG Annotation Callout Lines (Yellow pointing lines) */
  }
          <svg className="absolute inset-0 w-full h-full pointer-events-none hidden sm:block z-20">
            {
    /* Line to top floating card */
  }
            <path d="M 220 70 L 140 40 L 90 40" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="4 2" fill="none" />
            <circle cx="220" cy="70" r="3" fill="var(--primary)" />

            {
    /* Line to bottom floating card */
  }
            <path d="M 320 180 L 380 210 L 410 210" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="4 2" fill="none" />
            <circle cx="320" cy="180" r="3" fill="var(--primary)" />
          </svg>

          {
    /* Floating Data Card 1 */
  }
          <div className="absolute top-2 left-0 sm:left-2 z-30 bg-card/80 backdrop-blur-md border border-[var(--primary)]/40 rounded-xl px-3 py-2 text-xs shadow-xl text-foreground flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[var(--primary)]" />
            <div>
              <div className="text-[10px] text-muted-foreground">Array Cell Yield</div>
              <div className="font-bold font-mono text-[var(--primary)]">98.2% Optimal</div>
            </div>
          </div>

          {
    /* Floating Data Card 2 */
  }
          <div className="absolute bottom-2 right-0 sm:right-2 z-30 bg-card/80 backdrop-blur-md border border-border rounded-xl px-3 py-2 text-xs shadow-xl text-foreground flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-primary" />
            <div>
              <div className="text-[10px] text-muted-foreground">Active Module Temp</div>
              <div className="font-bold font-mono text-primary">34°C Thermal Check</div>
            </div>
          </div>
        </div>
      </div>
    </Card>;
}
export {
  SolarHeroSection
};
