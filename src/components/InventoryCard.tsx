import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Tag, MapPin, Eye, PlusCircle, MinusCircle, Trash2 } from "lucide-react";
import { InventoryItem } from "@/context/InventoryContext";
import { cn } from "@/lib/utils";

interface InventoryCardProps {
  item: InventoryItem;
  onAdjustStock: (item: InventoryItem) => void;
  onCreateOrder: (item: InventoryItem) => void;
  onViewDetails: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string, itemName: string) => void; // Updated prop for delete
}

const InventoryCard: React.FC<InventoryCardProps> = ({
  item,
  onAdjustStock,
  onCreateOrder,
  onViewDetails,
  onDeleteItem,
}) => {
  const stockStatusClass =
    item.status === "In Stock"
      ? "text-green-400"
      : item.status === "Low Stock"
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <Card className="group relative bg-card border-border rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold text-foreground truncate">
          {item.name}
        </CardTitle>
        <Package className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-center h-24 bg-muted/30 rounded-md mb-3 overflow-hidden">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <img
              src="/placeholder.svg"
              alt={item.name}
              className="h-16 w-16 object-contain text-muted-foreground"
            />
          )}
        </div>
        <div className="text-sm text-muted-foreground mb-2">
          <p className="flex items-center gap-1">
            <Tag className="h-3 w-3" /> SKU: {item.sku}
          </p>
          <p className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Location: {item.location}
          </p>
        </div>
        <div className="flex items-baseline justify-between mt-3">
          <span className="text-4xl font-bold text-foreground">{item.quantity}</span>
          <span className={cn("text-sm font-medium", stockStatusClass)}>
            {item.status}
          </span>
        </div>
      </CardContent>

      {/* Quick Actions Overlay */}
      <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 space-y-2">
        <Button className="w-full" onClick={() => onAdjustStock(item)}>
          <PlusCircle className="h-4 w-4 mr-2" /> Adjust Stock
        </Button>
        <Button variant="outline" className="w-full" onClick={() => onCreateOrder(item)}>
          <MinusCircle className="h-4 w-4 mr-2" /> Create Order
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => onViewDetails(item)}>
          <Eye className="h-4 w-4 mr-2" /> View Details
        </Button>
        <Button variant="destructive" className="w-full" onClick={() => onDeleteItem(item.id, item.name)}>
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </Button>
      </div>
    </Card>
  );
};

export default InventoryCard;