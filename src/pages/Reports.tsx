import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ReportSidebar from "@/components/reports/ReportSidebar";
import ReportViewer from "@/components/reports/ReportViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "lucide-react";

const Reports: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeReportId, setActiveReportId] = useState<string>("");

  useEffect(() => {
    // Extract report ID from URL hash
    const hash = location.hash.replace("#", "");
    if (hash) {
      setActiveReportId(hash);
    } else {
      // Default to a report if no hash is present, e.g., "dashboard-summary"
      setActiveReportId("dashboard-summary");
      navigate("/reports#dashboard-summary", { replace: true });
    }
  }, [location.hash, navigate]);

  const handleReportSelect = (reportId: string) => {
    setActiveReportId(reportId);
    navigate(`/reports#${reportId}`); // Update URL hash
  };

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>
      <p className="text-muted-foreground mb-6">
        Generate detailed reports to gain actionable insights into your inventory, sales, and operations.
      </p>

      <ResizablePanelGroup
        direction="horizontal"
        className="flex-grow rounded-lg border"
      >
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="flex h-full flex-col p-4">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Report Categories</h2>
            <ReportSidebar onReportSelect={handleReportSelect} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={80}>
          <div className="flex h-full flex-col p-4">
            <ReportViewer reportId={activeReportId} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Reports;