import { KpiCards } from "@/components/dashboards/solar/kpi-cards";
import { PerformanceCard } from "@/components/dashboards/solar/performance-card";
import { EnergyConsumptionCard } from "@/components/dashboards/solar/energy-consumption-card";
import { EnergyProductionChart } from "@/components/dashboards/solar/energy-production-chart";
import { EnergyConsumptionChart } from "@/components/dashboards/solar/energy-consumption-chart";
import { DailyYieldCard } from "@/components/dashboards/solar/daily-yield-card";
import { BatteryStatus } from "@/components/dashboards/solar/battery-status";
import { SmartAdvisorCard } from "@/components/dashboards/solar/smart-advisor-card";
import { AlertsCard } from "@/components/dashboards/solar/alerts-card";
import { Activity, ShieldAlert, Database, Cpu, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const metadata = {
  title: "Tableau de Bord - SolarX",
  description: "Supervision intelligente du réseau énergétique solaire, du stockage et des incidents.",
};

function SolarDashboardPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* En-tête exécutif SolarX */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Réseau En Ligne
            </span>
            <span className="text-xs text-muted-foreground">
              Plateforme de Supervision Énergétique
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Tableau de Bord Énergétique
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Supervision temps réel du parc solaire (580 kW), des batteries (60 kWh) et des incidents du réseau.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/incidents"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Incidents & Maintenances
          </Link>

          <Link
            to="/stockage"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-primary" />
            Stockage
          </Link>

          <Link
            to="/equipements"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-primary" />
            Équipements
          </Link>
        </div>
      </div>

      {/* 1. Top Row: 4 KPI Gauges & Metrics (Connectés aux APIs réelles) */}
      <KpiCards />

      {/* 2. Middle Row: Performance Monitoring & Home Energy Consumption */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <PerformanceCard />
        </div>
        <div className="lg:col-span-5">
          <EnergyConsumptionCard />
        </div>
      </div>

      {/* 3. Charts Row: Energy Production vs Consumption Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <EnergyProductionChart />
        </div>
        <div className="lg:col-span-6">
          <EnergyConsumptionChart />
        </div>
      </div>

      {/* 4. Telemetry Row: Daily Yield & Battery Status (Batterie_01 & Batterie_02) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <DailyYieldCard />
        </div>
        <div className="lg:col-span-5">
          <BatteryStatus />
        </div>
      </div>

      {/* 5. Intelligence Row: Smart Advisor & Incidents récents (Module P6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <SmartAdvisorCard />
        </div>
        <div className="lg:col-span-6">
          <AlertsCard />
        </div>
      </div>
    </div>
  );
}

export { SolarDashboardPage as default, metadata };
