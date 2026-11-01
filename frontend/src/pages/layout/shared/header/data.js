import { Calendar, Command, LayoutPanelLeft, House, User, Settings, Receipt, Keyboard } from 'lucide-react';

//Apps Links Type & Data

const appsLink= [
  {
    href: "/apps/chats",
    title: "Chat Application",
    subtext: "New messages arrived",
    avatar: "/images/svgs/icon-dd-chat.svg",
  },
  {
    href: "/apps/ecommerce/shop",
    title: "eCommerce App",
    subtext: "New stock available",
    avatar: "/images/svgs/icon-dd-cart.svg",
  },
  {
    href: "/apps/notes",
    title: "Notes App",
    subtext: "To-do and Daily tasks",
    avatar: "/images/svgs/icon-dd-invoice.svg",
  },
  {
    href: "/apps/calendar",
    title: "Calendar App",
    subtext: "Get dates",
    avatar: "/images/svgs/icon-dd-date.svg",
  },
  {
    href: "/apps/contacts",
    title: "Contact Application",
    subtext: "2 Unsaved Contacts",
    avatar: "/images/svgs/icon-dd-mobile.svg",
  },
  {
    href: "/apps/tickets",
    title: "Tickets App",
    subtext: "Submit tickets",
    avatar: "/images/svgs/icon-dd-lifebuoy.svg",
  },
  {
    href: "/apps/email",
    title: "Email App",
    subtext: "Get new emails",
    avatar: "/images/svgs/icon-dd-message-box.svg",
  },
  {
    href: "/apps/blog/post",
    title: "Blog App",
    subtext: "added new blog",
    avatar: "/images/svgs/icon-dd-application.svg",
  },
];

const pageLinks= [
  {
    href: "/theme-pages/pricing",
    title: "Pricing Page",
  },
  {
    href: "/auth/auth1/login",
    title: "Authentication Design",
  },
  {
    href: "/auth/auth1/register",
    title: "Register Now",
  },
  {
    href: "/404",
    title: "404 Error Page",
  },
  {
    href: "/apps/kanban",
    title: "Kanban App",
  },
  {
    href: "/apps/user-profile/profile",
    title: "User Application",
  },
  {
    href: "/apps/blog/post",
    title: "Blog Design",
  },
  {
    href: "/apps/ecommerce/checkout",
    title: "Shopping Cart",
  },
];

//   Search Data

const SearchLinks= [
  {
    title: 'Analytics',
    href: '/dashboards/analytics',
  },
  {
    title: 'eCommerce',
    href: '/dashboards/ecommerce',
  },
  {
    title: 'Modern',
    href: '/dashboards/modern',
  },
];

//   Message Data

const MessagesLink= [
  {
    avatar: '/images/profile/user-3.png',
    color: "bg-destructive",
    title: "Michell Flintoff",
    subtitle: "You: Yesterdy was great...",
    time: "just now",
    badgeColor: "bg-destructive",
    isRead: false,
  },
  {
    avatar: '/images/profile/user-2.png',
    color: "bg-primary",
    title: "Bianca Anderson",
    subtitle: "Nice looking dress you...",
    time: "5 mins ago",
    badgeColor: "bg-primary",
    isRead: false,
  },
  {
    avatar: '/images/profile/user-7.png',
    color: "bg-secondary",
    title: "Andrew Johnson",
    subtitle: "Sent a photo",
    time: "10 mins ago",
    badgeColor: "bg-chart-2",
    isRead: false,
  },
  {
    avatar: '/images/profile/user-6.png',
    color: "bg-chart-2",
    title: "Jolly Cummins",
    subtitle: "If I don't like something",
    time: "5 days ago",
    badgeColor: "bg-chart-4",
    isRead: true,
  },
  {
    avatar: '/images/profile/user-2.png',
    color: "bg-chart-1",
    title: "Josh Macklow",
    subtitle: "$230 deducted from account",
    time: "year ago",
    badgeColor: "bg-chart-2",
    isRead: true,
  },
];

const Notification= [

  {
    icon: Calendar,
    bgcolor: "bg-chart-4/10",
    color: 'text-chart-4',
    title: "Événement aujourd'hui",
    subtitle: "Rappel : vous avez un événement aujourd'hui",
    time: "09:15",
    isRead: false,
  },
  {
    icon: Settings,
    bgcolor: "bg-chart-1/10",
    color: 'text-chart-1',
    title: "Paramètres",
    subtitle: "Personnalisez votre tableau de bord",
    time: "16:36",
    isRead: false,
  },
  {
    icon: LayoutPanelLeft,
    bgcolor: "bg-chart-2/10 ",
    color: 'text-chart-2',
    title: "Nouveauté",
    subtitle: "Découvrez la nouvelle interface d'administration",
    time: "09:30",
    isRead: false,
  },
  {
    icon: Command,
    bgcolor: "bg-primary/5",
    color: 'text-primary',
    title: "Nouveauté",
    subtitle: "Découvrez la nouvelle interface d'administration",
    time: "09:30",
    isRead: false,
  },
  {
    icon: Calendar,
    bgcolor: "bg-chart-5/10 ",
    color: 'text-chart-5',
    title: "Événement aujourd'hui",
    subtitle: "Rappel : vous avez un événement aujourd'hui",
    time: "09:15",
    isRead: false,
  },
  {
    icon: Settings,
    bgcolor: "bg-chart-1/10",
    color: 'text-chart-1',
    title: "Paramètres",
    subtitle: "Personnalisez votre tableau de bord",
    time: "16:36",
    isRead: true,
  },
];

const profileDD= [
  {
    avatar: House,
    title: 'Accueil',
    href: '/',
    badge: false
  },
  {
    avatar: User,
    title: 'Profil',
    href: '/pages/user-profile',
    badge: false
  },
  {
    avatar: Keyboard,
    title: 'Abonnement',
    href: 'https://demos.shadcndashboard.dev/theme-pages/pricing',
    badge: false,
    isPro: true,
    external: true,
  },
  {
    avatar: Settings,
    title: 'Paramètres du compte',
    href: 'https://demos.shadcndashboard.dev/theme-pages/account-settings',
    isPro: true,
    badge: false,
    external: true,
  }
];

export {
  appsLink,
  pageLinks,
  SearchLinks,
  MessagesLink,
  Notification,
  profileDD,
};
