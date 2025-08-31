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
  // action?: (dialogKey?: string) => void; // Removed action as href handles navigation
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
      { title: "Dashboard", href: "/warehouse-operations#dashboard", icon: LayoutDashboard }, // Updated href
      { title: "Item Lookup", href: "/warehouse-operations#item-lookup", icon: Search }, // Updated href
      { title: "Receive Inventory", href: "/warehouse-operations#receive-inventory", icon: PackagePlus }, // Updated href
      { title: "Fulfill Order", href: "/warehouse-operations#fulfill-order", icon: ShoppingCart }, // Updated href
      { title: "Ship Order", href: "/warehouse-operations#ship-order", icon: Truck }, // Updated href
      { title: "Picking Wave", href: "/warehouse-operations#picking-wave", icon: ListOrdered }, // Updated href
      { title: "Replenishment", href: "/warehouse-operations#replenishment", icon: Repeat }, // Updated href
      { title: "Shipping Verify", href: "/warehouse-operations#shipping-verify", icon: CheckCircle }, // Updated href
      { title: "Returns Process", href: "/warehouse-operations#returns-process", icon: Undo2 }, // Updated href
      { title: "Stock Transfer", href: "/warehouse-operations#stock-transfer", icon: Scan }, // Updated href
      { title: "Cycle Count", href: "/warehouse-operations#cycle-count", icon: CheckCircle }, // Updated href
      { title: "Issue Report", href: "/warehouse-operations#issue-report", icon: AlertTriangle }, // Updated href
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