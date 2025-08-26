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
import ConfirmDialog from "@/components/ConfirmDialog";
import { showSuccess, showError } from "@/utils/toast";
import { useInventory, InventoryItem } from "@/context/InventoryContext";
import { useStockMovement } from "@/context/StockMovementContext"; // New import
import { useNavigate } from "react-router-dom";
import { Package, Tag, Scale, DollarSign, ArrowUp, ArrowDown, Trash2, History } from "lucide-react";
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
  const { stockMovements, addStockMovement, fetchStockMovements } = useStockMovement(); // Use stock movement context
  const navigate = useNavigate();

  const currentItem = useMemo(() => {
    return item ? inventoryItems.find(invItem => invItem.id === item.id) : null;
  }, [item, inventoryItems]);

  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add");
  const [adjustmentReason, setAdjustmentReason] = useState("");

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
        fetchStockMovements(currentItem.id); // Fetch movements for this specific item
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