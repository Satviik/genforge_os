import type { LucideIcon } from "lucide-react";
import {
  Camera,
  Factory,
  Globe,
  Handshake,
  LayoutDashboard,
  Package,
  Phone,
  PieChart,
  Settings,
  Share2,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export const operationsNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Network", href: "/dashboard/network", icon: Share2 },
  { label: "Team", href: "/dashboard/team", icon: Users },
  { label: "People", href: "/dashboard/people", icon: Users },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { label: "Production", href: "/dashboard/production", icon: Factory },
  { label: "Inventory", href: "/dashboard/inventory", icon: Warehouse },
  { label: "Allocations", href: "/dashboard/allocations", icon: Handshake },
];

export const financeNav: NavItem[] = [
  { label: "Expenses", href: "/dashboard/expenses", icon: Wallet },
  { label: "Sales", href: "/dashboard/sales", icon: TrendingUp },
  { label: "Profit & Reports", href: "/dashboard/profit", icon: PieChart },
];

export const channelsNav: NavItem[] = [
  { label: "Website", href: "/dashboard/channels/website", icon: Globe },
  { label: "Instagram", href: "/dashboard/channels/instagram", icon: Camera },
  { label: "Direct / Calls", href: "/dashboard/channels/direct", icon: Phone },
  { label: "Marketplace", href: "/dashboard/channels/marketplace", icon: Store },
];

export const navSections: NavSection[] = [
  { id: "operations", label: "Operations", items: operationsNav },
  { id: "finance", label: "Finance", items: financeNav },
  { id: "channels", label: "Channels", items: channelsNav },
];

export const settingsItem: NavItem = {
  label: "Settings",
  href: "/dashboard/settings",
  icon: Settings,
};

export const currentOperator = {
  name: "Satvik Singh",
  role: "Founder",
  initials: "SS",
};

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") {
    return "Overview";
  }

  const allItems = [...navSections.flatMap((section) => section.items), settingsItem];
  const match = allItems.find((item) => isNavActive(pathname, item.href));
  return match?.label ?? "Overview";
}
