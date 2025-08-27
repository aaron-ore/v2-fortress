import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch"; // NEW: Import Switch
import ConfirmDialog from "@/components/ConfirmDialog";
import { showSuccess, showError } from "@/utils/toast";
import { useInventory, InventoryItem } from "@/context/InventoryContext";
import { useStockMovement } from "@/context/StockMovementContext";
import { useOrders } from "@/context/OrdersContext"; // NEW: Import useOrders
import { useVendors } from "@/context/VendorContext"; // NEW: Import useVendors
import { processAutoReorder } from "@/utils/autoReorderLogic"; // NEW: Import autoReorderLogic
import { useNavigate } from "react-router-dom";
import { Package, Tag, Scale, DollarSign, ArrowUp, ArrowDown, Trash2, History, Repeat } from "lucide-react"; // NEW: Import Repeat icon
import { format } from "date-fns";

interface InventoryItemQuickViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

const adjustmentReasons = [
  "Received",
  "Damaged",
  "Lost",
  "Returned",
  "Cycle Count Adjustment",
  "Other",
];

const InventoryItemQuickViewDialog: React.FC<InventoryItemQuickViewDialogProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const { inventoryItems, updateInventoryItem, deleteInventoryItem, refreshInventory } = useInventory();
  const { stockMovements, addStockMovement, fetchStockMovements } = useStockMovement();
  const { addOrder } = useOrders(); // NEW: Use addOrder
  const { vendors } = useVendors(); // NEW: Use vendors
  const navigate = useNavigate();

  const currentItem = useMemo(() => {
    return item ? inventoryItems.find(invItem => invItem.id === item.id) : null;
  }, [item, inventoryItems]);

  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(false); // NEW: State for auto-reorder
  const [autoReorderQuantity, setAutoReorderQuantity] = useState(""); // NEW: State for auto-reorder quantity

  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

  // Filter stock movements for the current item
  const itemStockMovements = useMemo(() => {
    return stockMovements
      .filter(movement => movement.itemId === currentItem?.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [stockMovements, currentItem]);

  useEffect(() => {
    if (isOpen) {
      setAdjustmentAmount("");
      setAdjustmentType("add");
      setAdjustmentReason("");
      if (currentItem) {
        fetchStockMovements(currentItem.id);
        setAutoReorderEnabled(currentItem.autoReorderEnabled); // Set new field
        setAutoReorderQuantity(currentItem.autoReorderQuantity.toString()); // Set new field
      }
    }
  }, [isOpen, currentItem, fetchStockMovements]);

  const handleAdjustStock = async () => {
    if (!currentItem) return;

    const amount = parseInt(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      showError("Please enter a valid positive number for adjustment.");
      return;
    }
    if (!adjustmentReason) {
      showError("Please select a reason for the stock adjustment.");
      return;
    }

    let newQuantity = currentItem.quantity;
    const oldQuantity = currentItem.quantity;
    if (adjustmentType === "add") {
      newQuantity += amount;
    } else {
      if (newQuantity < amount) {
        showError("Cannot subtract more than available stock.");
        return;
      }
      newQuantity -= amount;
    }

    const updatedItem: InventoryItem = {
      ...currentItem,
      quantity: newQuantity,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    await updateInventoryItem(updatedItem);

    // Log stock movement
    await addStockMovement({
      itemId: currentItem.id,
      itemName: currentItem.name,
      type: adjustmentType,
      amount: amount,
      oldQuantity: oldQuantity,
      newQuantity: newQuantity,
      reason: adjustmentReason,
    });

    await refreshInventory();
    showSuccess(`Stock for ${currentItem.name} adjusted by ${adjustmentType === 'add' ? '+' : '-'}${amount} due to: ${adjustmentReason}. New quantity: ${newQuantity}.`);
    onClose();
  };

  const handleToggleAutoReorder = async (checked: boolean) => {
    if (!currentItem) return;
    setAutoReorderEnabled(checked);

    const parsedAutoReorderQuantity = parseInt(autoReorderQuantity) || 0;
    if (checked && (isNaN(parsedAutoReorderQuantity) || parsedAutoReorderQuantity <= 0)) {
      showError("Please set a valid positive quantity for auto-reorder before enabling.");
      setAutoReorderEnabled(false); // Revert toggle if invalid
      return;
    }

    const updatedItem: InventoryItem = {
      ...currentItem,
      autoReorderEnabled: checked,
      autoReorderQuantity: parsedAutoReorderQuantity,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    await updateInventoryItem(updatedItem);
    showSuccess(`Auto-reorder for ${currentItem.name} ${checked ? "enabled" : "disabled"}.`);
  };

  const handleAutoReorderQuantityChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentItem) return;
    const newQty = parseInt(e.target.value) || 0;
    setAutoReorderQuantity(e.target.value);

    if (newQty > 0) {
      const updatedItem: InventoryItem = {
        ...currentItem,
        autoReorderQuantity: newQty,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      await updateInventoryItem(updatedItem);
      showSuccess(`Auto-reorder quantity for ${currentItem.name} updated to ${newQty}.`);
    }
  };

  const handleManualReorder = async () => {
    if (!currentItem || !currentItem.vendorId) {
      showError("Cannot manually reorder: Item or vendor not specified.");
      return;
    }
    if (currentItem.autoReorderQuantity <= 0) {
      showError("Please set a positive auto-reorder quantity before manually reordering.");
      return;
    }

    const vendor = vendors.find(v => v.id === currentItem.vendorId);
    if (!vendor) {
      showError(`Cannot manually reorder: Vendor for ${currentItem.name} not found.`);
      return;
    }

    const poItems: POItem[] = [{
      id: Date.now(),
      itemName: currentItem.name,
      quantity: currentItem.autoReorderQuantity,
      unitPrice: currentItem.unitCost,
      inventoryItemId: currentItem.id,
    }];

    const newPoNumber = `PO${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`; // Simple mock PO number
    const totalAmount = poItems.reduce((sum, poItem) => sum + poItem.quantity * poItem.unitPrice, 0);

    const newPurchaseOrder: Omit<OrderItem, "id" | "organizationId"> = {
      id: newPoNumber,
      type: "Purchase",
      customerSupplier: vendor.name,
      date: new Date().toISOString().split("T")[0],
      status: "New Order",
      totalAmount: totalAmount,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      itemCount: poItems.length,
      notes: `Manually triggered reorder for ${currentItem.name}.`,
      orderType: "Wholesale",
      shippingMethod: "Standard",
      items: poItems,
      terms: "Net 30",
    };

    try {
      await addOrder(newPurchaseOrder);
      showSuccess(`Manual reorder placed for ${currentItem.name} (PO: ${newPoNumber}). Email simulated to ${vendor.email || 'vendor'}.`);
      // Simulate email sending
      console.log(`Simulating email to ${vendor.email} for PO ${newPoNumber} with items:`, poItems);
      onClose();
    } catch (error: any) {
      showError(`Failed to place manual reorder: ${error.message}`);
    }
  };

  const handleDeleteItemClick = () => {
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (!currentItem) return;
    await deleteInventoryItem(currentItem.id);
    showSuccess(`${currentItem.name} has been deleted.`);
    setIsConfirmDeleteDialogOpen(false);
    onClose();
  };

  const handleViewFullDetails = () => {
    if (currentItem) {
      navigate(`/inventory/${currentItem.id}`);
      onClose();
    }
  };

  if (!currentItem) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> {currentItem.name}
          </DialogTitle>
          <DialogDescription>
            Quick overview and stock adjustment for this item.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Product Image */}
          <div className="flex justify-center mb-4">
            {currentItem.imageUrl ? (
              <img src={currentItem.imageUrl} alt={currentItem.name} className="max-h-48 max-w-full object-contain rounded-md border border-border" />
            ) : (
              <div className="h-48 w-48 bg-muted/30 rounded-md flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>

          {/* Basic Item Info */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">SKU:</span> {currentItem.sku}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Item ID:</span> {currentItem.id}
            </div>
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Category:</span> {currentItem.category}
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Retail Price:</span> ${currentItem.retailPrice.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <span className="font-semibold text-lg text-foreground">Current Stock: {currentItem.quantity} units</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ml-2 ${
                  currentItem.status === "In Stock"
                    ? "bg-green-500/20 text-green-400"
                    : currentItem.status === "Low Stock"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {currentItem.status}
              </span>
            </div>
            {currentItem.barcodeUrl && (
              <div className="col-span-2 mt-2 p-2 border border-border rounded-md bg-muted/20 flex justify-center">
                <div dangerouslySetInnerHTML={{ __html: currentItem.barcodeUrl }} />
              </div>
            )}
          </div>

          {/* Stock Adjustment Section */}
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-lg font-semibold mb-3">Adjust Stock</h3>
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="adjustmentAmount">Adjustment Quantity</Label>
                <Input
                  id="adjustmentAmount"
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="e.g., 10"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <RadioGroup
                  value={adjustmentType}
                  onValueChange={(value: "add" | "subtract") => setAdjustmentType(value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="add" id="add-stock" />
                    <Label htmlFor="add-stock" className="flex items-center gap-1">
                      <ArrowUp className="h-4 w-4 text-green-500" /> Add Stock
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="subtract" id="subtract-stock" />
                    <Label htmlFor="subtract-stock" className="flex items-center gap-1">
                      <ArrowDown className="h-4 w-4 text-red-500" /> Remove Stock
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustmentReason">Reason</Label>
                <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                  <SelectTrigger id="adjustmentReason">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {adjustmentReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdjustStock} className="w-full mt-2">
                Apply Adjustment
              </Button>
            </div>
          </div>

          {/* NEW: Auto-Reorder Settings */}
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Repeat className="h-5 w-5 text-primary" /> Auto-Reorder Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="autoReorderEnabled">Enable Auto-Reorder</Label>
                <Switch
                  id="autoReorderEnabled"
                  checked={autoReorderEnabled}
                  onCheckedChange={handleToggleAutoReorder}
                />
              </div>
              {autoReorderEnabled && (
                <div className="space-y-2 mt-2">
                  <Label htmlFor="autoReorderQuantity">Quantity to Auto-Reorder</Label>
                  <Input
                    id="autoReorderQuantity"
                    type="number"
                    value={autoReorderQuantity}
                    onChange={handleAutoReorderQuantityChange}
                    placeholder="e.g., 50"
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    This quantity will be ordered when stock drops to or below the reorder level.
                  </p>
                </div>
              )}
              <Button
                onClick={handleManualReorder}
                className="w-full mt-2"
                disabled={!currentItem.vendorId || currentItem.autoReorderQuantity <= 0}
              >
                Manually Reorder Now
              </Button>
            </div>
          </div>

          {/* Stock Movement History */}
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" /> Stock Movement History
            </h3>
            {itemStockMovements.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {itemStockMovements.map((movement) => (
                  <li key={movement.id} className="flex justify-between items-center p-2 bg-muted/10 rounded-md">
                    <span className="flex items-center gap-2">
                      {movement.type === "add" ? (
                        <ArrowUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">
                        {movement.type === "add" ? "+" : "-"}
                        {movement.amount} units
                      </span>
                      <span className="text-muted-foreground">({movement.reason})</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(movement.timestamp), "MMM dd, HH:mm")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-4">No stock movement history for this item.</p>
            )}
          </div>
        </div>
        <DialogFooter className="flex justify-between items-center mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex space-x-2">
            <Button variant="destructive" onClick={handleDeleteItemClick}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete Item
            </Button>
            <Button variant="secondary" onClick={handleViewFullDetails}>
              View Full Details
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
      {currentItem && (
        <ConfirmDialog
          isOpen={isConfirmDeleteDialogOpen}
          onClose={() => setIsConfirmDeleteDialogOpen(false)}
          onConfirm={confirmDeleteItem}
          title="Confirm Item Deletion"
          description={`Are you sure you want to delete "${currentItem.name}" (SKU: ${currentItem.sku})? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </Dialog>
  );
};

export default InventoryItemQuickViewDialog;