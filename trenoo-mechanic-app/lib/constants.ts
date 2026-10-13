export const APP_CONFIG = {
  name: "TrenoOps Fleet & Trailer Platform",
  companyName: "Regal Application LLC",
  copyright: "© Regal Application LLC, All Right Reserved.",
  contact: {
    email: "team@trenoops.com",
    address: "California, 93711, USA",
    phone: "+15593886914",
    phoneDisplay: "+1 (559) 388-6914",
    whatsappUrl: "https://wa.me/15593886914",
  },
  social: {
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    instagram: "https://instagram.com",
  },
  colors: {
    primary: "#F96176",
    primaryHover: "#e0485d",
    primaryLight: "#FFEBF3",
    secondary: "#58BB87",
    secondaryHover: "#48a674",
    secondaryLight: "#EAF8F1",
    navy: "#0B132B",
    navyCard: "#1C2541",
    navyHover: "#273469",
    orange: "#FF9900",
    tertiary: "#0078A6",
  },
};

export interface SidebarMenuItem {
  key: string;
  label: string;
  href: string;
  description: string;
}

// Exactly 7 menus requested by user (NO submenus):
// Find Jobs, Invoice, Check, Inspections, Team, Reports, Export
export const SIDEBAR_MENU_ITEMS: SidebarMenuItem[] = [
  {
    key: "find-jobs",
    label: "Find Jobs",
    href: "/find-jobs",
    description: "Commercial truck & trailer work orders and bay assignments",
  },
  {
    key: "invoice",
    label: "Invoice",
    href: "/invoice",
    description: "Fleet billing, parts & labor work orders, accounts receivable",
  },
  {
    key: "check",
    label: "Check",
    href: "/check",
    description: "Vendor checks, fleet driver payout drafts, bank ledger",
  },
  {
    key: "inspections",
    label: "Inspections",
    href: "/inspections",
    description: "Annual DOT inspections, 90-day BIT, trailer chassis audits",
  },
  {
    key: "team",
    label: "Team",
    href: "/team",
    description: "Heavy duty diesel technicians, trailer specialists, shop bays",
  },
  {
    key: "reports",
    label: "Reports",
    href: "/reports",
    description: "Fleet maintenance turnaround & parts analytics",
  },
  {
    key: "export",
    label: "Export",
    href: "/export",
    description: "QuickBooks accounting & DOT compliance export",
  },
];
