import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PackageMinus, TrendingUp, DollarSign, LineChart, Download } from "lucide-react";
import { useInventory } from "@/context/InventoryContext";
import { exportToExcel } from "@/utils/exportToExcel";

import SalesByCategoryPieChart from "@/components/reports/SalesByCategoryPieChart";
import InventoryValueByLocationBarChart from "@/components/reports/InventoryValueByLocationBarChart";
import StockLevelTrendLineChart from "@/components/reports/StockLevelTrendLineChart";

const Reports: React.FC = () => {
  const { inventoryItems } = useInventory();

  const lowStockItems = useMemo(() => {
    return inventoryItems.filter(item => item.quantity <= item.reorderLevel);
  }, [inventoryItems]);

  const bestSellingProducts = useMemo(() => {
    if (inventoryItems.length === 0) return [];
    return inventoryItems
      .map(item => ({
        name: item.name,
        unitsSold: Math.floor(item.quantity * 0.75) + 1, // Mock sales
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 4);
  }, [inventoryItems]);

  const totalInventoryValue = useMemo(() => {
    return inventoryItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  }, [inventoryItems]);

  const handleExportLowStock = () => {
    if (lowStockItems.length === 0) {
      showSuccess("No low stock items to export.");
      return;
    }
    const dataToExport = lowStockItems.map(item => ({
      "Item Name": item.name,
      "SKU": item.sku,
      "On Hand": item.quantity,
      "Reorder Level": item.reorderLevel,
      "Location": item.location,
    }));
    exportToExcel(dataToExport, "Low_Stock_Report", "Low Stock");
  };

  const handleExportSalesByCategory = () => {
    if (inventoryItems.length === 0) {
      showSuccess("No sales data by category to export.");
      return;
    }
    const categorySalesMap: { [key: string]: number } = {};
    inventoryItems.forEach(item => {
      const simulatedSalesRevenue = item.retailPrice * (item.quantity / 2 + 10);
      categorySalesMap[item.category] = (categorySalesMap[item.category] || 0) + simulatedSalesRevenue;
    });
    const dataToExport = Object.entries(categorySalesMap).map(([category, revenue]) => ({
      "Category": category,
      "Sales Revenue": parseFloat(revenue.toFixed(2)),
    }));
    exportToExcel(dataToExport, "Sales_by_Category_Report", "Sales by Category");
  };

  const handleExportInventoryValue = () => {
    if (inventoryItems.length === 0) {
      showSuccess("No inventory value data to export.");
      return;
    }
    const locationValueMap: { [key: string]: number } = {};
    inventoryItems.forEach(item => {
      locationValueMap[item.location] = (locationValueMap[item.location] || 0) + (item.quantity * item.unitCost);
    });
    const dataToExport = Object.entries(locationValueMap).map(([location, value]) => ({
      "Location": location,
      "Inventory Value": parseFloat(value.toFixed(2)),
    }));
    exportToExcel(dataToExport, "Inventory_Value_Report", "Inventory Value");
  };

  const handleExportStockTrend = () => {
    if (inventoryItems.length === 0) {
      showSuccess("No stock trend data to export.");
      return;
    }
    const dataPoints = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();

    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      const monthName = months[monthIndex];
      const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
      const simulatedStock = totalQuantity > 0 ? Math.max(0, totalQuantity + (Math.random() - 0.5) * totalQuantity * 0.1) : 0;
      dataPoints.push({ name: monthName, "Total Stock": parseFloat(simulatedStock.toFixed(0)) });
    }
    exportToExcel(dataPoints, "Stock_Level_Trend_Report", "Stock Trend");
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Reports & Analytics</h1>
      <p className="text-muted-foreground">
        Gain actionable insights into your inventory and sales performance with these pre-built reports.
      </p>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="bg-card border-border rounded-lg shadow-sm" id="low-stock-report-content">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">Low Stock Items</CardTitle>
            <PackageMinus className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            {lowStockItems.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead className="text-right">On Hand</TableHead>
                      <TableHead className="text-right">Reorder Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right text-red-400">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.reorderLevel}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-sm text-muted-foreground mt-4">
                  <span className="font-semibold text-destructive">Insight:</span> These {lowStockItems.length} items are below their reorder level. Consider placing new purchase orders soon to avoid stockouts and lost sales.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">No items currently at low stock levels. Great job!</p>
            )}
            <Button onClick={handleExportLowStock} className="w-full mt-4" disabled={lowStockItems.length === 0}>
              <Download className="h-4 w-4 mr-2" /> Export Low Stock Report (Excel)
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-lg shadow-sm" id="sales-by-category-report-content">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">Sales by Product Category</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <SalesByCategoryPieChart />
            <p className="text-sm text-muted-foreground mt-4">
              <span className="font-semibold text-primary">Insight:</span> This chart shows the revenue distribution across your product categories. Focus marketing efforts on top-performing categories and analyze underperforming ones.
            </p>
            <Button onClick={handleExportSalesByCategory} className="w-full mt-4" disabled={inventoryItems.length === 0}>
              <Download className="h-4 w-4 mr-2" /> Export Sales by Category (Excel)
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-lg shadow-sm" id="inventory-value-report-content">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">Inventory Value by Location</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <InventoryValueByLocationBarChart />
            <p className="text-sm text-muted-foreground mt-4">
              <span className="font-semibold text-green-500">Insight:</span> Understand where your capital is tied up. High-value locations might require enhanced security or optimized space utilization.
            </p>
            <Button onClick={handleExportInventoryValue} className="w-full mt-4" disabled={inventoryItems.length === 0}>
              <Download className="h-4 w-4 mr-2" /> Export Inventory Value (Excel)
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-lg shadow-sm col-span-full" id="stock-trend-report-content">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">Overall Stock Level Trend</CardTitle>
            <LineChart className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <StockLevelTrendLineChart />
            <p className="text-sm text-muted-foreground mt-4">
              <span className="font-semibold text-accent">Insight:</span> This trend shows your total inventory units over time. A consistent decline might indicate a need for more frequent reordering or increased supplier capacity.
            </p>
            <Button onClick={handleExportStockTrend} className="w-full mt-4" disabled={inventoryItems.length === 0}>
              <Download className="h-4 w-4 mr-2" /> Export Stock Trend (Excel)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;