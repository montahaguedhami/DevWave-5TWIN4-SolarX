import { uniqueId } from "lodash";
import { LayoutDashboard, Sun, Zap, BatteryCharging, BarChart3, TrendingUp, Globe, Sparkles, Bell, Calculator, Settings, ShieldCheck, MapPin, CloudSun, CalendarDays, Cable, Network, MessageSquareText, Database, Cpu } from "lucide-react";

const SidebarContent= [
  {
    heading: "APERÇU",
    items: [
      {
        id: uniqueId(),
        name: "Tableau de bord",
        icon: LayoutDashboard,
        url: "/",
      },
    ],
  },
  {
    heading: "ÉNERGIE",
    items: [
      {
        id: uniqueId(),
        name: "Mon installation",
        icon: ShieldCheck,
        url: "/my-installation",
      },
      {
        id: uniqueId(),
        name: "Production",
        icon: Sun,
        url: "/production",
      },
      {
        id: uniqueId(),
        name: "Consommation",
        icon: Zap,
        url: "/consumption",
      },
      {
        id: uniqueId(),
        name: "Batterie",
        icon: BatteryCharging,
        url: "/battery",
      },
      {
        id: uniqueId(),
        name: "Lignes",
        icon: Cable,
        url: "/lignes",
      },
      {
        id: uniqueId(),
        name: "Réseaux",
        icon: Network,
        url: "/reseaux",
      },
      {
        id: uniqueId(),
        name: "Stockage",
        icon: Database,
        url: "/stockage",
      },
      {
        id: uniqueId(),
        name: "Équipements",
        icon: Cpu,
        url: "/equipements",
      },
    ],
  },
  {
    heading: "ANALYSE",
    items: [
      {
        id: uniqueId(),
        name: "Analyse énergétique",
        icon: BarChart3,
        url: "/analytics",
      },
      {
        id: uniqueId(),
        name: "Équilibre énergétique",
        icon: BarChart3,
        url: "/energy-balance",
      },
      {
        id: uniqueId(),
        name: "Économies",
        icon: TrendingUp,
        url: "/savings",
      },
      {
        id: uniqueId(),
        name: "Impact environnemental",
        icon: Globe,
        url: "/environmental-impact",
      },
    ],
  },
  {
    heading: "ENVIRONNEMENT",
    items: [
      {
        id: uniqueId(),
        name: "Localisation",
        icon: MapPin,
        url: "/localisation",
      },
      {
        id: uniqueId(),
        name: "Météo",
        icon: CloudSun,
        url: "/meteo",
      },
      {
        id: uniqueId(),
        name: "Historique météo",
        icon: CalendarDays,
        url: "/historique-meteo",
      },
    ],
  },
  {
    heading: "INTELLIGENCE",
    items: [
      {
        id: uniqueId(),
        name: "Assistant IA",
        icon: MessageSquareText,
        url: "/assistant-ia",
        badge: true,
        badgeType: "filled",
        badgeContent: "NLP",
      },
      {
        id: uniqueId(),
        name: "Conseiller IA",
        icon: Sparkles,
        url: "/ai-advisor",
        badge: true,
        badgeType: "filled",
        badgeContent: "AI",
      },
      {
        id: uniqueId(),
        name: "Alertes",
        icon: Bell,
        url: "/alerts",
      },
    ],
  },
  {
    heading: "OUTILS",
    items: [
      {
        id: uniqueId(),
        name: "Simulateur solaire",
        icon: Calculator,
        url: "/solar-simulator",
      },
    ],
  },
  {
    heading: "SYSTÈME",
    items: [
      {
        id: uniqueId(),
        name: "Paramètres",
        icon: Settings,
        url: "/settings",
      },
    ],
  },
];

export default SidebarContent;
