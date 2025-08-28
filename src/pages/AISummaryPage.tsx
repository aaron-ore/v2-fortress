import React from "react";
import AISummaryTool from "@/components/AISummaryTool"; // Import the AI Summary Tool
import { Brain } from "lucide-react"; // Import Brain icon

const AISummaryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Brain className="h-8 w-8 text-primary" /> AI Summary
      </h1>
      <AISummaryTool />
    </div>
  );
};

export default AISummaryPage;