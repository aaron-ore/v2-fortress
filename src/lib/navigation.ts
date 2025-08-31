import {
  LayoutDashboard,
  Package,
  Receipt,
  Truck,
  BarChart,
  Warehouse,
  Search,
  PackagePlus,
  ShoppingCart,
  ListOrdered,
  Repeat,
  CheckCircle,
  Undo2,
  Scan,
  AlertTriangle,
  MapPin,
  User,
  Settings as SettingsIcon,
  Bell,
  DollarSign,
  Users as UsersIcon,
  HelpCircle,
  Sparkles,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu, // Added Menu icon for sidebar toggle
} from "lucide-react";
import React from "react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  isParent?: boolean;
  children?: NavItem[];
  adminOnly?: boolean;
  mobileOnly?: boolean;
  action?: (dialogKey?: string) => void; // Optional action for items like Logout or opening dialogs
}

export const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Inventory", href: "/inventory", icon: Package },
  { title: "Orders", href: "/orders", icon: Receipt },
  { title: "Vendors", href: "/vendors", icon: Truck },
  { title: "Reports", href: "/reports", icon: BarChart },
  {
    title: "Warehouse Operations",
    href: "/warehouse-operations", // Parent link still navigates to the main page
    icon: Warehouse,
    isParent: true,
    children: [
      { title: "Dashboard", href: "/warehouse-operations", icon: LayoutDashboard, action: (key) => window.location.hash = key || "dashboard" }, // Still navigates to tab
      { title: "Item Lookup", href: "#item-lookup", icon: Search, action: (key) => window.location.hash = key || "item-lookup" },
      { title: "Receive Inventory", href: "#receive-inventory", icon: PackagePlus, action: (key) => window.location.hash = key || "receive-inventory" },
      { title: "Fulfill Order", href: "#fulfill-order", icon: ShoppingCart, action: (key) => window.location.hash = key || "fulfill-order" },
      { title: "Ship Order", href: "#ship-order", icon: Truck, action: (key) => window.location.hash = key || "ship-order" },
      { title: "Picking Wave", href: "#picking-wave", icon: ListOrdered, action: (key) => window.location.hash = key || "picking-wave" },
      { title: "Replenishment", href: "#replenishment", icon: Repeat, action: (key) => window.location.hash = key || "replenishment" },
      { title: "Shipping Verify", href: "#shipping-verify", icon: CheckCircle, action: (key) => window.location.hash = key || "shipping-verify" },
      { title: "Returns Process", href: "#returns-process", icon: Undo2, action: (key) => window.location.hash = key || "returns-process" },
      { title: "Stock Transfer", href: "#stock-transfer", icon: Scan, action: (key) => window.location.hash = key || "stock-transfer" },
      { title: "Cycle Count", href: "#cycle-count", icon: CheckCircle, action: (key) => window.location.hash = key || "cycle-count" },
      { title: "Issue Report", href: "#issue-report", icon: AlertTriangle, action: (key) => window.location.hash = key || "issue-report" },
      { title: "Location Management", href: "/location-management", icon: MapPin }, // This remains a page link
    ],
  },
];

export const userAndSettingsNavItems: NavItem[] = [
  { title: "My Profile", href: "/profile", icon: User },
  { title: "Account Settings", href: "/account-settings", icon: SettingsIcon },
  { title: "Notifications", href: "/notifications-page", icon: Bell },
  { title: "Billing & Subscriptions", href: "/billing", icon: DollarSign },
  { title: "Users", href: "/users", icon: UsersIcon, adminOnly: true },
  { title: "Company Settings", href: "/settings", icon: SettingsIcon },
];

export const supportAndResourcesNavItems: NavItem[] = [
  { title: "Help Center", href: "/help", icon: HelpCircle },
  { title: "What's New?", href: "/whats-new", icon: Sparkles },
  { title: "Setup Instructions", href: "/setup-instructions", icon: BookOpen },
];

// Removed bottomNavItems as per new requirements. Logout will be in user dropdown.