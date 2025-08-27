import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInventory, InventoryItem } from "@/context/InventoryContext";
import { useOrders } from "@/context/OrdersContext";
import { showSuccess, showError } from "@/utils/toast";
import { Brain, PackagePlus, TrendingUp, AlertCircle } from "lucide-react";
import { format, subMonths, isValid } from "date-fns";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

/**
 * @interface ReorderSuggestion
 * @description Defines the structure for an AI-driven reorder suggestion.
 * @property {string} itemId - The ID of the inventory item.
 * @property {string} itemName - The name of the inventory item.
 * @property {string} itemSku - The SKU of the inventory item.
 * @property {number} currentQuantity - The current quantity on hand.
 * @property {number} reorderLevel - The defined reorder level for the item.
 * @property {number} suggestedQuantity - The AI-suggested quantity to reorder.
 * @property {string} reason - A brief explanation for the suggestion.
 * @property {number} simulatedDemand - The simulated demand for the next period.
 */
interface ReorderSuggestion {
  itemId: string;
  itemName: string;
  itemSku: string;
  currentQuantity: number;
  reorderLevel: number;
  suggestedQuantity: number;
  reason: string;
  simulatedDemand: number;
}

/**
 * @interface SalesTrendData
 * @description Defines the structure for monthly sales trend data.
 * @property {string} name - Month name (e.g., 'Jan').
 * @property {number} 'Units Sold' - Number of units sold in that month.
 */
interface SalesTrendData {
  name: string;
  'Units Sold': number;
}

/**
 * @component AIReorderSuggestions
 * @description Provides simulated AI-driven reorder suggestions based on inventory levels and sales trends.
 * This component demonstrates a value-added feature that can help optimize purchasing decisions.
 *
 * @remarks
 * - The 'AI' logic is simulated using simple heuristics based on current stock, reorder levels,
 *   and a mock calculation of recent sales trends.
 * - In a real-world scenario, this would involve machine learning models, external data,
 *   and more sophisticated forecasting.
 * - This component is designed to be easily removable as part of the 'Value' codename.
 */
const AIReorderSuggestions: React.FC = () => {
  const { inventoryItems, updateInventoryItem, refreshInventory } = useInventory();
  const { orders } = useOrders();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minSuggestedQuantity, setMinSuggestedQuantity] = useState("0");

  /**
   * @function calculateSimulatedDemand
   * @description Calculates a simulated demand for an item based on recent sales.
   * In a real AI system, this would be a complex predictive model.
   * @param {string} itemId - The ID of the inventory item.
   * @returns {number} The simulated demand for the next period.
   */
  const calculateSimulatedDemand = (itemId: string): number => {
    const today = new Date();
    const threeMonthsAgo = subMonths(today, 3);

    const relevantSalesOrders = orders.filter(order =>
      order.type === "Sales" &&
      isValid(new Date(order.date)) &&
      new Date(order.date) >= threeMonthsAgo
    );

    let unitsSoldInLast3Months = 0;
    relevantSalesOrders.forEach(order => {
      order.items.forEach(orderItem => {
        if (orderItem.inventoryItemId === itemId) {
          unitsSoldInLast3Months += orderItem.quantity;
        }
      });
    });

    // Simple heuristic: average monthly sales * 1.5 (to account for lead time/safety stock)
    // Plus a small random factor for 'AI' feel
    const averageMonthlySales = unitsSoldInLast3Months / 3;
    return Math.max(0, Math.round(averageMonthlySales * 1.5 + (Math.random() * 10 - 5)));
  };

  /**
   * @function generateReorderSuggestions
   * @description Generates a list of reorder suggestions for inventory items.
   * Filters by category and minimum suggested quantity.
   * @returns {ReorderSuggestion[]} An array of reorder suggestions.
   */
  const reorderSuggestions = useMemo(() => {
    let suggestions: ReorderSuggestion[] = [];

    inventoryItems.forEach(item => {
      // Filter by category
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return;
      }

      const simulatedDemand = calculateSimulatedDemand(item.id);
      let suggestedQuantity = 0;
      let reason = "";

      if (item.quantity <= item.reorderLevel) {
        // If below reorder level, suggest reordering up to reorder level + simulated demand
        suggestedQuantity = Math.max(0, item.reorderLevel - item.quantity + simulatedDemand);
        reason = `Below reorder level (${item.reorderLevel}) and projected demand.`;
      } else if (item.quantity < simulatedDemand * 2) { // If current stock is less than 2 months of simulated demand
        suggestedQuantity = Math.max(0, simulatedDemand * 2 - item.quantity);
        reason = `Low stock relative to projected demand.`;
      }

      // Apply minimum suggested quantity filter
      const minQty = parseInt(minSuggestedQuantity) || 0;
      if (suggestedQuantity > minQty) {
        suggestions.push({
          itemId: item.id,
          itemName: item.name,
          itemSku: item.sku,
          currentQuantity: item.quantity,
          reorderLevel: item.reorderLevel,
          suggestedQuantity: suggestedQuantity,
          reason: reason,
          simulatedDemand: simulatedDemand,
        });
      }
    });

    // Sort by suggested quantity descending
    return suggestions.sort((a, b) => b.suggestedQuantity - a.suggestedQuantity);
  }, [inventoryItems, orders, selectedCategory, minSuggestedQuantity]); // Re-run when these dependencies change

  /**
   * @function handlePlaceReorder
   * @description Simulates placing a reorder for a suggested item.
   * In a real application, this would trigger a new Purchase Order creation.
   * @param {ReorderSuggestion} suggestion - The reorder suggestion to act upon.
   */
  const handlePlaceReorder = async (suggestion: ReorderSuggestion) => {
    // Simulate updating incoming stock and then refreshing inventory
    const itemToUpdate = inventoryItems.find(item => item.id === suggestion.itemId);
    if (itemToUpdate) {
      const updatedItem = {
        ...itemToUpdate,
        incomingStock: itemToUpdate.incomingStock + suggestion.suggestedQuantity,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      await updateInventoryItem(updatedItem);
      showSuccess(`Simulated reorder of ${suggestion.suggestedQuantity} units for ${suggestion.itemName}. Incoming stock updated.`);
      refreshInventory(); // Refresh to reflect changes
    } else {
      showError(`Failed to find item ${suggestion.itemName} for reorder.`);
    }
  };

  /**
   * @function getMonthlySalesTrend
   * @description Aggregates sales data by month for the last 6 months for a specific item.
   * @param {string} itemId - The ID of the inventory item.
   * @returns {SalesTrendData[]} An array of monthly sales trend data.
   */
  const getMonthlySalesTrend = (itemId: string): SalesTrendData[] => {
    const dataPoints: SalesTrendData[] = [];
    const today = new Date();

    // Aggregate historical sales data by month for the last 6 months
    const monthlySales: { [key: string]: number } = {};
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(today, i);
      const monthKey = format(month, "MMM yyyy");
      monthlySales[monthKey] = 0;
    }

    orders.filter(order => order.type === "Sales").forEach(order => {
      const orderDate = new Date(order.date);
      if (!isValid(orderDate)) return;
      const monthKey = format(orderDate, "MMM yyyy");
      if (monthlySales.hasOwnProperty(monthKey)) {
        order.items.forEach(orderItem => {
          if (orderItem.inventoryItemId === itemId) {
            monthlySales[monthKey]['Units Sold'] += orderItem.quantity;
          }
        });
      }
    });

    Object.keys(monthlySales).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).forEach(monthKey => {
      dataPoints.push({
        name: format(new Date(monthKey), "MMM"),
        "Units Sold": monthlySales[monthKey]['Units Sold'],
      });
    });

    return dataPoints;
  };

  // Get unique categories for filtering
  const uniqueCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    inventoryItems.forEach(item => categoriesSet.add(item.category));
    return ["all", ...Array.from(categoriesSet).sort()];
  }, [inventoryItems]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex-grow space-y-2">
          <Label htmlFor="categoryFilter">Filter by Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="categoryFilter" className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-grow space-y-2">
          <Label htmlFor="minSuggestedQuantity">Min. Suggested Quantity</Label>
          <Input
            id="minSuggestedQuantity"
            type="number"
            value={minSuggestedQuantity}
            onChange={(e) => setMinSuggestedQuantity(e.target.value)}
            placeholder="0"
            min="0"
            className="w-[180px]"
          />
        </div>
      </div>

      {reorderSuggestions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reorderSuggestions.map(suggestion => (
            <Card key={suggestion.itemId} className="bg-card border-border rounded-lg shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" /> {suggestion.itemName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">SKU: {suggestion.itemSku}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>Current Stock: <span className="font-bold">{suggestion.currentQuantity}</span></p>
                  <p>Reorder Level: <span className="font-bold">{suggestion.reorderLevel}</span></p>
                  <p>Simulated Demand: <span className="font-bold">{suggestion.simulatedDemand}</span></p>
                  <p className="text-primary font-bold">Suggested Reorder: {suggestion.suggestedQuantity}</p>
                </div>
                <p className="text-xs text-muted-foreground italic">{suggestion.reason}</p>

                {/* Mini Sales Trend Chart */}
                <div className="h-32 w-full mt-4">
                  <h4 className="text-sm font-semibold mb-1">Last 6 Months Sales Trend:</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getMonthlySalesTrend(suggestion.itemId)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" strokeOpacity={0.3} vertical={false} />
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
                      <Line type="monotone" dataKey="Units Sold" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <Button onClick={() => handlePlaceReorder(suggestion)} className="w-full mt-4">
                  <PackagePlus className="h-4 w-4 mr-2" /> Place Reorder ({suggestion.suggestedQuantity})
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          No reorder suggestions based on current inventory and sales data.
          Adjust filters or add more inventory/orders to see suggestions.
        </p>
      )}

      {/* Architectural Notes for Review */}
      <Card className="bg-card border-border rounded-lg shadow-sm p-6 mt-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">
            Architectural Notes & Future Refactoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground text-sm">
          <p>
            This `AIReorderSuggestions` component is a "spike" implementation.
            The "AI" logic (`calculateSimulatedDemand`) is currently a simple heuristic.
            For a production system, this would be replaced by:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              **Dedicated Backend Service:** An actual AI/ML model (e.g., Python-based)
              running on a server, consuming historical sales data and external factors.
            </li>
            <li>
              **API Integration:** The frontend would call an API endpoint to get
              real-time predictions, rather than calculating them client-side.
            </li>
            <li>
              **Data Granularity:** More granular sales data (daily/weekly) would
              improve prediction accuracy.
            </li>
            <li>
              **User Feedback Loop:** Allow users to rate suggestions to improve the model over time.
            </li>
          </ul>
          <p>
            **Testing Considerations:**
            Unit tests for this component would focus on:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              `calculateSimulatedDemand`: Given mock `orders` data, verify the
              output `simulatedDemand` is as expected for various scenarios (e.g., no sales, high sales).
            </li>
            <li>
              `reorderSuggestions` memoization: Ensure correct suggestions are
              generated based on `inventoryItems`, `orders`, and filter states.
            </li>
            <li>
              `handlePlaceReorder`: Mock `updateInventoryItem` and `showSuccess`
              to ensure the correct item is updated and a success message is displayed.
            </li>
            <li>
              UI rendering: Verify that items are displayed correctly based on
              suggestions, and filters apply as expected.
            </li>
          </ul>
          <p>
            **Next Steps for Improvement:**
            Consider adding a "confidence score" to each suggestion from the mock AI,
            and allow users to adjust the suggested quantity before placing an order.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIReorderSuggestions;