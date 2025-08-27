import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Truck, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SupplierPerformance {
  id: string;
  name: string;
  onTimeDeliveryRate: number; // Percentage
  qualityScore: number; // Percentage
  costCompetitiveness: "High" | "Medium" | "Low";
  overallRating: "Excellent" | "Good" | "Average" | "Poor";
  lastReview: string;
}

const mockSuppliers: SupplierPerformance[] = [
  {
    id: "sup-1",
    name: "Global Tech Inc.",
    onTimeDeliveryRate: 98,
    qualityScore: 95,
    costCompetitiveness: "High",
    overallRating: "Excellent",
    lastReview: "2024-08-01",
  },
  {
    id: "sup-2",
    name: "Office Essentials Co.",
    onTimeDeliveryRate: 85,
    qualityScore: 80,
    costCompetitiveness: "Medium",
    overallRating: "Good",
    lastReview: "2024-07-20",
  },
  {
    id: "sup-3",
    name: "Industrial Parts Ltd.",
    onTimeDeliveryRate: 70,
    qualityScore: 75,
    costCompetitiveness: "Medium",
    overallRating: "Average",
    lastReview: "2024-08-05",
  },
  {
    id: "sup-4",
    name: "QuickShip Logistics",
    onTimeDeliveryRate: 60,
    qualityScore: 90, // High quality, but poor delivery
    costCompetitiveness: "Low",
    overallRating: "Poor",
    lastReview: "2024-08-10",
  },
];

const SupplierPerformanceRating: React.FC = () => {
  const getRatingBadgeVariant = (rating: SupplierPerformance['overallRating']) => {
    switch (rating) {
      case "Excellent": return "default"; // Primary color
      case "Good": return "secondary";
      case "Average": return "outline";
      case "Poor": return "destructive";
      default: return "secondary";
    }
  };

  const getRatingColor = (rating: SupplierPerformance['overallRating']) => {
    switch (rating) {
      case "Excellent": return "text-green-500";
      case "Good": return "text-blue-500";
      case "Average": return "text-yellow-500";
      case "Poor": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const handleViewDetails = (supplierName: string) => {
    showSuccess(`Viewing detailed performance for ${supplierName} (placeholder).`);
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Automatically rate your suppliers based on key metrics like on-time delivery, quality, and cost.
      </p>

      <Card className="bg-card border-border rounded-lg shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Star className="h-6 w-6 text-primary" /> Supplier Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead className="text-center">On-Time Delivery</TableHead>
                  <TableHead className="text-center">Quality Score</TableHead>
                  <TableHead className="text-center">Cost Competitiveness</TableHead>
                  <TableHead className="text-center">Overall Rating</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell className="text-center flex items-center justify-center gap-1">
                      {supplier.onTimeDeliveryRate >= 80 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
                      {supplier.onTimeDeliveryRate}%
                    </TableCell>
                    <TableCell className="text-center flex items-center justify-center gap-1">
                      {supplier.qualityScore >= 80 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
                      {supplier.qualityScore}%
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn(
                        supplier.costCompetitiveness === "High" && "bg-green-500/20 text-green-400",
                        supplier.costCompetitiveness === "Medium" && "bg-yellow-500/20 text-yellow-400",
                        supplier.costCompetitiveness === "Low" && "bg-red-500/20 text-red-400"
                      )}>
                        <DollarSign className="h-3 w-3 mr-1" /> {supplier.costCompetitiveness}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getRatingBadgeVariant(supplier.overallRating)} className={cn("font-semibold", getRatingColor(supplier.overallRating))}>
                        {supplier.overallRating}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(supplier.name)}>
                        View
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
            This `SupplierPerformanceRating` component is a "spike" implementation.
            The "AI" logic and data are currently simulated.
            For a production system, this would involve:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              **Data Integration:** Pulling data from Purchase Orders (delivery dates, item quality checks),
              invoicing systems (cost data), and potentially external supplier databases.
            </li>
            <li>
              **Configurable Metrics:** Allowing users to define and weight their own performance metrics.
            </li>
            <li>
              **Trend Analysis:** Showing historical performance trends for each supplier.
            </li>
            <li>
              **Automated Alerts:** Notifying when a supplier's rating drops below a certain threshold.
            </li>
          </ul>
          <p>
            **Testing Considerations:**
            Unit tests for this component would focus on:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              `getRatingBadgeVariant` and `getRatingColor`: Verify correct styling based on rating.
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

export default SupplierPerformanceRating;