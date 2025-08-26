import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { usePrint } from "@/context/PrintContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useInventory } from "@/context/InventoryContext";
import { useOrders } from "@/context/OrdersContext";
import { showError } from "@/utils/toast";
import { format } from "date-fns";

const GenerateReportButton: React.FC = () => {
  const { initiatePrint } = usePrint();
  const { companyProfile } = useOnboarding();
  const { inventoryItems } = useInventory();
  const { orders } = useOrders();

  const totalStockValue = useMemo(() => {
    return inventoryItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  }, [inventoryItems]);

  const totalUnitsOnHand = useMemo(() => {
    return inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [inventoryItems]);

  const lowStockItems = useMemo(() => {
    return inventoryItems.filter(item => item.quantity <= item.reorderLevel);
  }, [inventoryItems]);

  const outOfStockItems = useMemo(() => {
    return inventoryItems.filter(item => item.quantity === 0);
  }, [inventoryItems]);

  const recentSalesOrders = useMemo(() => {
    return orders
      .filter(order => order.type === "Sales")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5); // Get top 5 recent sales orders
  }, [orders]);

  const recentPurchaseOrders = useMemo(() => {
    return orders
      .filter(order => order.type === "Purchase")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5); // Get top 5 recent purchase orders
  }, [orders]);

  const handleGenerateReport = () => {
    if (!companyProfile) {
      showError("Company profile not set up. Please complete onboarding or set company details in settings.");
      return;
    }

    const reportProps = {
      companyName: companyProfile.name,
      companyAddress: companyProfile.address,
      companyContact: companyProfile.currency, // Using currency as a generic contact for company
      companyLogoUrl: localStorage.getItem("companyLogo") || undefined,
      totalStockValue,
      totalUnitsOnHand,
      lowStockItems,
      outOfStockItems,
      recentSalesOrders,
      recentPurchaseOrders,
      reportDate: format(new Date(), "MMM dd, yyyy HH:mm"),
    };

    initiatePrint({ type: "dashboard-summary", props: reportProps });
  };

  return (
    <Button className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold" onClick={handleGenerateReport}> {/* Adjusted height to h-10 (40px) */}
      <Printer className="h-4 w-4 mr-2" /> Generate Report
    </Button>
  );
};

export default GenerateReportButton;