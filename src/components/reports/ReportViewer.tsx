"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { Printer, FileText, Loader2, Brain } from "lucide-react";
import { usePrint } from "@/context/PrintContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/context/ProfileContext";

// Import all report components (will be created in subsequent steps)
import InventoryValuationReport from "./InventoryValuationReport";
import LowStockReport from "./Components/reports/LowStockReport";
import InventoryMovementReport from "./InventoryMovementReport";
import SalesByCustomerReport from "./SalesByCustomerReport";
import SalesByProductReport from "./SalesByProductReport";
import PurchaseOrderStatusReport from "./PurchaseOrderStatusReport";
import ProfitabilityReport from "./ProfitabilityReport";
import DiscrepancyReport from "./DiscrepancyReport";
import DashboardSummaryReport from "./DashboardSummaryReport"; // For the overview report

interface ReportViewerProps {
  reportId: string;
}

// Map report IDs to their respective components
const reportComponents: { [key: string]: React.ElementType } = {
  "dashboard-summary": DashboardSummaryReport,
  "inventory-valuation": InventoryValuationReport,
  "low-stock-out-of-stock": LowStockReport,
  "inventory-movement": InventoryMovementReport,
  "sales-by-customer": SalesByCustomerReport,
  "sales-by-product": SalesByProductReport,
  "purchase-order-status": PurchaseOrderStatusReport,
  "profitability": ProfitabilityReport,
  "stock-discrepancy": DiscrepancyReport,
};

const ReportViewer: React.FC<ReportViewerProps> = ({ reportId }) => {
  const { initiatePrint } = usePrint();
  const { companyProfile } = useOnboarding();
  const { profile } = useProfile();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState("");

  // Ref to hold the report content for printing
  const reportContentRef = useRef<HTMLDivElement>(null);

  const CurrentReportComponent = reportComponents[reportId];

  // Function to generate the text content of the report for AI summarization
  const generateReportTextContent = useCallback(() => {
    if (reportContentRef.current) {
      const rawInnerText = reportContentRef.current.innerText;
      console.log("Client-side: Raw innerText from reportContentRef:", `"${rawInnerText}"`, "length:", rawInnerText.length);

      const text = rawInnerText
        .replace(/(\r\n|\n|\r){2,}/g, '\n\n') // Reduce multiple newlines to max two
        .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
        .trim();
      return text;
    }
    console.log("Client-side: reportContentRef.current is null.");
    return "";
  }, [reportContentRef]);

  const handleGenerateReport = useCallback(async (data: any) => {
    setIsLoadingReport(true);
    setReportData(data); // The child component will pass its processed data here
    setIsLoadingReport(false);
    setAiSummary(""); // Clear previous AI summary
  }, []);

  const handlePrintReport = useCallback(() => {
    if (!reportData) {
      showError("No report data to print. Please generate the report first.");
      return;
    }
    if (!companyProfile) {
      showError("Company profile not set up. Please complete onboarding or set company details in settings.");
      return;
    }

    // Each report component will need to provide its specific PDF content props
    // This is a placeholder, actual implementation will be in individual report components
    const pdfProps = {
      companyName: companyProfile.name,
      companyAddress: companyProfile.address,
      companyContact: companyProfile.currency, // Using currency as a generic contact
      companyLogoUrl: localStorage.getItem("companyLogo") || undefined,
      reportDate: new Date().toLocaleDateString(),
      ...reportData.pdfProps, // Specific props from the generated report
    };

    initiatePrint({ type: reportData.printType, props: pdfProps });
    showSuccess("Report sent to printer!");
  }, [reportData, companyProfile, initiatePrint]);

  const handleSummarizeReport = async () => {
    if (!reportData) {
      showError("No report data to summarize. Please generate the report first.");
      setIsSummarizing(false);
      return;
    }
    setIsSummarizing(true);
    setAiSummary(""); // Clear previous AI summary

    if (!reportContentRef.current) {
      showError("Report content not rendered. Please ensure the report is visible and fully loaded.");
      setIsSummarizing(false);
      return;
    }

    try {
      const rawText = generateReportTextContent();
      let textToSummarize = rawText.trim();

      if (!textToSummarize) {
        console.warn("Client-side: Report text content is empty after extraction. Using fallback for AI summary.");
        textToSummarize = "The report content was empty or could not be extracted. This is a placeholder summary for testing purposes.";
      }
      console.log("Client-side textToSummarize (final) before sending to Edge Function:", `"${textToSummarize}"`, "length:", textToSummarize.length);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showError("You must be logged in to use the AI Summary tool.");
        setIsSummarizing(false);
        return;
      }

      const response = await supabase.functions.invoke('summarize-report', {
        // REMOVED: JSON.stringify and Content-Type header
        body: { textToSummarize }, // Pass as plain object
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data && response.data.summary) {
        setAiSummary(response.data.summary);
        showSuccess("Report summarized successfully!");
      } else {
        showError("Failed to get a summary from the AI. Please try again.");
      }
    } catch (error: any) {
      console.error("Error generating summary:", error); // Changed log message
      showError(`Error generating summary: ${error.message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!reportId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a report from the sidebar to get started.
      </div>
    );
  }

  if (!CurrentReportComponent) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        Report type "{reportId}" not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Card className="mb-4 bg-card border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">Report Configuration</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          {dateRange?.from && (
            <Button variant="outline" onClick={() => setDateRange(undefined)}>
              Clear Date Filter
            </Button>
          )}
          {/* Other global filters can go here */}
        </CardContent>
      </Card>

      <div className="flex-grow overflow-y-auto">
        <CurrentReportComponent
          dateRange={dateRange}
          onGenerateReport={handleGenerateReport}
          isLoading={isLoadingReport}
          reportContentRef={reportContentRef} // Pass ref to child component
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 justify-end">
        <Button onClick={handleSummarizeReport} disabled={isSummarizing || !reportData}>
          {isSummarizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Summarizing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" /> AI Summary
            </>
          )}
        </Button>
        <Button onClick={handlePrintReport} disabled={!reportData}>
          <Printer className="h-4 w-4 mr-2" /> Print/PDF
        </Button>
      </div>

      {aiSummary && (
        <Card className="mt-4 bg-card border-border rounded-lg shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Brain className="h-6 w-6 text-accent" /> AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/20 p-4 rounded-md border border-border">
              <p className="text-foreground whitespace-pre-wrap">{aiSummary}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportViewer;