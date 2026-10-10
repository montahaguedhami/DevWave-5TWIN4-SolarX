

export const mockDashboardData = {
  user: {
    name: "Montaha",
    email: "montaha@smartsolar.energy",
    avatar: "/images/profile/avtar.webp",
    installation: "Villa Soleil Residence",
  },
  kpis: {
    solarProduction: {
      value: "4.82 kWh",
      period: "Today",
      change: "+12.5%",
      isPositive: true,
    },
    energyConsumption: {
      value: "3.67 kWh",
      period: "Today",
      change: "-5.2%",
      isPositive: true,
    },
    battery: {
      value: "78%",
      period: "Current charge",
      change: "+1.2 kW Charging",
      isPositive: true,
    },
    savings: {
      value: "24.80 DT",
      period: "This month",
      change: "+18.4%",
      isPositive: true,
    },
  },
  realTimeOutput: {
    currentW: 4820,
    peakW: 6200,
  },
  efficiencyGauge: {
    percentage: 90,
    status: "Optimal Performance",
  },
  weather: {
    tempC: 24,
    condition: "Rain for the next hour",
    icon: "CloudRain",
    humidity: "62%",
    windKm: 14,
  },
  powerGenEfficiency: {
    percentage: 90,
    recommendations: [
      { text: "Clean panel surface", gain: "+3%" },
      { text: "Trim nearby trees", gain: "+5%" },
    ],
  },
  weatherImpact: [
    { metric: "Sunlight Hours", actual: 8.5, expected: 9.0, unit: "h" },
    { metric: "Cloud Cover", actual: 35, expected: 20, unit: "%" },
    { metric: "Temperature", actual: 24, expected: 25, unit: "°C" },
    { metric: "Wind Speed", actual: 14, expected: 12, unit: "km/h" },
  ],
  energyOverview24h: [
    { time: "00:00", solar: 0, consumption: 0.8 },
    { time: "02:00", solar: 0, consumption: 0.6 },
    { time: "04:00", solar: 0, consumption: 0.5 },
    { time: "06:00", solar: 0.4, consumption: 1.2 },
    { time: "08:00", solar: 2.1, consumption: 2.5 },
    { time: "10:00", solar: 4.5, consumption: 2.1 },
    { time: "12:00", solar: 6.2, consumption: 2.8, isPeak: true },
    { time: "14:00", solar: 5.8, consumption: 2.3 },
    { time: "16:00", solar: 3.9, consumption: 2.6 },
    { time: "18:00", solar: 1.5, consumption: 3.8 },
    { time: "20:00", solar: 0.2, consumption: 3.2 },
    { time: "22:00", solar: 0, consumption: 1.5 },
  ],
  energyFlow: {
    solarPanelKw: 4.82,
    homeKw: 2.10,
    batterySoc: 78,
    batteryKw: 1.20,
    gridExportKw: 1.52,
  },
  smartAdvisor: {
    title: "Peak Generation Window Active",
    recommendation:
      "Your solar production is currently higher than your consumption. Consider charging your battery during peak production hours.",
    potentialDailySavings: "3.40 DT",
  },
  alerts: [
    {
      id: "1",
      title: "Battery charging normally",
      time: "10 mins ago",
      status: "Normal",
      type: "success",
    },
    {
      id: "2",
      title: "Solar production above expected level",
      time: "2 hours ago",
      status: "Optimal",
      type: "warning",
    },
    {
      id: "3",
      title: "No critical issues detected",
      time: "System check 14:00",
      status: "Healthy",
      type: "info",
    },
  ],
  maintenance: {
    lastDate: "2026-06-15",
    nextDate: "2026-10-15",
    records: [
      {
        id: "M-101",
        date: "2026-06-15",
        description: "Inverter Diagnostic & Firmware Update",
        cost: "120 DT",
        technicianName: "Alex Mercer",
        technicianAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      },
      {
        id: "M-102",
        date: "2026-03-10",
        description: "Panel Surface Deep Wash & Calibration",
        cost: "80 DT",
        technicianName: "Sarah Connor",
        technicianAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      },
      {
        id: "M-103",
        date: "2025-11-20",
        description: "Battery Cell Equalization Check",
        cost: "150 DT",
        technicianName: "Marcus Vance",
        technicianAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      },
    ],
  },
};
