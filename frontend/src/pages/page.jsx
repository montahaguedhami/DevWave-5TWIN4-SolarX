import { KpiCards } from "@/components/dashboards/solar/kpi-cards";
import { PerformanceCard } from "@/components/dashboards/solar/performance-card";
import { EnergyConsumptionCard } from "@/components/dashboards/solar/energy-consumption-card";
import { EnergyProductionChart } from "@/components/dashboards/solar/energy-production-chart";
import { EnergyConsumptionChart } from "@/components/dashboards/solar/energy-consumption-chart";
import { DailyYieldCard } from "@/components/dashboards/solar/daily-yield-card";
import { BatteryStatus } from "@/components/dashboards/solar/battery-status";
import { SmartAdvisorCard } from "@/components/dashboards/solar/smart-advisor-card";
import { AlertsCard } from "@/components/dashboards/solar/alerts-card";
const metadata = {
  title: "Dashboard - SolarX",
  description: "Monitor. Optimize. Save. SolarX commercial solar energy management dashboard."
};
function SolarDashboardPage() {
  return <div className="space-y-6 pb-12">
      {
    /* 1. Top Row: 4 KPI Gauges & Metrics */
  }
      <KpiCards />

      {
    /* 2. Middle Row: Performance Monitoring & Home Energy Consumption */
  }
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <PerformanceCard />
        </div>
        <div className="lg:col-span-5">
          <EnergyConsumptionCard />
        </div>
      </div>

      {
    /* 3. Charts Row: Energy Production vs Consumption Trends */
  }
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <EnergyProductionChart />
        </div>
        <div className="lg:col-span-6">
          <EnergyConsumptionChart />
        </div>
      </div>

      {
    /* 4. Telemetry Row: Daily Yield & Battery Status */
  }
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <DailyYieldCard />
        </div>
        <div className="lg:col-span-5">
          <BatteryStatus />
        </div>
      </div>

      {
    /* 5. Intelligence Row: Smart Advisor & System Alerts */
  }
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <SmartAdvisorCard />
        </div>
        <div className="lg:col-span-6">
          <AlertsCard />
        </div>
      </div>
    </div>;
}
export {
  SolarDashboardPage as default,
  metadata
};
