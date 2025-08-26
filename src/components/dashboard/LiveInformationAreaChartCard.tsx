import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useOrders } from "@/context/OrdersContext";
import { useStockMovement } from "@/context/StockMovementContext";
import { format, subDays, isValid } from "date-fns";

const LiveInformationAreaChartCard: React.FC = () => {
  const { orders } = useOrders();
  const { stockMovements } = useStockMovement();

  const data = useMemo(() => {
    const dataPoints = [];
    const today = new Date();

    // Aggregate data for the last 7 days
    const dailyMetrics: { [key: string]: { salesVolume: number; purchaseVolume: number; adjustments: number } } = {};

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateKey = format(date, "MMM dd");
      dailyMetrics[dateKey] = { salesVolume: 0, purchaseVolume: 0, adjustments: 0 };
    }

    orders.forEach(order => {
      const orderDate = new Date(order.date);
      if (!isValid(orderDate)) return;
      const dateKey = format(orderDate, "MMM dd");
      if (dailyMetrics[dateKey]) {
        if (order.type === "Sales") {
          dailyMetrics[dateKey].salesVolume += order.itemCount;
        } else if (order.type === "Purchase") {
          dailyMetrics[dateKey].purchaseVolume += order.itemCount;
        }
      }
    });

    stockMovements.forEach(movement => {
      const moveDate = new Date(movement.timestamp);
      if (!isValid(moveDate)) return;
      const dateKey = format(moveDate, "MMM dd");
      if (dailyMetrics[dateKey]) {
        dailyMetrics[dateKey].adjustments += movement.amount;
      }
    });

    // Convert to array for Recharts, calculating Total Daily Activity
    Object.keys(dailyMetrics).forEach(dateKey => {
      const totalDailyActivity = dailyMetrics[dateKey].salesVolume + dailyMetrics[dateKey].purchaseVolume + dailyMetrics[dateKey].adjustments;
      dataPoints.push({
        name: dateKey,
        "Total Daily Activity": totalDailyActivity,
      });
    });

    return dataPoints;
  }, [orders, stockMovements]);

  return (
    <Card className="bg-card border-border rounded-lg shadow-sm p-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold text-foreground">Total Daily Activity</CardTitle> {/* Updated title */}
        <p className="text-sm text-muted-foreground">Overall inventory movement in real-time</p> {/* Updated subtitle */}
      </CardHeader>
      <CardContent className="h-[257px] p-4 pt-0 flex flex-col justify-between">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 0,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              {/* Horizontal gradient for the line stroke (blue to green) */}
              <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0088FE" /> {/* Blue start */}
                <stop offset="100%" stopColor="#00C49F" /> {/* Green end */}
              </linearGradient>
              {/* Vertical gradient for the fill (green to blue with opacity) */}
              <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8}/> {/* Green top */}
                <stop offset="95%" stopColor="#0088FE" stopOpacity={0}/> {/* Blue bottom */}
              </linearGradient>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} /> {/* Y-axis now visible */}
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
            <Area
              type="monotone"
              dataKey="Total Daily Activity"
              stroke="url(#strokeGradient)" // Apply horizontal gradient to stroke
              fill="url(#fillGradient)"    // Apply vertical gradient to fill
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default LiveInformationAreaChartCard;