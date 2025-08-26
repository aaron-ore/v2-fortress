import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, Package, MapPin, Barcode } from "lucide-react";
import { useInventory } from "@/context/InventoryContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useStockMovement } from "@/context/StockMovementContext";
import { showError, showSuccess } from "@/utils/toast";

interface CountedItem {
  id: string;
  name: string;
  sku: string;
  systemQuantity: number;
  countedQuantity: number;
  location: string;
  isScanned: boolean;
  barcodeUrl?: string; // Include barcodeUrl for matching
}

interface CycleCountToolProps {
  onScanRequest: (callback: (scannedData: string) => void) => void;
  scannedDataFromGlobal?: string | null;
  onScannedDataProcessed: () => void;
}

const CycleCountTool: React.FC<CycleCountToolProps> = ({ onScanRequest, scannedDataFromGlobal, onScannedDataProcessed }) => {
  const { inventoryItems, updateInventoryItem, refreshInventory } = useInventory();
  const { locations } = useOnboarding();
  const { addStockMovement } = useStockMovement();

  const [selectedLocation, setSelectedLocation] = useState("all");
  const [itemsToCount, setItemsToCount] = useState<CountedItem[]>([]);
  const [isCounting, setIsCounting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const filteredInventory = useMemo(() => {
    if (selectedLocation === "all") return inventoryItems;
    return inventoryItems.filter(item => item.location === selectedLocation);
  }, [inventoryItems, selectedLocation]);

  useEffect(() => {
    if (!isCounting) {
      setItemsToCount([]);
    }
  }, [isCounting]);

  useEffect(() => {
    if (scannedDataFromGlobal && !isScanning && isCounting) {
      handleScannedBarcode(scannedDataFromGlobal);
      onScannedDataProcessed();
    }
  }, [scannedDataFromGlobal, isScanning, isCounting, onScannedDataProcessed]);

  const startCycleCount = () => {
    if (filteredInventory.length === 0) {
      showError("No items found for the selected location to start a cycle count.");
      return;
    }
    const initialItems: CountedItem[] = filteredInventory.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      systemQuantity: item.quantity,
      countedQuantity: 0,
      location: item.location,
      isScanned: false,
      barcodeUrl: item.barcodeUrl, // Pass barcodeUrl
    }));
    setItemsToCount(initialItems);
    setIsCounting(true);
    showSuccess(`Cycle count started for ${selectedLocation === "all" ? "all locations" : selectedLocation}.`);
  };

  const handleCountedQuantityChange = (itemId: string, quantity: string) => {
    setItemsToCount(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, countedQuantity: parseInt(quantity) || 0 } : item
      )
    );
  };

  const handleScannedBarcode = (scannedData: string) => {
    setIsScanning(false);
    if (!isCounting) {
      showError("Please start a cycle count before scanning items.");
      return;
    }

    const lowerCaseScannedData = scannedData.toLowerCase();
    const scannedItem = itemsToCount.find(
      item => item.sku.toLowerCase() === lowerCaseScannedData ||
               (item.barcodeUrl && item.barcodeUrl.toLowerCase().includes(lowerCaseScannedData))
    );

    if (scannedItem) {
      setItemsToCount(prev =>
        prev.map(item =>
          item.id === scannedItem.id ? { ...item, isScanned: true, countedQuantity: item.countedQuantity + 1 } : item
        )
      );
      showSuccess(`Scanned: ${scannedItem.name}. Count increased.`);
    } else {
      showError(`Item with SKU/Barcode "${scannedData}" not found in this count.`);
    }
  };

  const handleScanClick = () => {
    setIsScanning(true);
    onScanRequest(handleScannedBarcode);
  };

  const completeCycleCount = async () => {
    let adjustmentsMade = 0;
    for (const item of itemsToCount) {
      if (item.systemQuantity !== item.countedQuantity) {
        const inventoryItem = inventoryItems.find(inv => inv.id === item.id);
        if (inventoryItem) {
          const oldQuantity = inventoryItem.quantity;
          const newQuantity = item.countedQuantity;
          const adjustmentAmount = Math.abs(newQuantity - oldQuantity);
          const adjustmentType = newQuantity > oldQuantity ? "add" : "subtract";

          const updatedInventoryItem = {
            ...inventoryItem,
            quantity: newQuantity,
            lastUpdated: new Date().toISOString().split('T')[0],
          };
          await updateInventoryItem(updatedInventoryItem);
          await addStockMovement({
            itemId: inventoryItem.id,
            itemName: inventoryItem.name,
            type: adjustmentType,
            amount: adjustmentAmount,
            oldQuantity: oldQuantity,
            newQuantity: newQuantity,
            reason: `Cycle Count Adjustment (${selectedLocation})`,
          });
          adjustmentsMade++;
        }
      }
    }
    showSuccess(`Cycle count completed. ${adjustmentsMade} adjustments made.`);
    refreshInventory();
    setIsCounting(false);
    setItemsToCount([]);
    setSelectedLocation("all");
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <h2 className="text-xl font-bold text-center">Cycle Counting</h2>

      {!isCounting ? (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Select Location
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locationSelect" className="font-semibold">Location to Count</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger id="locationSelect">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={startCycleCount} className="w-full" disabled={filteredInventory.length === 0}>
              Start Cycle Count
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3 flex items-center justify-center gap-2"
            onClick={handleScanClick}
            disabled={isScanning}
          >
            <Barcode className="h-6 w-6" />
            {isScanning ? "Scanning..." : "Scan Item"}
          </Button>

          <ScrollArea className="flex-grow pb-4">
            <div className="space-y-3">
              {itemsToCount.map(item => (
                <Card key={item.id} className="bg-card border-border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <span className="text-sm text-muted-foreground">SKU: {item.sku}</span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">System Qty: {item.systemQuantity}</p>
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`counted-qty-${item.id}`} className="font-semibold">Counted Qty:</Label>
                      <Input
                        id={`counted-qty-${item.id}`}
                        type="number"
                        value={item.countedQuantity === 0 ? "" : item.countedQuantity}
                        onChange={(e) => handleCountedQuantityChange(item.id, e.target.value)}
                        className="w-24 text-right"
                        min="0"
                      />
                    </div>
                    {item.systemQuantity !== item.countedQuantity && item.countedQuantity !== 0 && (
                      <p className="text-sm text-destructive mt-2">
                        Discrepancy: {Math.abs(item.systemQuantity - item.countedQuantity)} units
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setIsCounting(false)} className="flex-grow">
              Cancel Count
            </Button>
            <Button onClick={completeCycleCount} className="flex-grow">
              Complete Count
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default CycleCountTool;