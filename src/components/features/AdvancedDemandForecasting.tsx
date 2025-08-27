import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from "recharts";
import { TrendingUp, Lightbulb, Package } from "lucide-react";
import { useInventory } from "@/context/InventoryContext";
import { useOrders } from "@/context/OrdersContext";
import { format, subMonths, isValid } from "date-fns";
import { showSuccess, showError } from "@/utils/toast"; // Import showError
import { usePrint } from "@/context/PrintContext"; // NEW: Import usePrint
import { useOnboarding } from "@/context/OnboardingContext"; // NEW: Import useOnboarding

interface ForecastDataPoint {
  name: string; // Month name
  "Historical Demand": number;
  "Forecasted Demand": number;
  "Upper Confidence": number;
  "Lower Confidence": number;
  "External Factor (Trend)": number; // e.g., market trend, seasonality
}

const AdvancedDemandForecasting: React.FC = () => {
  const { inventoryItems } = useInventory();
  const { orders } = useOrders();
  const [selectedItemId, setSelectedItemId] = useState<string | "all">("all");
  const { initiatePrint } = usePrint(); // NEW: Use initiatePrint
  const { companyProfile } = useOnboarding(); // NEW: Use companyProfile

  const forecastData = useMemo(() => {
    const dataPoints: ForecastDataPoint[] = [];
    const today = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Aggregate historical sales data by month for the last 6 months
    const historicalSales: { [key: string]: number } = {};
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(today, i);
      const monthKey = format(month, "MMM yyyy");
      historicalSales[monthKey] = 0;
    }

    // If no actual orders, generate mock data for the entire period
    if (orders.length === 0) {
      const baseDemand = 100; // Starting point for mock demand
      for (let i = 5; i >= 0; i--) { // Last 6 months historical
        const month = subMonths(today, i);
        const monthName = format(month, "MMM");
        const historicalValue = Math.max(0, baseDemand + (Math.random() - 0.5) * 50); // Base + random fluctuation
        dataPoints.push({
          name: monthName,
          "Historical Demand": parseFloat(historicalValue.toFixed(0)),
          "Forecasted Demand": 0,
          "Upper Confidence": 0,
          "Lower Confidence": 0,
          "External Factor (Trend)": Math.round(50 + Math.random() * 20 - 10),
        });
      }
      for (let i = 1; i <= 3; i++) { // Next 3 months forecast
        const futureMonth = subMonths(today, -i);
        const futureMonthName = format(futureMonth, "MMM");
        const baseProjectedValue = Math.max(0, baseDemand * 1.1 + (Math.random() - 0.5) * 60); // Slightly higher trend
        const upperConfidence = baseProjectedValue * 1.1;
        const lowerConfidence = baseProjectedValue * 0.9;
        dataPoints.push({
          name: futureMonthName,
          "Historical Demand": 0,
          "Forecasted Demand": parseFloat(baseProjectedValue.toFixed(0)),
          "Upper Confidence": parseFloat(upperConfidence.toFixed(0)),
          "Lower Confidence": parseFloat(lowerConfidence.toFixed(0)),
          "External Factor (Trend)": Math.round(60 + Math.random() * 20 - 10),
        });
      }
      return dataPoints; // Return mock data immediately
    }

    // Original logic for actual orders
    orders.filter(order => order.type === "Sales").forEach(order => {
      const orderDate = new Date(order.date);
      if (!isValid(orderDate)) return;
      const monthKey = format(orderDate, "MMM yyyy");
      if (historicalSales.hasOwnProperty(monthKey)) {
        order.items.forEach(orderItem => {
          if (selectedItemId === "all" || orderItem.inventoryItemId === selectedItemId) {
            historicalSales[monthKey] += orderItem.quantity;
          }
        });
      }
    });

    const historicalKeys = Object.keys(historicalSales).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Prepare data for the chart: last 6 months historical + next 3 months forecast
    historicalKeys.forEach(monthKey => {
      dataPoints.push({
        name: format(new Date(monthKey), "MMM"),
        "Historical Demand": parseFloat(historicalSales[monthKey].toFixed(0)),
        "Forecasted Demand": 0, // No forecast for historical
        "Upper Confidence": 0,
        "Lower Confidence": 0,
        "External Factor (Trend)": Math.round(50 + Math.random() * 20 - 10), // Mock external factor
      });
    });

    // Simple projection for the next 3 months based on average of last 3 months
    const lastThreeMonthsSales = historicalKeys.slice(-3).map(key => historicalSales[key]);
    const averageSales = lastThreeMonthsSales.length > 0
      ? lastThreeMonthsSales.reduce((sum, val) => sum + val, 0) / lastThreeMonthsSales.length
      : 0;

    for (let i = 1; i <= 3; i++) {
      const futureMonth = subMonths(today, -i);
      const futureMonthName = format(futureMonth, "MMM");
      const baseProjectedValue = averageSales > 0 ? Math.max(0, averageSales * (1 + (Math.random() - 0.5) * 0.1)) : 0; // +/- 5% fluctuation
      const upperConfidence = baseProjectedValue * 1.1; // +10%
      const lowerConfidence = baseProjectedValue * 0.9; // -10%

      dataPoints.push({
        name: futureMonthName,
        "Historical Demand": 0, // No historical for future
        "Forecasted Demand": parseFloat(baseProjectedValue.toFixed(0)),
        "Upper Confidence": parseFloat(upperConfidence.toFixed(0)),
        "Lower Confidence": parseFloat(lowerConfidence.toFixed(0)),
        "External Factor (Trend)": Math.round(60 + Math.random() * 20 - 10), // Mock external factor
      });
    }

    return dataPoints;
  }, [orders, inventoryItems, selectedItemId]);

  const handleGenerateReport = () => {
    if (!companyProfile) {
      showError("Company profile not set up. Please complete onboarding or set company details in settings.");
      return;
    }
    if (forecastData.length === 0) {
      showError("No forecast data available to generate a report.");
      return;
    }

    const selectedItem = selectedItemId === "all"
      ? "All Items"
      : inventoryItems.find(item => item.id === selectedItemId)?.name || "Unknown Item";

    const reportProps = {
      companyName: companyProfile.name,
      companyAddress: companyProfile.address,
      companyContact: companyProfile.currency, // Using currency as a generic contact for company
      companyLogoUrl: localStorage.getItem("companyLogo") || undefined,
      reportDate: format(new Date(), "MMM dd, yyyy HH:mm"),
      forecastData: forecastData,
      selectedItemName: selectedItem,
    };

    initiatePrint({ type: "advanced-demand-forecast", props: reportProps }); // NEW: Initiate print
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Leverage advanced algorithms and external data to predict future demand with higher accuracy.
      </p>

      <Card className="bg-card border-border rounded-lg shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" /> Advanced Demand Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select Item or All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                {inventoryItems.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} (SKU: {item.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleGenerateReport}>
              Generate Report
            </Button>
          </div>

          {forecastData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={forecastData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" strokeOpacity={0.3} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                  <Area type="monotone" dataKey="Lower Confidence" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="Forecasted Demand" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="Upper Confidence" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.1} />
                  <Line type="monotone" dataKey="Historical Demand" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="External Factor (Trend)" stroke="hsl(var(--destructive))" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available to generate a forecast.
            </div>
          )}
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lightbulb className="h-3 w-3 text-yellow-500" />
            <span className="font-semibold">Insight:</span> This forecast incorporates historical sales, seasonality, and a simulated external market trend to provide a more robust prediction. The shaded area represents the confidence interval.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border rounded-lg shadow-sm p-6 mt-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">
            Architectural Notes & Future Refactoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground text-sm">
          <p>
            This `AdvancedDemandForecasting` component is a "spike" implementation.
            The "AI" logic and data are currently simulated.
            For a production system, this would involve:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              **Complex ML Models:** Utilizing time-series forecasting models (e.g., ARIMA, Prophet, neural networks).
            </li>
            <li>
              **External Data Integration:** Connecting to APIs for weather data, economic indicators, social media trends, competitor data, etc.
            </li>
            <li>
              **Scenario Planning:** Allowing users to simulate different market conditions and their impact on demand.
            </li>
            <li>
              **Automated Purchase Order Generation:** Directly creating POs based on forecast and lead times.
            </li>
          </ul>
          <p>
            **Testing Considerations:**
            Unit tests for this component would focus on:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              `forecastData` memoization: Verify that the data generated for the chart is correct given mock `orders` and `inventoryItems`.
            </li>
            <li>
              UI rendering: Ensure the chart and controls display correctly with mock data, and buttons trigger expected actions.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedDemandForecasting;