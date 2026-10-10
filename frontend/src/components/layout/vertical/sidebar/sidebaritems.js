import { uniqueId } from "lodash";
import { LayoutDashboard, Sun, Zap, BatteryCharging, BarChart3, TrendingUp, Globe, Sparkles, Bell, Calculator, Settings, ShieldCheck, LucideIcon } from "lucide-react";

const SidebarContent= [
  {
    heading: "OVERVIEW",
    items: [
      {
        id: uniqueId(),
        name: "Dashboard",
        icon: LayoutDashboard,
        url: "/",
      },
    ],
  },
  {
    heading: "ENERGY",
    items: [
      {
        id: uniqueId(),
        name: "My Installation",
        icon: ShieldCheck,
        url: "/my-installation",
      },
      {
        id: uniqueId(),
        name: "Solar Production",
        icon: Sun,
        url: "/solar-production",
      },
      {
        id: uniqueId(),
        name: "Energy Consumption",
        icon: Zap,
        url: "/consumption",
      },
      {
        id: uniqueId(),
        name: "Battery",
        icon: BatteryCharging,
        url: "/battery",
      },
    ],
  },
  {
    heading: "ANALYTICS",
    items: [
      {
        id: uniqueId(),
        name: "Energy Analytics",
        icon: BarChart3,
        url: "/analytics",
      },
      {
        id: uniqueId(),
        name: "Savings",
        icon: TrendingUp,
        url: "/savings",
      },
      {
        id: uniqueId(),
        name: "Environmental Impact",
        icon: Globe,
        url: "/environmental-impact",
      },
    ],
  },
  {
    heading: "SMART",
    items: [
      {
        id: uniqueId(),
        name: "AI Advisor",
        icon: Sparkles,
        url: "/ai-advisor",
        badge: true,
        badgeType: "filled",
        badgeContent: "AI",
      },
      {
        id: uniqueId(),
        name: "Alerts",
        icon: Bell,
        url: "/alerts",
      },
    ],
  },
  {
    heading: "TOOLS",
    items: [
      {
        id: uniqueId(),
        name: "Solar Simulator",
        icon: Calculator,
        url: "/solar-simulator",
      },
    ],
  },
  {
    heading: "SYSTEM",
    items: [
      {
        id: uniqueId(),
        name: "Settings",
        icon: Settings,
        url: "/settings",
      },
    ],
  },
];

export default SidebarContent;
