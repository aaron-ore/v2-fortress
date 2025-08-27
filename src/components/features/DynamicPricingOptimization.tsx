import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, Package, Percent, ArrowUp, ArrowDown } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface ProductPricing {
  id: string;
  name: string;
  sku: string;
  currentPrice: number;
  suggestedPrice: number;
  estimatedRevenueUplift: number; // Percentage
  status: "Optimal" | "Improvement Suggested" | "Underperforming";
}

const mockProducts: ProductPricing[] = [
  {
    id: "prod-1",
    name: "Wireless Mouse Pro",
    sku: "WM-PRO-001",
    currentPrice: 29.99,
    suggestedPrice: 32.50,
    estimatedRevenueUplift: 8,
    status: "Improvement Suggested",
  },
  {
    id: "prod-2",
    name: "Ergonomic Keyboard",
    sku: "EK-ULTRA-002",
    currentPrice: 119.99,
    suggestedPrice: 119.99,
    estimatedRevenueUplift: 0,
    status: "Optimal",
  },
  {
    id: "prod-3",
    name: "Premium Notebook",
    sku: "NB-PREM-003",
    currentPrice: 4.99,
    suggestedPrice: 4.50,
    estimatedRevenueUplift: 5, // Lower price, higher volume, still uplift
    status: "Improvement Suggested",
  },
  {
    id: "prod-4",
    name: "High-Speed USB Drive",
    sku: "USB-HS-004",
    currentPrice: 19.99,
    suggestedPrice: 17.00,
    estimatedRevenueUplift: 12,
    status: "Underperforming",
  },
];

const DynamicPricingOptimization: React.FC = () => {
  const handleApplySuggestion = (productName: string, suggestedPrice: number) => {
    showSuccess(`Applied new price of $${suggestedPrice.toFixed(2)} for ${productName}! (Simulated)`);
  };

  const getStatusColor = (status: ProductPricing['status']) => {
    switch (status) {
      case "Optimal": return "text-green-500";
      case "Improvement Suggested": return "text-yellow-500";
      case "Underperforming": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Optimize your product pricing in real-time based on demand, competition, and inventory levels to maximize revenue.
      </p>

      <Card className="bg-card border-border rounded-lg shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" /> Pricing Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Suggested Price</TableHead>
                  <TableHead className="text-right">Est. Uplift</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell className="text-right">${product.currentPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${product.suggestedPrice.toFixed(2)}
                      {product.suggestedPrice > product.currentPrice && <ArrowUp className="h-3 w-3 inline-block ml-1 text-green-500" />}
                      {product.suggestedPrice < product.currentPrice && <ArrowDown className="h-3 w-3 inline-block ml-1 text-destructive" />}
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-1">
                      <Percent className="h-3 w-3" /> {product.estimatedRevenueUplift}%
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("font-semibold", getStatusColor(product.status))}>
                        {product.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplySuggestion(product.name, product.suggestedPrice)}
                        disabled={product.status === "Optimal"}
                      >
                        Apply
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
            This `DynamicPricingOptimization` component is a "spike" implementation.
            The "AI" logic and data are currently simulated.
            For a production system, this would involve:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              **Real-time Data Feeds:** Integrating with sales data, competitor pricing, market trends, and inventory levels.
            </li>
            <li>
              **Elasticity Models:** Machine learning models to predict demand elasticity at different price points.
            </li>
            <li>
              **Automated Price Adjustments:** Ability to automatically update prices in e-commerce platforms.
            </li>
            <li>
              **A/B Testing:** Tools to test different pricing strategies.
            </li>
          </ul>
          <p>
            **Testing Considerations:**
            Unit tests for this component would focus on:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              `getStatusColor`: Verify correct color output for different statuses.
            </li>
            <li>
              UI rendering: Ensure the table displays correctly with mock data, and buttons trigger expected actions.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DynamicPricingOptimization;