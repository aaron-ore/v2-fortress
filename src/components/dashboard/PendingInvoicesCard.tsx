import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceiptText } from "lucide-react";
import { useOrders } from "@/context/OrdersContext";
import { format, isValid, isPast, subDays } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

const PendingInvoicesCard: React.FC = () => {
  const { orders } = useOrders();

  const pendingInvoices = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    return orders
      .filter(order =>
        order.type === "Sales" &&
        order.status !== "Shipped" &&
        order.status !== "Archived" &&
        order.status !== "Packed" &&
        isValid(new Date(order.dueDate)) && // Ensure dueDate is valid
        isPast(new Date(order.dueDate)) &&
        new Date(order.dueDate) < thirtyDaysAgo // More than 30 days late
      )
      .sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        // Ensure dates are valid before comparison
        if (!isValid(dateA) || !isValid(dateB)) return 0;
        return dateA.getTime() - dateB.getTime(); // Sort by earliest due date first
      })
      .slice(0, 5); // Show top 5
  }, [orders]);

  return (
    <Card className="bg-card border-border rounded-lg shadow-sm p-4 flex flex-col h-[310px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold text-foreground">Pending Invoices (30+ Days Late)</CardTitle>
        <ReceiptText className="h-4 w-4 text-destructive" />
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow flex flex-col justify-between">
        {pendingInvoices.length > 0 ? (
          <ScrollArea className="flex-grow max-h-[180px] pr-2">
            <ul className="text-sm space-y-2">
              {pendingInvoices.map((invoice) => {
                const dueDate = new Date(invoice.dueDate);
                return (
                  <li key={invoice.id} className="flex justify-between items-center text-destructive">
                    <span>{invoice.id} - {invoice.customerSupplier}</span>
                    <span className="text-xs">
                      Due: {isValid(dueDate) ? format(dueDate, "MMM dd") : "N/A"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4 flex-grow flex items-center justify-center">No invoices currently 30+ days late. Great!</p>
        )}
        <p className="text-xs text-muted-foreground mt-auto text-center">Sales orders with overdue payments.</p>
      </CardContent>
    </Card>
  );
};

export default PendingInvoicesCard;