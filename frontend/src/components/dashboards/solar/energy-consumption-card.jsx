import { useState } from "react";
import { HOME_CONSUMPTION_DATA } from "@/data/dashboard";
import { MoreVertical, Lock, Unlock, Settings2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
function EnergyConsumptionCard() {
  const { distribution, rows, tariffSettings } = HOME_CONSUMPTION_DATA;
  const [standardTariff, setStandardTariff] = useState(tariffSettings?.standardTariff ?? 12.8);
  const [meterEnergyPrice, setMeterEnergyPrice] = useState(tariffSettings?.meterEnergyPrice ?? 1.56);
  const [isLocked, setIsLocked] = useState(false);
  return <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-6 shadow-xs hover:shadow-md transition-all h-full flex flex-col justify-between">
      <div>
        {
    /* Title and Action Menu */
  }
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-foreground dark:text-foreground font-bold text-xl tracking-tight">
            Home Energy Consumption
          </h3>
          <button
    type="button"
    className="p-1.5 rounded-lg text-muted-foreground hover:text-muted-foreground hover:bg-muted dark:hover:bg-muted transition-colors cursor-pointer"
  >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {
    /* Multi-segment Horizontal Progress Bar */
  }
        <div className="w-full h-3 bg-muted dark:bg-muted rounded-full overflow-hidden flex mb-6 p-0.5">
          {distribution.map((item, idx) => <div
    key={idx}
    style={{
      width: `${item.percentage}%`,
      backgroundColor: item.color
    }}
    className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
    title={`${item.label}: ${item.percentage}%`}
  />)}
        </div>

        {
    /* Metric Rows */
  }
        <div className="space-y-4 mb-6">
          {rows.map((row, idx) => <div
    key={idx}
    className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-border/80 last:border-0"
  >
              <div className="flex items-center gap-3">
                <span
    className="w-1.5 h-6 rounded-full inline-block"
    style={{ backgroundColor: row.color }}
  />
                <span className="text-sm font-semibold text-foreground dark:text-muted-foreground">
                  {row.label} – {row.percentage}%
                </span>
              </div>
              <span className="text-sm font-bold text-foreground dark:text-foreground tracking-tight">
                {row.value}
              </span>
            </div>)}
        </div>
      </div>

      {
    /* Tariff Settings Section */
  }
      <div className="pt-4 border-t border-slate-100 dark:border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-bold text-foreground dark:text-muted-foreground">
              Tariff Settings
            </h4>
          </div>
          <button
    type="button"
    onClick={() => setIsLocked(!isLocked)}
    className="text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground p-1 rounded transition-colors cursor-pointer"
    title={isLocked ? "Unlock settings" : "Lock settings"}
  >
            {isLocked ? <Lock className="w-4 h-4 text-primary" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>

        <div className="space-y-4">
          {
    /* Slider 1: Standard Tariff */
  }
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-muted-foreground dark:text-muted-foreground">Standard Tariff</span>
              <span className="text-foreground dark:text-foreground font-extrabold">{standardTariff.toFixed(1)} kWh</span>
            </div>
            <Slider
    value={[standardTariff]}
    min={5}
    max={30}
    step={0.1}
    disabled={isLocked}
    onValueChange={(val) => setStandardTariff(Array.isArray(val) ? val[0] : val)}
    className="py-1"
  />
          </div>

          {
    /* Slider 2: Meter Energy */
  }
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-muted-foreground dark:text-muted-foreground">Meter Energy</span>
              <span className="text-foreground dark:text-foreground font-extrabold">{meterEnergyPrice.toFixed(2)} DT</span>
            </div>
            <Slider
    value={[meterEnergyPrice]}
    min={0.5}
    max={5}
    step={0.05}
    disabled={isLocked}
    onValueChange={(val) => setMeterEnergyPrice(Array.isArray(val) ? val[0] : val)}
    className="py-1"
  />
          </div>
        </div>
      </div>
    </div>;
}
export {
  EnergyConsumptionCard
};
