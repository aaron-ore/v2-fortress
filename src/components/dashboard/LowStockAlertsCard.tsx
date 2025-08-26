import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, ArrowRight } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import SupplierInfoDialog from "@/components/SupplierInfoDialog";
import { useNotifications } from "@/context/NotificationContext";
import { useInventory } from "@/context/InventoryContext";

const LowStockAlertsCard: React.FC = () => {
  const { addNotification } = useNotifications();
  const { inventoryItems } = useInventory();
  const [isSupplierInfoDialogOpen, setIsSupplierInfoDialogOpen] = useState(false);
  const [selectedItemForSupplier, setSelectedItemForSupplier] = useState<{ name: string; sku: string } | null>(null);

  const lowStockItems = useMemo(() => {
    return inventoryItems.filter(item => item.quantity <= item.reorderLevel);
  }, [inventoryItems]);

  const handleReorder = (itemName: string, itemSku: string) => {
    setSelectedItemForSupplier({ name: itemName, sku: itemSku });
    setIsSupplierInfoDialogOpen(true);
    addNotification(`Reorder initiated for ${itemName} (SKU: ${itemSku}).`, "info");
  };

  return (
    <Card className="bg-card border-border rounded-lg shadow-sm p-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold text-foreground">Low Stock Alerts</CardTitle>
        <Bell className="h-4 w-4 text-red-500" />
      </CardHeader>
      <CardContent className="p-4 pt-0 flex flex-col justify-between h-full">
        {lowStockItems.length > 0 ? (
          <ul className="text-sm space-y-2">
            {lowStockItems.slice(0, 3).map(item => (
              <li key={item.id} className="flex items-center justify-between">
                <span>{item.name} <span className="text-red-400">({item.quantity} units)</span></span>
                <Button variant="link" size="sm" onClick={() => handleReorder(item.name, item.sku)} className="text-primary">Reorder</Button>
              </li>
            ))}
            {lowStockItems.length > 3 && (
              <li className="text-center text-xs text-muted-foreground mt-2">
                ...and {lowStockItems.length - 3} more items
              </li>
            )}
          </ul>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4">No low stock items currently. Good job!</p>
        )}
        <Button className="w-full mt-auto" onClick={() => lowStockItems.length > 0 ? handleReorder("Multiple Items", "N/A") : showSuccess("No items to reorder.")} disabled={lowStockItems.length === 0}>
          Reorder Now <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>

      {selectedItemForSupplier && (
        <SupplierInfoDialog
          isOpen={isSupplierInfoDialogOpen}
          onClose={() => setIsSupplierInfoDialogOpen(false)}
          itemName={selectedItemForSupplier.name}
          itemSku={selectedItemForSupplier.sku}
        />
      )}
    </Card>
  );
};

export default LowStockAlertsCard;