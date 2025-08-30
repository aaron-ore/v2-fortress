import React from "react";
import { InventoryItem } from "@/context/InventoryContext";
import InventoryCard from "@/components/InventoryCard"; // Assuming this component exists and is suitable

interface InventoryCardGridProps {
  items: InventoryItem[];
  onAdjustStock: (item: InventoryItem) => void;
  onCreateOrder: (item: InventoryItem) => void;
  onViewDetails: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string, itemName: string) => void;
}

const InventoryCardGrid: React.FC<InventoryCardGridProps> = ({
  items,
  onAdjustStock,
  onCreateOrder,
  onViewDetails,
  onDeleteItem,
}) => {
  if (items.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No inventory items found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <InventoryCard
          key={item.id}
          item={item}
          onAdjustStock={onAdjustStock}
          onCreateOrder={onCreateOrder}
          onViewDetails={onViewDetails}
          onDeleteItem={onDeleteItem}
        />
      ))}
    </div>
  );
};

export default InventoryCardGrid;