import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { OrderItem } from "@/context/OrdersContext";
import { format, isValid } from "date-fns"; // Import isValid
import { cn } from "@/lib/utils";

interface OrderListTableProps {
  filteredOrders: OrderItem[];
  onOrderClick: (order: OrderItem) => void;
}

const OrderListTable: React.FC<OrderListTableProps> = ({ filteredOrders, onOrderClick }) => {
  return (
    <Card className="bg-card border-border rounded-lg shadow-sm">
      <CardContent className="p-4">
        {filteredOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No orders match your current filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Order ID</TableHead>
                  <TableHead className="w-[150px]">Type</TableHead>
                  <TableHead>Customer/Supplier</TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[120px]">Due Date</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="text-right w-[100px]">Items</TableHead>
                  <TableHead className="text-right w-[120px]">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const today = new Date();
                  const dueDate = new Date(order.dueDate);
                  const isDueDateValid = isValid(dueDate); // Check if date is valid

                  const isOverdue = isDueDateValid && dueDate < today && order.status !== "Shipped" && order.status !== "Packed";
                  const isDueSoon = isDueDateValid && dueDate > today && dueDate <= new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000) && order.status !== "Shipped" && order.status !== "Packed";

                  const dueDateClass = cn(
                    "font-medium",
                    isOverdue && "text-destructive",
                    isDueSoon && "text-yellow-500",
                  );

                  return (
                    <TableRow key={order.id} onClick={() => onOrderClick(order)} className="cursor-pointer hover:bg-muted/20">
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.type}</TableCell>
                      <TableCell className="truncate max-w-[200px]">{order.customerSupplier}</TableCell>
                      <TableCell>{format(new Date(order.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className={dueDateClass}>{isDueDateValid ? format(dueDate, "MMM dd, yyyy") : "N/A"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.status === "New Order"
                              ? "bg-blue-500/20 text-blue-400"
                              : order.status === "Processing"
                              ? "bg-purple-500/20 text-purple-400"
                              : order.status === "Packed"
                              ? "bg-green-500/20 text-green-400"
                              : order.status === "Shipped"
                              ? "bg-gray-500/20 text-gray-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{order.itemCount}</TableCell>
                      <TableCell className="text-right font-semibold">${order.totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderListTable;