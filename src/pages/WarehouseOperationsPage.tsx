import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Package, Scan, Truck, CheckCircle, AlertTriangle, LayoutDashboard, Search as SearchIcon, ShoppingCart, QrCode, ListOrdered, Undo2, MapPin } from "lucide-react"; // NEW: Import MapPin
import { useIsMobile } from "@/hooks/use-mobile";
import ItemLookupTool from "@/components/warehouse-operations/ItemLookupTool";
import ReceiveInventoryTool from "@/components/warehouse-operations/ReceiveInventoryTool";
import ShipOrderTool from "@/components/warehouse-operations/ShipOrderTool";
import StockTransferTool from "@/components/warehouse-operations/StockTransferTool";
import CycleCountTool from "@/components/warehouse-operations/CycleCountTool";
import IssueReportTool from "@/components/warehouse-operations/IssueReportTool";
import WarehouseDashboard from "@/components/warehouse-operations/WarehouseDashboard";
import FulfillOrderTool from "@/components/warehouse-operations/FulfillOrderTool";
import CameraScannerDialog from "@/components/CameraScannerDialog";
import PickingWaveManagementTool from "@/components/warehouse-operations/PickingWaveManagementTool";
import ReplenishmentManagementTool from "@/components/warehouse-operations/ReplenishmentManagementTool";
import ShippingVerificationTool from "@/components/warehouse-operations/ShippingVerificationTool";
import ReturnsProcessingTool from "@/components/warehouse-operations/ReturnsProcessingTool";
import { cn } from "@/lib/utils";
import { showError } from "@/utils/toast";
import { useNavigate } from "react-router-dom"; // NEW: Import useNavigate

const WarehouseOperationsPage: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate(); // NEW: Initialize useNavigate
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [onScanCallback, setOnScanCallback] = useState<((scannedData: string) => void) | null>(null);
  const [scannedDataForTool, setScannedDataForTool] = useState<string | null>(null);

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
    // REMOVED: { value: "location-label-generator", label: "Labels", icon: QrCode },
  ];

  const handleScanRequest = (callback: (scannedData: string) => void) => {
    setOnScanCallback(() => callback);
    setIsCameraScannerOpen(true);
  };

  const handleCameraScanResult = (scannedData: string) => {
    setIsCameraScannerOpen(false);
    if (onScanCallback) {
      onScanCallback(scannedData);
      setOnScanCallback(null);
    } else {
      // If no specific tool requested the scan, default to item lookup
      setActiveTab("item-lookup");
      setScannedDataForTool(scannedData);
    }
  };

  const handleCameraScanError = (error: string) => {
    setIsCameraScannerOpen(false);
    setOnScanCallback(null);
    showError(`Camera scan failed: ${error}`);
  };

  const handleGlobalScanClick = () => {
    handleScanRequest((scannedData) => {
      setActiveTab("item-lookup");
      setScannedDataForTool(scannedData);
    });
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

      {/* Global Scan Button */}
      <Button
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3 flex items-center justify-center gap-2 mb-4"
        onClick={handleGlobalScanClick}
      >
        <Scan className="h-6 w-6" />
        Scan Item
      </Button>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
        {/* Grid of buttons for navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4 p-1 bg-muted rounded-lg">
          {operationButtons.map((op) => (
            <Button
              key={op.value}
              variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center h-auto py-3 px-2 text-sm font-medium rounded-md transition-colors text-center",
                activeTab === op.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-muted/50 hover:text-primary"
              )}
              onClick={() => setActiveTab(op.value)}
            >
              <op.icon className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
              <span className="text-xs sm:text-sm">{op.label}</span>
            </Button>
          ))}
          {/* NEW: Button to navigate to Location Management Page */}
          <Button
            variant="ghost"
            className={cn(
              "flex flex-col items-center justify-center h-auto py-3 px-2 text-sm font-medium rounded-md transition-colors text-center",
              location.pathname === "/location-management" // Check if on the new page
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-muted/50 hover:text-primary"
            )}
            onClick={() => navigate("/location-management")}
          >
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
            <span className="text-xs sm:text-sm">Locations</span>
          </Button>
        </div>

        <div className="flex-grow overflow-hidden">
          <TabsContent value="dashboard" className="h-full min-h-0">
            <WarehouseDashboard />
          </TabsContent>
          <TabsContent value="item-lookup" className="h-full min-h-0">
            <ItemLookupTool onScanRequest={handleScanRequest} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="receive-inventory" className="h-full min-h-0">
            <ReceiveInventoryTool onScanRequest={handleScanRequest} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="fulfill-order" className="h-full min-h-0">
            <FulfillOrderTool onScanRequest={handleScanRequest} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="ship-order" className="h-full min-h-0">
            <ShipOrderTool onScanRequest={handleScanRequest} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="picking-wave" className="h-full min-h-0">
            <PickingWaveManagementTool />
          </TabsContent>
          <TabsContent value="replenishment" className="h-full min-h-0">
            <ReplenishmentManagementTool />
          </TabsContent>
          <TabsContent value="shipping-verify" className="h-full min-h-0">
            <ShippingVerificationTool onScanRequest={handleScanRequest} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="returns-process" className="h-full min-h-0">
            <ReturnsProcessingTool onScanRequest={handleScanRequest} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="stock-transfer" className="h-full min-h-0">
            <StockTransferTool onScanRequest={handleScanRequest} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="cycle-count" className="h-full min-h-0">
            <CycleCountTool onScanRequest={handleScanRequest} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="issue-report" className="h-full min-h-0">
            <IssueReportTool onScanRequest={handleScanRequest} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          {/* REMOVED: <TabsContent value="location-label-generator" className="h-full min-h-0">
            <LocationLabelGenerator />
          </TabsContent> */}
        </div>
      </Tabs>

      <CameraScannerDialog
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={handleCameraScanResult}
        onError={handleCameraScanError}
      />
    </div>
  );
};

export default WarehouseOperationsPage;