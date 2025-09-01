import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ArrowUp, ArrowDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInventory } from "@/context/InventoryContext";
import { useStockMovement } from "@/context/StockMovementContext";

// Define a consistent set of colors for the locations
const LOCATION_COLORS = [
  "hsl(var(--primary))", // Blue/Purple
  "hsl(var(--accent))",  // Lighter primary
  "hsl(142.1 76.2% 36.3%)", // Tailwind green-500 equivalent
  "hsl(47.9 95.8% 53.1%)",  // Tailwind yellow-500 equivalent
];

interface MiniDonutProps {
  percentage: number;
  isPositive: boolean;
  color: string;
}

const MiniDonut: React.FC<MiniDonutProps> = ({ percentage, isPositive, color }) => {
  const data = [{ name: "Achieved", value: percentage }, { name: "Remaining", value: 100 - percentage }];
  const remainingColor = "hsl(var(--muted))"; // Changed to theme-aware muted color

  return (
    <div className="relative w-16 h-16 flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={20}
            outerRadius={28}
            paddingAngle={0}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            cornerRadius={5}
          >
            <Cell fill={color} />
            <Cell fill={remainingColor} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className={cn("text-xs font-bold flex items-center justify-center", isPositive ? "text-green-500" : "text-destructive")}>
          {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />} {percentage}%
        </p>
      </div>
    </div>
  );
};

const LocationStockHealthCard: React.FC = () => {
  const { inventoryItems } = useInventory();
  const { stockMovements } = useStockMovement();

  const locationStockHealthData = useMemo(() => {
    if (inventoryItems.length === 0 || stockMovements.length === 0) return [];

    const locationMetrics: {
      [key: string]: {
        totalMovements: number;
        currentStock: number;
        netChange: number;
      };
    } = {};

    // Initialize metrics for all existing locations
    inventoryItems.forEach(item => {
      if (!locationMetrics[item.location]) {
        locationMetrics[item.location] = { totalMovements: 0, currentStock: 0, netChange: 0 };
      }
      locationMetrics[item.location].currentStock += item.quantity;
    });

    // Aggregate stock movements
    stockMovements.forEach(movement => {
      const item = inventoryItems.find(inv => inv.id === movement.itemId);
      if (item && locationMetrics[item.location]) {
        locationMetrics[item.location].totalMovements += movement.amount;
        if (movement.type === "add") {
          locationMetrics[item.location].netChange += movement.amount;
        } else {
          locationMetrics[item.location].netChange -= movement.amount;
        }
      }
    });

    // Calculate health percentage and prepare for display
    const healthData = Object.entries(locationMetrics).map(([locationName, metrics]) => {
      const totalActivity = metrics.totalMovements;
      const currentStock = metrics.currentStock;
      const netChange = metrics.netChange;

      // A simple "health" percentage: activity relative to total potential (activity + current stock)
      // This indicates how much stock is 'moving' through this location
      const percentage = totalActivity + currentStock > 0
        ? Math.min(100, Math.round((totalActivity / (totalActivity + currentStock)) * 100))
        : 0;

      // Determine if "positive" based on net change or high activity
      const isPositive = netChange >= 0 || percentage > 50; // High activity is also positive

      return {
        label: locationName,
        percentage,
        isPositive,
        movementScore: totalActivity, // Use for sorting
      };
    });

    // Sort by movement score and take top 4
    return healthData.sort((a, b) => b.movementScore - a.movementScore).slice(0, 4);
  }, [inventoryItems, stockMovements]);

  const displayData = locationStockHealthData;

  return (
    <Card className="bg-card border-border rounded-lg shadow-sm p-4 flex flex-col h-[310px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" /> Location Stock
        </CardTitle>
        <p className="text-sm text-muted-foreground">Top locations by stock movement</p>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0 flex flex-col justify-between">
        {displayData.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 justify-items-center items-center flex-grow">
              {displayData.map((data, index) => (
                <MiniDonut
                  key={index}
                  percentage={data.percentage}
                  isPositive={data.isPositive}
                  color={LOCATION_COLORS[index % LOCATION_COLORS.length]}
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {displayData.map((data, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: LOCATION_COLORS[index % LOCATION_COLORS.length] }}></span>
                  <span className="text-muted-foreground truncate">{data.label}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No stock movement data available for locations.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationStockHealthCard;