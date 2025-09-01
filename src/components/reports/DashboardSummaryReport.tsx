import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRange } from "react-day-picker";
import { useInventory } from "@/context/InventoryContext";
import { useOrders } from "@/context/OrdersContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Loader2, Package, Receipt, AlertTriangle, DollarSign } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardSummaryReportProps {
  dateRange: DateRange | undefined;
  onGenerateReport: (data: { pdfProps: any; printType: string }) => void;
  isLoading: boolean;
  reportContentRef: React.RefObject<HTMLDivElement>;
}

const DashboardSummaryReport: React.FC<DashboardSummaryReportProps> = ({
  dateRange,
  onGenerateReport,
  isLoading,
  reportContentRef,
}) => {
  const { inventoryItems } = useInventory();
  const { orders } = useOrders();
  const { companyProfile } = useOnboarding();

  const [reportGenerated, setReportGenerated] = useState(false);
  const [currentReportData, setCurrentReportData] = useState<any>(null);

  const generateReport = useCallback(() => {
    const filteredInventory = inventoryItems.filter(item => {
      if (!dateRange?.from) return true;
      const itemDate = new Date(item.lastUpdated);
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(new Date());
      return isWithinInterval(itemDate, { start: from, end: to });
    });

    const filteredOrders = orders.filter(order => {
      if (!dateRange?.from) return true;
      const orderDate = new Date(order.date);
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(new Date());
      return isWithinInterval(orderDate, { start: from, end: to });
    });

    const totalStockValue = filteredInventory.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const totalUnitsOnHand = filteredInventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = filteredInventory.filter(item => item.quantity <= item.reorderLevel);
    const outOfStockItems = filteredInventory.filter(item => item.quantity === 0);

    const recentSalesOrders = filteredOrders
      .filter(order => order.type === "Sales")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const recentPurchaseOrders = filteredOrders
      .filter(order => order.type === "Purchase")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const reportProps = {
      companyName: companyProfile?.name || "Fortress Inventory",
      companyAddress: companyProfile?.address || "N/A",
      companyContact: companyProfile?.currency || "N/A",
      companyLogoUrl: localStorage.getItem("companyLogo") || undefined,
      totalStockValue,
      totalUnitsOnHand,
      lowStockItems,
      outOfStockItems,
      recentSalesOrders,
      recentPurchaseOrders,
      reportDate: format(new Date(), "MMM dd, yyyy HH:mm"),
    };

    setCurrentReportData(reportProps);
    onGenerateReport({ pdfProps: reportProps, printType: "dashboard-summary" });
    setReportGenerated(true);
  }, [inventoryItems, orders, dateRange, companyProfile, onGenerateReport]);

  useEffect(() => {
    // Regenerate report if dependencies change
    generateReport();
  }, [generateReport]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Generating report...</span>
      </div>
    );
  }

  if (!reportGenerated || !currentReportData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <FileText className="h-16 w-16 mb-4" />
        <p className="text-lg">Click "Generate Report" to view the summary.</p>
        <Button onClick={generateReport} className="mt-4">Generate Report</Button>
      </div>
    );
  }

  const {
    totalStockValue,
    totalUnitsOnHand,
    lowStockItems,
    outOfStockItems,
    recentSalesOrders,
    recentPurchaseOrders,
  } = currentReportData;

  return (
    <div ref={reportContentRef} className="space-y-6">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Dashboard Summary</CardTitle>
          <p className="text-muted-foreground">
            Overview of key inventory and order metrics.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-500" /> Inventory Value</h3>
            <p className="text-3xl font-bold">${totalStockValue.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Total Units On Hand</h3>
            <p className="text-3xl font-bold">{totalUnitsOnHand.toLocaleString()}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" /> Low Stock Items</h3>
            <p className="text-3xl font-bold text-yellow-500">{lowStockItems.length}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Out of Stock Items</h3>
            <p className="text-3xl font-bold text-destructive">{outOfStockItems.length}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2"><Receipt className="h-5 w-5 text-blue-500" /> Recent Sales Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSalesOrders.length > 0 ? (
            <ScrollArea className="h-40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSalesOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{order.customerSupplier}</TableCell>
                      <TableCell className="text-right">${order.totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground py-4">No recent sales orders.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2"><Package className="h-5 w-5 text-purple-500" /> Recent Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPurchaseOrders.length > 0 ? (
            <ScrollArea className="h-40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPurchaseOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{order.customerSupplier}</TableCell>
                      <TableCell className="text-right">${order.totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground py-4">No recent purchase orders.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSummaryReport;