import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard, Package, Receipt, Truck, BarChart, Scale, FileText, DollarSign, Users, AlertTriangle
} from "lucide-react";

interface ReportCategory {
  title: string;
  icon: React.ElementType;
  reports: ReportItem[];
}

interface ReportItem {
  id: string; // Unique ID for the report, used in URL hash
  title: string;
  description: string;
  icon: React.ElementType;
}

const reportCategories: ReportCategory[] = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    reports: [
      { id: "dashboard-summary", title: "Dashboard Summary", description: "High-level overview of key metrics.", icon: LayoutDashboard },
    ],
  },
  {
    title: "Inventory Reports",
    icon: Package,
    reports: [
      { id: "inventory-valuation", title: "Inventory Valuation", description: "Value of all stock by category/location.", icon: DollarSign },
      { id: "low-stock-out-of-stock", title: "Low/Out of Stock", description: "Items needing replenishment.", icon: AlertTriangle },
      { id: "inventory-movement", title: "Inventory Movement", description: "Detailed log of stock changes.", icon: Scale },
      { id: "stock-discrepancy", title: "Stock Discrepancy", description: "Reported differences in stock counts.", icon: AlertTriangle },
    ],
  },
  {
    title: "Sales Reports",
    icon: Receipt,
    reports: [
      { id: "sales-by-customer", title: "Sales by Customer", description: "Revenue generated per customer.", icon: Users },
      { id: "sales-by-product", title: "Sales by Product", description: "Top-selling items by quantity/revenue.", icon: BarChart },
    ],
  },
  {
    title: "Purchase Reports",
    icon: Truck,
    reports: [
      { id: "purchase-order-status", title: "Purchase Order Status", description: "Overview of all purchase orders.", icon: FileText },
    ],
  },
  {
    title: "Financial Reports",
    icon: DollarSign,
    reports: [
      { id: "profitability", title: "Profitability (Gross Margin)", description: "Gross profit by product or category.", icon: DollarSign },
    ],
  },
];

interface ReportSidebarProps {
  onReportSelect: (reportId: string) => void;
}

const ReportSidebar: React.FC<ReportSidebarProps> = ({ onReportSelect }) => {
  const location = useLocation();
  const activeReportId = location.hash.replace("#", "");

  return (
    <ScrollArea className="h-full py-4 pr-4">
      <nav className="space-y-6">
        {reportCategories.map((category) => (
          <div key={category.title}>
            <h3 className="mb-2 flex items-center gap-2 px-3 text-sm font-semibold text-muted-foreground">
              <category.icon className="h-4 w-4" /> {category.title}
            </h3>
            <div className="space-y-1">
              {category.reports.map((report) => (
                <Link
                  key={report.id}
                  to={`/reports#${report.id}`}
                  onClick={() => onReportSelect(report.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50",
                    activeReportId === report.id ? "bg-muted text-primary" : "text-foreground"
                  )}
                >
                  <report.icon className="h-4 w-4" />
                  {report.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </ScrollArea>
  );
};

export default ReportSidebar;