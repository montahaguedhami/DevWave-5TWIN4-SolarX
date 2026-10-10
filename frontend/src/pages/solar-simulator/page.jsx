import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Sun, Zap, DollarSign, Clock, Leaf, ShieldCheck, Sparkles, Sliders } from "lucide-react";
import { Badge } from "@/components/ui/badge";
function SolarSimulatorPage() {
  const [monthlyConsumption, setMonthlyConsumption] = useState(350);
  const [location, setLocation] = useState("Tunis");
  const [roofArea, setRoofArea] = useState(45);
  const [panelPower, setPanelPower] = useState(450);
  const [electricityPrice, setElectricityPrice] = useState(0.34);
  const [batteryPreference, setBatteryPreference] = useState("Hybrid");
  const [budget, setBudget] = useState(14e3);
  const annualConsumptionKwh = monthlyConsumption * 12;
  const solarIrradianceFactor = location === "Sfax" || location === "Tozeur" ? 1650 : 1550;
  const recommendedCapacityKwp = Math.min(
    Math.round(annualConsumptionKwh / solarIrradianceFactor * 10) / 10,
    Math.floor(roofArea * 0.18 * 10) / 10
  ) || 4.5;
  const totalPanelsNeeded = Math.ceil(recommendedCapacityKwp * 1e3 / panelPower);
  const estimatedAnnualProduction = Math.round(recommendedCapacityKwp * solarIrradianceFactor);
  const estimatedAnnualSavings = Math.round(estimatedAnnualProduction * electricityPrice);
  const estimatedSystemCost = Math.round(recommendedCapacityKwp * 2200 + (batteryPreference !== "No" ? 4500 : 0));
  const paybackPeriodYears = (estimatedSystemCost / (estimatedAnnualSavings || 1)).toFixed(1);
  const co2ReductionTons = (estimatedAnnualProduction * 65e-5).toFixed(2);
  return <div className="space-y-6 pb-8">
      {
    /* Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-card/50 text-[var(--primary)] border border-border">
              <Calculator className="w-5 h-5" />
            </div>
            Solar Simulator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Simulate your solar installation capacity, estimated ROI, and annual savings.
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 py-1 text-xs text-[var(--primary)] border-[var(--primary)]/30 bg-[var(--primary)]/10">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive SaaS Calculator</span>
        </Badge>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {
    /* Input Panel (Left) */
  }
        <Card variant="glass" expandable className="col-span-12 lg:col-span-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--primary)]" />
              <span>Input Parameters</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Adjust energy consumption and roof specifications
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="consumption" className="text-xs font-semibold text-muted-foreground">
                  Monthly Consumption (kWh)
                </Label>
                <Input
    id="consumption"
    type="number"
    value={monthlyConsumption}
    onChange={(e) => setMonthlyConsumption(Number(e.target.value) || 0)}
    className="font-mono text-sm bg-card/50 border-border text-foreground"
  />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-semibold text-muted-foreground">
                  Location / Region
                </Label>
                <Select value={location} onValueChange={(val) => val && setLocation(val)}>
                  <SelectTrigger id="location" className="text-sm bg-card/50 border-border text-foreground">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border text-foreground">
                    <SelectItem value="Tunis">Tunis (Northern TN)</SelectItem>
                    <SelectItem value="Sousse">Sousse (Central Coast)</SelectItem>
                    <SelectItem value="Sfax">Sfax (Southern Coast)</SelectItem>
                    <SelectItem value="Monastir">Monastir</SelectItem>
                    <SelectItem value="Nabeul">Nabeul / Cap Bon</SelectItem>
                    <SelectItem value="Tozeur">Tozeur (High Solar Irradiance)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="roof" className="text-xs font-semibold text-muted-foreground">
                  Available Roof Area (m²)
                </Label>
                <Input
    id="roof"
    type="number"
    value={roofArea}
    onChange={(e) => setRoofArea(Number(e.target.value) || 0)}
    className="font-mono text-sm bg-card/50 border-border text-foreground"
  />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="panel" className="text-xs font-semibold text-muted-foreground">
                  Panel Rating (Watts Wp)
                </Label>
                <Select value={String(panelPower)} onValueChange={(val) => val && setPanelPower(Number(val))}>
                  <SelectTrigger id="panel" className="text-sm bg-card/50 border-border text-foreground">
                    <SelectValue placeholder="Select panel" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border text-foreground">
                    <SelectItem value="400">400W Monocrystalline</SelectItem>
                    <SelectItem value="450">450W High Efficiency</SelectItem>
                    <SelectItem value="550">550W Ultra Bifacial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tariff" className="text-xs font-semibold text-muted-foreground">
                  Electricity Rate (DT / kWh)
                </Label>
                <Input
    id="tariff"
    type="number"
    step="0.01"
    value={electricityPrice}
    onChange={(e) => setElectricityPrice(Number(e.target.value) || 0)}
    className="font-mono text-sm bg-card/50 border-border text-foreground"
  />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="battery" className="text-xs font-semibold text-muted-foreground">
                  Storage Preference
                </Label>
                <Select value={batteryPreference} onValueChange={(val) => val && setBatteryPreference(val)}>
                  <SelectTrigger id="battery" className="text-sm bg-card/50 border-border text-foreground">
                    <SelectValue placeholder="Battery config" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border text-foreground">
                    <SelectItem value="Hybrid">Hybrid Storage (Recommended)</SelectItem>
                    <SelectItem value="Yes">Full Off-Grid Battery</SelectItem>
                    <SelectItem value="No">Grid-Tied (No Battery)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="budget" className="text-xs font-semibold text-muted-foreground">
                Target Budget (DT)
              </Label>
              <Input
    id="budget"
    type="number"
    value={budget}
    onChange={(e) => setBudget(Number(e.target.value) || 0)}
    className="font-mono text-sm bg-card/50 border-border text-foreground"
  />
            </div>
          </CardContent>
        </Card>

        {
    /* Results Panel (Right - Big Yellow Numbers) */
  }
        <Card variant="glass" expandable className="col-span-12 lg:col-span-6 border-[var(--primary)]/30">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sun className="w-5 h-5 text-[var(--primary)]" />
                <span>Live Calculation Results</span>
              </CardTitle>
              <span className="text-xs font-mono bg-[var(--primary)]/15 text-[var(--primary)] px-2.5 py-1 rounded-md border border-[var(--primary)]/30 font-bold">
                Live Engine
              </span>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Estimated capacity, output yield, and financial payback
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl border border-border bg-card/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Sun className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>System Capacity</span>
                </div>
                <div className="text-2xl font-black font-mono text-[var(--primary)]">
                  {recommendedCapacityKwp} <span className="text-xs font-normal text-muted-foreground">kWp</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-border bg-card/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Zap className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Modules Needed</span>
                </div>
                <div className="text-2xl font-black font-mono text-[var(--primary)]">
                  {totalPanelsNeeded} <span className="text-xs font-normal text-muted-foreground">Panels</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-border bg-card/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Sun className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Annual Output</span>
                </div>
                <div className="text-2xl font-black font-mono text-foreground">
                  {estimatedAnnualProduction.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kWh</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-border bg-card/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Annual Savings</span>
                </div>
                <div className="text-2xl font-black font-mono text-[var(--primary)]">
                  {estimatedAnnualSavings.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">DT</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-border bg-card/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Payback Period</span>
                </div>
                <div className="text-2xl font-black font-mono text-foreground">
                  {paybackPeriodYears} <span className="text-xs font-normal text-muted-foreground">years</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-border bg-card/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Leaf className="w-3.5 h-3.5 text-primary" />
                  <span>CO₂ Reduction</span>
                </div>
                <div className="text-2xl font-black font-mono text-primary">
                  {co2ReductionTons} <span className="text-xs font-normal text-muted-foreground">tons/yr</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[var(--primary)] shrink-0" />
                <div>
                  <div className="text-xs font-bold text-foreground">Feasibility Score: High</div>
                  <div className="text-[11px] text-muted-foreground">
                    Estimated system cost ~ {estimatedSystemCost.toLocaleString()} DT
                  </div>
                </div>
              </div>
              <Button size="sm" className="bg-[var(--primary)] hover:bg-[var(--primary)] text-primary-foreground font-bold text-xs">
                Request Proposal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
export {
  SolarSimulatorPage as default
};
