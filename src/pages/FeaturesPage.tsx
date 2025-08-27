import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // Import Tabs components
import AIReorderSuggestions from "@/components/features/AIReorderSuggestions";
import PredictiveMaintenance from "@/components/features/PredictiveMaintenance"; // NEW: Import PredictiveMaintenance
import SupplierPerformanceRating from "@/components/features/SupplierPerformanceRating"; // NEW: Import SupplierPerformanceRating
import DynamicPricingOptimization from "@/components/features/DynamicPricingOptimization"; // NEW: Import DynamicPricingOptimization
import AdvancedDemandForecasting from "@/components/features/AdvancedDemandForecasting"; // NEW: Import AdvancedDemandForecasting
import { Sparkles, Brain, Wrench, Star, DollarSign, TrendingUp } from "lucide-react"; // Import new icons

/**
 * @component FeaturesPage
 * @description This page serves as a central hub for showcasing value-added features.
 * It is designed to be modular, allowing new feature components to be added easily.
 * Codename: 'Value' - for easy identification and potential removal.
 */
const FeaturesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Sparkles className="h-8 w-8 text-primary" /> Features (Value-Added)
      </h1>
      <p className="text-muted-foreground">
        Explore advanced functionalities designed to optimize your inventory management.
      </p>

      <Tabs defaultValue="ai-reorder" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-auto"> {/* Adjusted grid for more tabs */}
          <TabsTrigger value="ai-reorder" className="flex items-center gap-2 py-2">
            <Brain className="h-4 w-4" /> AI Reorder
          </TabsTrigger>
          <TabsTrigger value="predictive-maintenance" className="flex items-center gap-2 py-2">
            <Wrench className="h-4 w-4" /> Predictive Maint.
          </TabsTrigger>
          <TabsTrigger value="supplier-performance" className="flex items-center gap-2 py-2">
            <Star className="h-4 w-4" /> Supplier Perf.
          </TabsTrigger>
          <TabsTrigger value="dynamic-pricing" className="flex items-center gap-2 py-2">
            <DollarSign className="h-4 w-4" /> Dynamic Pricing
          </TabsTrigger>
          <TabsTrigger value="demand-forecasting" className="flex items-center gap-2 py-2">
            <TrendingUp className="h-4 w-4" /> Demand Forecast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-reorder" className="mt-4">
          <AIReorderSuggestions />
        </TabsContent>
        <TabsContent value="predictive-maintenance" className="mt-4">
          <PredictiveMaintenance />
        </TabsContent>
        <TabsContent value="supplier-performance" className="mt-4">
          <SupplierPerformanceRating />
        </TabsContent>
        <TabsContent value="dynamic-pricing" className="mt-4">
          <DynamicPricingOptimization />
        </TabsContent>
        <TabsContent value="demand-forecasting" className="mt-4">
          <AdvancedDemandForecasting />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeaturesPage;