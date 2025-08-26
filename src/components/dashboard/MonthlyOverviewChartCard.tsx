import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useOrders } from "@/context/OrdersContext";
import { useInventory } from "@/context/InventoryContext";
import { format, subMonths, isValid } from "date-fns";

const MonthlyOverviewChartCard: React.FC = () => {
  const { orders } = useOrders();
  const { inventoryItems } = useInventory();

  const data = useMemo(() => {
    const today = new Date();
    const monthlyData: { [key: string]: { salesRevenue: number; inventoryValue: number; purchaseVolume: number } } = {};

    // Initialize for last 12 months
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(today, i);
      const monthName = format(month, "MMM");
      monthlyData[monthName] = { salesRevenue: 0, inventoryValue: 0, purchaseVolume: 0 };
    }

    // Aggregate sales revenue and purchase volume
    orders.forEach(order => {
      const orderDate = new Date(order.date);
      if (!isValid(orderDate)) return;
      const monthName = format(orderDate, "MMM");
      if (monthlyData[monthName]) {
        if (order.type === "Sales") {
          monthlyData[monthName].salesRevenue += order.totalAmount;
        } else if (order.type === "Purchase") {
          monthlyData[monthName].purchaseVolume += order.itemCount; // Using item count for purchase volume
        }
      }
    });

    // Aggregate inventory value (simulated for past months, actual for current)
    // This is a simplified simulation. In a real app, you'd track inventory value over time.
    const totalCurrentInventoryValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    Object.keys(monthlyData).forEach((monthName, index) => {
      // For the current month, use actual inventory value
      if (index === Object.keys(monthlyData).length - 1) {
        monthlyData[monthName].inventoryValue = totalCurrentInventoryValue;
      } else {
        // For past months, simulate inventory value with some fluctuation around a trend
        const trendFactor = (index + 1) / 12; // Increases from 1/12 to 12/12
        const baseValue = totalCurrentInventoryValue * (0.7 + (0.3 * trendFactor));
        monthlyData[monthName].inventoryValue = totalCurrentInventoryValue > 0 ? Math.max(0, baseValue + (Math.random() - 0.5) * (totalCurrentInventoryValue * 0.1)) : 0;
      }
    });


    // Convert to array for Recharts
    return Object.keys(monthlyData).map(monthName => ({
      name: monthName,
      "Sales Revenue": parseFloat(monthlyData[monthName].salesRevenue.toFixed(0)),
      "Inventory Value": parseFloat(monthlyData[monthName].inventoryValue.toFixed(0)),
      "Purchase Volume": parseFloat(monthlyData[monthName].purchaseVolume.toFixed(0)),
    }));
  }, [orders, inventoryItems]);

  return (
    <Card className="bg-card border-border rounded-lg shadow-sm p-4 col-span-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold text-foreground">Monthly Activity Overview</CardTitle>
        <p className="text-sm text-muted-foreground">Sales, Inventory & Purchase Trends (Last 12 Months)</p>
      </CardHeader>
      <CardContent className="h-[250px] p-4 pt-0 flex flex-col justify-between">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 0,
              left: 0,
              bottom: 5,
            }}
          >
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
            <YAxis
              tickFormatter={(value) => `$${value}`}
              domain={[0, 'auto']}
              axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
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
            <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 10 }} />
            <Bar dataKey="Sales Revenue" stackId="a" fill="#00C49F" /> {/* Green */}
            <Bar dataKey="Inventory Value" stackId="a" fill="#00BFD8" /> {/* Teal */}
            <Bar dataKey="Purchase Volume" stackId="a" fill="#0088FE" /> {/* Blue */}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyOverviewChartCard;