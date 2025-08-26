import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { OrderItem } from "@/context/OrdersContext";
import { cn } from "@/lib/utils";
import { Package, Calendar, MessageSquare, Truck, ShoppingCart } from "lucide-react";
import { format, isValid } from "date-fns"; // Import isValid
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OrderCardProps {
  order: OrderItem;
  onClick: (order: OrderItem) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
  const today = new Date();
  const dueDate = new Date(order.dueDate);
  const isDueDateValid = isValid(dueDate); // Check if date is valid

  const isOverdue = isDueDateValid && dueDate < today && order.status !== "Shipped" && order.status !== "Packed";
  const isDueSoon = isDueDateValid && dueDate > today && dueDate <= new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000) && order.status !== "Shipped" && order.status !== "Packed"; // Due within 2 days

  const dueDateClass = cn(
    "text-xs font-medium flex items-center gap-1",
    isOverdue && "text-destructive",
    isDueSoon && "text-yellow-500",
    !isOverdue && !isDueSoon && "text-muted-foreground"
  );

  const orderTypeColor = order.orderType === "Retail" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400";
  const shippingMethodColor = order.shippingMethod === "Express" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400";

  return (
    <Card
      className="bg-card border-border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(order)}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-foreground text-sm truncate">{order.id}</h3>
          <div className="flex items-center gap-1">
            {order.type === "Sales" ? (
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Truck className="h-4 w-4 text-muted-foreground" />
            )}
            {order.notes && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <MessageSquare className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{order.notes}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {order.customerSupplier}
        </p>
        <div className="flex justify-between items-center text-xs">
          <span className={dueDateClass}>
            <Calendar className="h-3 w-3" /> Due: {isDueDateValid ? format(dueDate, "MMM dd") : "N/A"}
          </span>
          <span className="text-muted-foreground flex items-center gap-1">
            <Package className="h-3 w-3" /> {order.itemCount} Items
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", orderTypeColor)}>
            {order.orderType}
          </span>
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", shippingMethodColor)}>
            {order.shippingMethod}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;