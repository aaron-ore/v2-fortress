import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useOrders } from "@/context/OrdersContext";
import { useInventory } from "@/context/InventoryContext";
import { format, subMonths, isValid } from "date-fns";

const Last3MonthSalesCard: React.FC = () => {
  const { orders } = useOrders();
  const { inventoryItems } = useInventory();

  const data = useMemo(() => {
    const today = new Date();
    const monthlyData: { [key: string]: { salesRevenue: number; newInventory: number; itemsShipped: number } } = {};

    // Initialize for last 3 months
    for (let i = 2; i >= 0; i--) {
      const month = subMonths(today, i);
      const monthName = format(month, "MMM");
      monthlyData[monthName] = { salesRevenue: 0, newInventory: 0, itemsShipped: 0 };
    }

    // Aggregate sales revenue
    orders.filter(order => order.type === "Sales").forEach(order => {
      const orderDate = new Date(order.date);
      if (!isValid(orderDate)) return;
      const monthName = format(orderDate, "MMM");
      if (monthlyData[monthName]) {
        monthlyData[monthName].salesRevenue += order.totalAmount;
        monthlyData[monthName].itemsShipped += order.itemCount; // Assuming all items in a sales order are shipped
      }
    });

    // Aggregate new inventory added (simulated for now)
    inventoryItems.forEach(item => {
      const itemDate = new Date(item.lastUpdated); // Using lastUpdated as a proxy for creation/update
      if (!isValid(itemDate)) return;
      const monthName = format(itemDate, "MMM");
      if (monthlyData[monthName]) {
        // Simulate new inventory added, perhaps a fraction of current quantity
        monthlyData[monthName].newInventory += Math.floor(item.quantity * (0.1 + Math.random() * 0.2));
      }
    });

    // Convert to array for Recharts
    return Object.keys(monthlyData).map(monthName => ({
      name: monthName,
      "Sales Revenue": parseFloat(monthlyData[monthName].salesRevenue.toFixed(0)),
      "New Inventory Added": parseFloat(monthlyData[monthName].newInventory.toFixed(0)),
      "Items Shipped": parseFloat(monthlyData[monthName].itemsShipped.toFixed(0)),
    }));
  }, [orders, inventoryItems]);

  return (
    <Card className="bg-card border-border rounded-lg shadow-sm p-4 flex flex-col h-[310px]"> {/* Added flex-col h-[310px] */}
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold text-foreground">Last 3 Months Activity</CardTitle>
        <p className="text-sm text-muted-foreground">Sales, Inventory & Shipments</p> {/* Added descriptive paragraph */}
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0 flex flex-col justify-between"> {/* Changed to flex-grow */}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 0,
              left: 0,
              bottom: 5,
            }}
            barCategoryGap="30%"
          >
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: "0.75rem",
              }}
              itemStyle={{ color: "hsl(var(--foreground))", fontSize: "0.75rem" }}
              labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "0.75rem" }}
            />
            <Bar dataKey="Sales Revenue" stackId="a" fill="#00C49F" />
            <Bar dataKey="New Inventory Added" stackId="a" fill="#00BFD8" />
            <Bar dataKey="Items Shipped" stackId="a" fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default Last3MonthSalesCard;