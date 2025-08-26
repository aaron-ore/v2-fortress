import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Package, Scan, Truck, CheckCircle, AlertTriangle, LayoutDashboard, Search as SearchIcon, ShoppingCart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import ItemLookupTool from "@/components/warehouse-operations/ItemLookupTool";
import ReceiveInventoryTool from "@/components/warehouse-operations/ReceiveInventoryTool";
import ShipOrderTool from "@/components/warehouse-operations/ShipOrderTool";
import StockTransferTool from "@/components/warehouse-operations/StockTransferTool";
import CycleCountTool from "@/components/warehouse-operations/CycleCountTool";
import IssueReportTool from "@/components/warehouse-operations/IssueReportTool";
import WarehouseDashboard from "@/components/warehouse-operations/WarehouseDashboard";
import FulfillOrderTool from "@/components/warehouse-operations/FulfillOrderTool"; // New import
import CameraScannerDialog from "@/components/CameraScannerDialog"; // New import
import { cn } from "@/lib/utils";
import { showError } from "@/utils/toast";

const WarehouseOperationsPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [onScanCallback, setOnScanCallback] = useState<((scannedData: string) => void) | null>(null);
  const [scannedDataForTool, setScannedDataForTool] = useState<string | null>(null);

  const operationButtons = [
    { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { value: "item-lookup", label: "Lookup", icon: SearchIcon },
    { value: "receive-inventory", label: "Receive", icon: Package },
    { value: "fulfill-order", label: "Fulfill", icon: ShoppingCart }, // New Fulfill Order button
    { value: "ship-order", label: "Ship", icon: Truck },
    { value: "stock-transfer", label: "Transfer", icon: Scan },
    { value: "cycle-count", label: "Count", icon: CheckCircle },
    { value: "issue-report", label: "Report Issue", icon: AlertTriangle },
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
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4 p-1 bg-muted rounded-lg">
          {operationButtons.map((op) => (
            <Button
              key={op.value}
              variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center h-auto py-3 px-2 text-sm font-medium rounded-md transition-colors",
                activeTab === op.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-300 hover:bg-muted/50 hover:text-primary"
              )}
              onClick={() => setActiveTab(op.value)}
            >
              <op.icon className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
              {op.label}
            </Button>
          ))}
        </div>

        <div className="flex-grow overflow-hidden">
          <TabsContent value="dashboard" className="h-full">
            <WarehouseDashboard />
          </TabsContent>
          <TabsContent value="item-lookup" className="h-full">
            <ItemLookupTool onScanRequest={handleScanRequest} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="receive-inventory" className="h-full">
            <ReceiveInventoryTool onScanRequest={handleScanRequest} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="fulfill-order" className="h-full"> {/* New TabContent */}
            <FulfillOrderTool onScanRequest={handleScanRequest} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="ship-order" className="h-full">
            <ShipOrderTool onScanRequest={handleScanRequest} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="stock-transfer" className="h-full">
            <StockTransferTool onScanRequest={handleScanRequest} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="cycle-count" className="h-full">
            <CycleCountTool onScanRequest={handleScanRequest} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="issue-report" className="h-full">
            <IssueReportTool onScanRequest={handleScanRequest} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
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