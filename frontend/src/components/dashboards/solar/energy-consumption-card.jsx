import { useState } from "react";
import { Lock, Unlock, Settings2, Users, Building, Factory } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useDashboardData } from "@/services/dashboard-api";

function EnergyConsumptionCard() {
  const { consommateurs, mesuresConsommation } = useDashboardData();

  const [standardTariff, setStandardTariff] = useState(0.24); // DT / kWh
  const [isLocked, setIsLocked] = useState(false);

  const consoMaison = mesuresConsommation?.[0]?.valeur ?? 9.0;

  const consommateurList = [
    {
      id: "Maison_Djerba",
      nom: "Maison Résidentielle (Djerba)",
      type: "Résidentiel",
      valeur: `${consoMaison} kWh`,
      pct: 25,
      color: "#10b981", // vert
      icon: Users,
    },
    {
      id: "Hopital_Tunis",
      nom: "Centre Hospitalier (Tunis)",
      type: "Tertiaire / Santé",
      valeur: "18.5 kWh",
      pct: 45,
      color: "#3b82f6", // bleu
      icon: Building,
    },
    {
      id: "Usine_Tunis",
      nom: "Complexe Industriel (Tunis)",
      type: "Industriel",
      valeur: "12.2 kWh",
      pct: 30,
      color: "#8b5cf6", // violet
      icon: Factory,
    },
  ];

  return (
    <div className="bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border p-6 shadow-xs hover:shadow-md transition-all h-full flex flex-col justify-between">
      <div>
        {/* Title and Action Menu */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-foreground font-bold text-xl tracking-tight">
              Répartition Consommation
            </h3>
            <span className="text-xs text-muted-foreground">Profils consommateurs du réseau</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            3 nœuds actifs
          </span>
        </div>

        {/* Multi-segment Horizontal Progress Bar */}
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex mb-6 p-0.5">
          {consommateurList.map((item) => (
            <div
              key={item.id}
              style={{
                width: `${item.pct}%`,
                backgroundColor: item.color,
              }}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
              title={`${item.nom}: ${item.pct}%`}
            />
          ))}
        </div>

        {/* Metric Rows */}
        <div className="space-y-3 mb-6">
          {consommateurList.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/30"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2 h-7 rounded-full inline-block"
                    style={{ backgroundColor: row.color }}
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {row.nom}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {row.type} • {row.pct}% de la charge
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono text-foreground">
                  {row.valeur}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tariff Settings Section */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-xs font-bold text-foreground">
              Tarification STEG d'injection / tirage
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setIsLocked(!isLocked)}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors cursor-pointer"
            title={isLocked ? "Déverrouiller" : "Verrouiller"}
          >
            {isLocked ? <Lock className="w-4 h-4 text-primary" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Tarif Moyen Réseau :</span>
            <span className="text-foreground font-extrabold">{standardTariff.toFixed(2)} DT / kWh</span>
          </div>
          <Slider
            value={[standardTariff]}
            min={0.10}
            max={0.50}
            step={0.01}
            disabled={isLocked}
            onValueChange={([val]) => setStandardTariff(val)}
            className="cursor-pointer py-1"
          />
        </div>
      </div>
    </div>
  );
}

export { EnergyConsumptionCard };
