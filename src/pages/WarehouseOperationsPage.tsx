import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import TabsList and TabsTrigger
import { Package, Scan, Truck, CheckCircle, AlertTriangle, LayoutDashboard, Search as SearchIcon, ShoppingCart, QrCode, ListOrdered, Undo2, MapPin, Camera } from "lucide-react"; // NEW: Import Camera icon
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
import QrScanner, { QrScannerRef } from "@/components/QrScanner"; // NEW: Import QrScanner
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/utils/toast";
import { useNavigate } from "react-router-dom";

const WarehouseOperationsPage: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [scannedDataForTool, setScannedDataForTool] = useState<string | null>(null);
  const [scannerFacingMode, setScannerFacingMode] = useState<"user" | "environment">("environment"); // Default to back camera
  const [isScannerLoading, setIsScannerLoading] = useState(true);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const qrScannerRef = useRef<QrScannerRef>(null);

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
    { value: "scanner", label: "Scan", icon: QrCode }, // NEW: Add scanner tab
  ];

  // Effect to stop scanner when leaving the scanner tab
  useEffect(() => {
    if (activeTab !== "scanner" && qrScannerRef.current) {
      qrScannerRef.current.stopAndClear();
      setIsScannerLoading(true);
      setScannerError(null);
    }
  }, [activeTab]);

  const handleGlobalScanClick = () => {
    setActiveTab("scanner");
    setScannedDataForTool(null); // Clear previous scanned data
  };

  const handleScannedDataProcessed = () => {
    setScannedDataForTool(null);
  };

  const handleScannerScan = (decodedText: string) => {
    setScannedDataForTool(decodedText);
    setActiveTab("item-lookup"); // Automatically switch to item lookup after a scan
    showSuccess(`Scanned: ${decodedText}. Switching to Item Lookup.`);
  };

  const handleScannerError = (errorMessage: string) => {
    setScannerError(errorMessage);
    showError(`Scanner error: ${errorMessage}`);
  };

  const handleScannerReady = () => {
    setIsScannerLoading(false);
    setScannerError(null);
  };

  const toggleFacingMode = () => {
    setScannerFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
    setIsScannerLoading(true);
    setScannerError(null);
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
        <TabsList className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mb-4 p-1 bg-muted rounded-lg overflow-x-auto"> {/* Added overflow-x-auto */}
          {operationButtons.map((op) => (
            <TabsTrigger
              key={op.value}
              value={op.value}
              className={cn(
                "flex flex-col items-center justify-center h-auto py-3 px-2 text-sm font-medium rounded-md transition-colors text-center",
                activeTab === op.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-muted/50 hover:text-primary"
              )}
            >
              <op.icon className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
              <span className="text-xs sm:text-sm">{op.label}</span>
            </TabsTrigger>
          ))}
          {/* Button to navigate to Location Management Page */}
          <Button
            variant="ghost"
            className={cn(
              "flex flex-col items-center justify-center h-auto py-3 px-2 text-sm font-medium rounded-md transition-colors text-center",
              location.pathname === "/location-management"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-muted/50 hover:text-primary"
            )}
            onClick={() => navigate("/location-management")}
          >
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
            <span className="text-xs sm:text-sm">Locations</span>
          </Button>
        </TabsList>

        <div className="flex-grow overflow-hidden">
          <TabsContent value="dashboard" className="h-full min-h-0">
            <WarehouseDashboard />
          </TabsContent>
          <TabsContent value="item-lookup" className="h-full min-h-0">
            <ItemLookupTool onScanRequest={handleGlobalScanClick} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="receive-inventory" className="h-full min-h-0">
            <ReceiveInventoryTool onScanRequest={handleGlobalScanClick} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="fulfill-order" className="h-full min-h-0">
            <FulfillOrderTool onScanRequest={handleGlobalScanClick} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="ship-order" className="h-full min-h-0">
            <ShipOrderTool onScanRequest={handleGlobalScanClick} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="picking-wave" className="h-full min-h-0">
            <PickingWaveManagementTool />
          </TabsContent>
          <TabsContent value="replenishment" className="h-full min-h-0">
            <ReplenishmentManagementTool />
          </TabsContent>
          <TabsContent value="shipping-verify" className="h-full min-h-0">
            <ShippingVerificationTool onScanRequest={handleGlobalScanClick} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="returns-process" className="h-full min-h-0">
            <ReturnsProcessingTool onScanRequest={handleGlobalScanClick} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="stock-transfer" className="h-full min-h-0">
            <StockTransferTool onScanRequest={handleGlobalScanClick} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="cycle-count" className="h-full min-h-0">
            <CycleCountTool onScanRequest={handleGlobalScanClick} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          <TabsContent value="issue-report" className="h-full min-h-0">
            <IssueReportTool onScanRequest={handleGlobalScanClick} scannedDataFromGlobal={scannedDataForTool} onScannedDataProcessed={handleScannedDataProcessed} />
          </TabsContent>
          {/* NEW: Scanner Tab Content */}
          <TabsContent value="scanner" className="h-full min-h-0 flex flex-col">
            <Card className="flex-grow flex flex-col bg-card border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" /> Live Scanner
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col items-center justify-center bg-black rounded-md overflow-hidden relative my-4">
                {isScannerLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-lg z-10">
                    Loading camera...
                  </div>
                )}
                {scannerError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/70 text-white text-center p-4 z-10">
                    <XCircle className="h-8 w-8 mb-2" />
                    <p className="font-semibold">Camera Error:</p>
                    <p className="text-sm">{scannerError}</p>
                    <p className="text-xs mt-2">Try switching cameras or refreshing the page.</p>
                  </div>
                )}
                <QrScanner
                  key={scannerFacingMode} // Key changes when facingMode changes, forcing remount
                  ref={qrScannerRef}
                  onScan={handleScannerScan}
                  onError={handleScannerError}
                  onReady={handleScannerReady}
                  facingMode={scannerFacingMode}
                />
              </CardContent>
              <div className="flex justify-center mt-auto p-4">
                <Button variant="secondary" onClick={toggleFacingMode} className="w-full">
                  <Camera className="h-4 w-4 mr-2" /> Switch to {scannerFacingMode === "user" ? "Back" : "Front"} Camera
                </Button>
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default WarehouseOperationsPage;