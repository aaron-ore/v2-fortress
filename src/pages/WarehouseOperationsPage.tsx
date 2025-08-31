import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Package, Scan, Truck, CheckCircle, AlertTriangle, LayoutDashboard, Search as SearchIcon, ShoppingCart, ListOrdered, Undo2, MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import ItemLookupTool from "@/components/warehouse-operations/ItemLookupTool";
import ReceiveInventoryTool from "@/components/warehouse-operations/ReceiveInventoryTool";
import ShipOrderTool from "@/components/warehouse-operations/ShipOrderTool";
import StockTransferTool from "@/components/warehouse-operations/StockTransferTool";
import CycleCountTool from "@/components/warehouse-operations/CycleCountTool";
import IssueReportTool from "@/components/warehouse-operations/IssueReportTool";
import WarehouseDashboard from "@/components/warehouse-operations/WarehouseDashboard";
import FulfillOrderTool from "@/components/warehouse-operations/FulfillOrderTool";
import PickingWaveManagementTool from "@/components/warehouse-operations/PickingWaveManagementTool";
import ReplenishmentManagementTool from "@/components/warehouse-operations/ReplenishmentManagementTool";
import ShippingVerificationTool from "@/components/warehouse-operations/ShippingVerificationTool";
import ReturnsProcessingTool from "@/components/warehouse-operations/ReturnsProcessingTool";
import CameraScannerDialog from "@/components/CameraScannerDialog"; // NEW: Import CameraScannerDialog
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/utils/toast";
import { useNavigate, useLocation } from "react-router-dom";

const WarehouseOperationsPage: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [scannedDataForTool, setScannedDataForTool] = useState<string | null>(null);
  const [isCameraScannerDialogOpen, setIsCameraScannerDialogOpen] = useState(false); // NEW: State for dialog
  const [scanCallback, setScanCallback] = useState<((scannedData: string) => void) | null>(null); // NEW: Callback for specific tool

  const operationButtons = [
    { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { value: "item-lookup", label: "Lookup", icon: SearchIcon },
    { value: "receive-inventory", label: "Receive", icon: Package },
    { value: "fulfill-order", label: "Fulfill", icon: ShoppingCart },
    { value: "ship-order", label: "Ship", icon: Truck },
    { value: "picking-wave", label: "Pick Wave", icon: ListOrdered },
    { value: "replenishment", label: "Replenish", icon: CheckCircle },
    { value: "shipping-verify", label: "Verify Ship", icon: Truck },
    { value: "returns-process", label: "Returns", icon: Undo2 },
    { value: "stock-transfer", label: "Transfer", icon: Scan },
    { value: "cycle-count", label: "Count", icon: CheckCircle },
    { value: "issue-report", label: "Report Issue", icon: AlertTriangle },
    { value: "location-management", label: "Locations", icon: MapPin, isPageLink: true },
  ];

  // NEW: Function to open scanner dialog and set a callback
  const requestScan = (callback: (scannedData: string) => void) => {
    setScanCallback(() => callback); // Store the callback
    setIsCameraScannerDialogOpen(true); // Open the dialog
  };

  // NEW: Handle successful scan from the dialog
  const handleScanSuccessFromDialog = (decodedText: string) => {
    if (scanCallback) {
      scanCallback(decodedText); // Call the tool-specific callback
      setScanCallback(null); // Clear the callback
    } else {
      // If no specific tool requested, default to item lookup
      setScannedDataForTool(decodedText);
      setActiveTab("item-lookup");
      showSuccess(`Scanned: ${decodedText}. Switching to Item Lookup.`);
    }
    setIsCameraScannerDialogOpen(false); // Close the dialog
  };

  // NEW: Handle dialog close (e.g., user clicks outside or presses escape)
  const handleCameraScannerDialogClose = () => {
    setIsCameraScannerDialogOpen(false);
    setScanCallback(null); // Clear any pending callback
  };

  const handleScannedDataProcessed = () => {
    setScannedDataForTool(null);
  };

  if (!isMobile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center bg-card border-border">
          <CardHeader className="flex flex-col items-center gap-2">
            <Scan className="h-10 w-10 text-primary" />
            <CardTitle className="text-2xl font-bold mb-2">Warehouse Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This page is optimized for mobile devices and smaller screens. Please access it from a mobile device or resize your browser window.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full p-4 bg-background text-foreground">
      <h1 className="text-2xl font-bold text-center mb-6">Warehouse Operations</h1>

      {/* Global Scan Button - now opens the dialog */}
      <Button
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3 flex items-center justify-center gap-2 mb-4"
        onClick={() => requestScan(() => {})} // Pass a dummy callback for global scan
      >
        <Scan className="h-6 w-6" />
        Scan Item
      </Button>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
        {/* Grid of square buttons for navigation */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4 p-1 bg-muted rounded-lg overflow-x-auto">
          {operationButtons.map((op) => (
            <Button
              key={op.value}
              variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center h-24 w-full aspect-square py-3 px-2 text-sm font-medium rounded-lg transition-colors text-center",
                op.value === activeTab || (op.isPageLink && location.pathname === `/${op.value}`)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-muted/50 hover:text-primary"
              )}
              onClick={() => {
                if (op.isPageLink) {
                  navigate(`/${op.value}`);
                } else {
                  setActiveTab(op.value);
                }
              }}
            >
              <op.icon className="h-6 w-6 sm:h-7 sm:w-7 mb-1" />
              <span className="text-xs sm:text-sm font-semibold">{op.label}</span>
            </Button>
          ))}
        </div>

        <div className="flex-grow overflow-hidden">
          <TabsContent value="dashboard" className="h-full min-h-0">
            <WarehouseDashboard />
          </TabsContent>
          <TabsContent value="item-lookup" className="h-full min-h-0">
            <ItemLookupTool onScanRequest={requestScan} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="receive-inventory" className="h-full min-h-0">
            <ReceiveInventoryTool onScanRequest={requestScan} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="fulfill-order" className="h-full min-h-0">
            <FulfillOrderTool onScanRequest={requestScan} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="ship-order" className="h-full min-h-0">
            <ShipOrderTool onScanRequest={requestScan} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="picking-wave" className="h-full min-h-0">
            <PickingWaveManagementTool />
          </TabsContent>
          <TabsContent value="replenishment" className="h-full min-h-0">
            <ReplenishmentManagementTool />
          </TabsContent>
          <TabsContent value="shipping-verify" className="h-full min-h-0">
            <ShippingVerificationTool onScanRequest={requestScan} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="returns-process" className="h-full min-h-0">
            <ReturnsProcessingTool onScanRequest={requestScan} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="stock-transfer" className="h-full min-h-0">
            <StockTransferTool onScanRequest={requestScan} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="cycle-count" className="h-full min-h-0">
            <CycleCountTool onScanRequest={requestScan} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="issue-report" className="h-full min-h-0">
            <IssueReportTool onScanRequest={requestScan} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
        </div>
      </Tabs>

      {/* NEW: Camera Scanner Dialog */}
      <CameraScannerDialog
        isOpen={isCameraScannerDialogOpen}
        onClose={handleCameraScannerDialogClose}
        onScanSuccess={handleScanSuccessFromDialog}
      />
    </div>
  );
};

export default WarehouseOperationsPage;