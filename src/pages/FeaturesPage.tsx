import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AIReorderSuggestions from "@/components/features/AIReorderSuggestions"; // Import the new AIReorderSuggestions component
import { Sparkles } from "lucide-react";

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

      {/* Section for AI-driven Reorder Suggestions */}
      <Card className="bg-card border-border rounded-lg shadow-sm p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            AI-Driven Reorder Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Leverage simulated AI insights to optimize your inventory reordering process.
            This tool analyzes stock levels and historical trends to suggest ideal reorder quantities.
          </p>
          <AIReorderSuggestions /> {/* Render the AIReorderSuggestions component */}
        </CardContent>
      </Card>

      {/* Placeholder for future value-added features */}
      <Card className="bg-card border-border rounded-lg shadow-sm p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">
            Future Value-Added Feature Ideas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Predictive Maintenance for Warehouse Equipment</li>
            <li>Automated Supplier Performance Rating</li>
            <li>Dynamic Pricing Optimization</li>
            <li>Advanced Demand Forecasting with External Data</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            These are examples of how this 'Features' tab can grow with more intelligent tools.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeaturesPage;