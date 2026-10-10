

export const SOLAR_KPI_DATA= [
  {
    id: "efficiency",
    title: "Solar Efficiency",
    value: "60%",
    numericValue: 60,
    unit: "%",
    status: "High",
    statusColor: "emerald",
    gaugeMax: 100,
    subtext: "System peak performance optimal",
  },
  {
    id: "generation",
    title: "Power Generation",
    value: "6.5 Kw",
    numericValue: 6.5,
    unit: "Kw",
    status: "Optimal",
    statusColor: "emerald",
    gaugeMax: 10,
    subtext: "Live solar output from array",
  },
  {
    id: "consumed",
    title: "Energy Consumed",
    value: "12 KWh",
    numericValue: 12,
    unit: "KWh",
    status: "Moderate",
    statusColor: "amber",
    gaugeMax: 20,
    subtext: "Current building load draw",
  },
  {
    id: "savings",
    title: "Today's Savings",
    value: "24.80 DT",
    numericValue: 24.8,
    unit: "DT",
    status: "High",
    statusColor: "blue",
    gaugeMax: 50,
    trend: "+12.5%",
    isPositiveTrend: true,
    subtext: "Vs grid power baseline",
  },
];

export const PERFORMANCE_DATA = {
  solarProduction: {
    label: "Total Charging",
    currentKwh: 4.82,
    totalCharging: 80.88,
    minKwh: 3.0,
    maxKwh: 6.0,
  },
  powerUsage: {
    label: "Power Usage",
    currentKwh: 12.35,
    hourlyUsageKwh: 6.8,
  },
  systemStats: {
    capacityKwh: 210,
    yieldKwh: 178,
  },
};

export const HOME_CONSUMPTION_DATA = {
  distribution: [
    { label: "Solar", percentage: 50, color: "#3b82f6" }, // blue/cyan
    { label: "Grid", percentage: 16, color: "#10b981" },  // green/emerald
    { label: "Other", percentage: 34, color: "#f97316" }, // orange/amber
  ],
  rows: [
    { label: "Meter Power", percentage: 50, value: "0.8 kw", color: "#3b82f6" },
    { label: "Meter Energy", percentage: 16, value: "2.656 kw", color: "#10b981" },
    { label: "Utility Meter Uptime", percentage: 34, value: "75d 4h 25m", color: "#f97316" },
  ],
  tariffSettings: {
    standardTariff: 12.8,
    meterEnergyPrice: 1.56,
  },
};

export const ENERGY_PRODUCTION_CHART_DATA = [
  { time: "00:00", solar: 0, consumption: 1.2, gridExport: 0 },
  { time: "03:00", solar: 0, consumption: 0.9, gridExport: 0 },
  { time: "06:00", solar: 1.4, consumption: 1.5, gridExport: 0.2 },
  { time: "09:00", solar: 4.8, consumption: 2.8, gridExport: 2.0 },
  { time: "12:00", solar: 7.2, consumption: 3.4, gridExport: 3.8 },
  { time: "15:00", solar: 6.1, consumption: 3.1, gridExport: 3.0 },
  { time: "18:00", solar: 2.5, consumption: 4.2, gridExport: 0 },
  { time: "21:00", solar: 0.2, consumption: 2.6, gridExport: 0 },
];

export const PERIOD_CONSUMPTION_DATA = {
  today: [
    { label: "6 AM", current: 1.2, previous: 1.0 },
    { label: "9 AM", current: 2.8, previous: 2.5 },
    { label: "12 PM", current: 3.4, previous: 3.1 },
    { label: "3 PM", current: 3.1, previous: 2.9 },
    { label: "6 PM", current: 4.2, previous: 3.8 },
    { label: "9 PM", current: 2.6, previous: 2.4 },
  ],
  thisWeek: [
    { label: "Mon", current: 24.2, previous: 22.0 },
    { label: "Tue", current: 26.8, previous: 25.1 },
    { label: "Wed", current: 21.4, previous: 24.0 },
    { label: "Thu", current: 28.5, previous: 26.2 },
    { label: "Fri", current: 30.1, previous: 28.9 },
    { label: "Sat", current: 19.8, previous: 21.0 },
    { label: "Sun", current: 18.2, previous: 19.5 },
  ],
  thisMonth: [
    { label: "Week 1", current: 175, previous: 160 },
    { label: "Week 2", current: 188, previous: 172 },
    { label: "Week 3", current: 164, previous: 168 },
    { label: "Week 4", current: 195, previous: 180 },
  ],
  thisYear: [
    { label: "Q1", current: 520, previous: 480 },
    { label: "Q2", current: 680, previous: 610 },
    { label: "Q3", current: 840, previous: 790 },
    { label: "Q4", current: 590, previous: 540 },
  ],
};

export const DAILY_YIELD_DATA = {
  totalYield: 17.2,
  exportedEnergy: 8.2,
  selfUseEnergy: 12.71,
  hourlyBreakdown: [
    { time: "6 AM", solarProduction: 1.2, exportedEnergy: 0.2, selfConsumption: 1.0 },
    { time: "9 AM", solarProduction: 4.5, exportedEnergy: 2.1, selfConsumption: 2.4 },
    { time: "12 PM", solarProduction: 6.8, exportedEnergy: 3.8, selfConsumption: 3.0 },
    { time: "3 PM", solarProduction: 5.4, exportedEnergy: 2.7, selfConsumption: 2.7 },
    { time: "6 PM", solarProduction: 2.1, exportedEnergy: 0.3, selfConsumption: 1.8 },
  ],
};

export const BATTERY_STATUS_DATA = {
  load: 24,
  charge: 100,
  voltage: 23.6,
  healthPercentage: 78,
  status: "Battery Healthy",
  isCharging: true,
};

export const SMART_ADVISOR_DATA = {
  title: "Smart Advisor",
  insight: "Solar production is currently higher than your household consumption.",
  recommendation: "Consider charging your battery or shifting high-energy appliances to the current production period.",
  actionText: "View Recommendation →",
};

export const SYSTEM_ALERTS_DATA= [
  {
    id: "1",
    type: "success",
    message: "Solar production normal",
    timestamp: "Just now",
    status: "Optimal",
  },
  {
    id: "2",
    type: "success",
    message: "Battery charging normally",
    timestamp: "10m ago",
    status: "Healthy",
  },
  {
    id: "3",
    type: "warning",
    message: "Energy consumption above average",
    timestamp: "25m ago",
    status: "Attention",
  },
  {
    id: "4",
    type: "success",
    message: "No critical system issues",
    timestamp: "1h ago",
    status: "Passed",
  },
];
