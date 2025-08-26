import React, { useState } from "react";
import AddInventoryDialog from "@/components/AddInventoryDialog";
import ScanItemDialog from "@/components/ScanItemDialog";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";

// Import new dashboard components
import WalletCard from "@/components/dashboard/WalletCard";
import LossesCard from "@/components/dashboard/LossesCard";
import IncomeCard from "@/components/dashboard/IncomeCard";
import OrderFulfillmentRateCard from "@/components/dashboard/OrderFulfillmentRateCard";
import Last3MonthSalesCard from "@/components/dashboard/Last3MonthSalesCard";
import LiveMetricsCard from "@/components/dashboard/LiveMetricsCard";
import LiveInformationAreaChartCard from "@/components/dashboard/LiveInformationAreaChartCard";
import RiskRadarChartCard from "@/components/dashboard/RiskRadarChartCard";
import LocationStockHealthCard from "@/components/dashboard/LocationStockHealthCard";
import MonthlyOverviewChartCard from "@/components/dashboard/MonthlyOverviewChartCard";
import ProfitabilityMetricsCard from "@/components/dashboard/ProfitabilityMetricsCard";
import GenerateReportButton from "@/components/dashboard/GenerateReportButton";
import { Button } from "@/components/ui/button";

const DefaultDashboardContent: React.FC = () => {
  const [isAddInventoryDialogOpen, setIsAddInventoryDialogOpen] = useState(false);
  const [isScanItemDialogOpen, setIsScanItemDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleScanItem = () => {
    setIsScanItemDialogOpen(true);
  };

  const handleClearDateFilter = () => {
    setDateRange(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header and Date Filter in the same row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          {dateRange?.from && (
            <Button variant="outline" onClick={handleClearDateFilter}>
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Top Row: 3 cards + 1 column of 3 small cards */}
        <div className="col-span-full md:col-span-1">
          <OrderFulfillmentRateCard />
        </div>
        <div className="col-span-full md:col-span-1">
          <Last3MonthSalesCard />
        </div>
        <div className="col-span-full md:col-span-1">
          <LiveMetricsCard />
        </div>
        <div className="col-span-full md:col-span-1 flex flex-col gap-4">
          <WalletCard />
          <LossesCard />
          <IncomeCard />
          <GenerateReportButton />
        </div>

        {/* Middle Row: 1 wide card + 2 regular cards */}
        <div className="col-span-full md:col-span-2 lg:col-span-2 xl:col-span-2">
          <LiveInformationAreaChartCard />
        </div>
        <div className="col-span-full md:col-span-1">
          <RiskRadarChartCard />
        </div>
        <div className="col-span-full md:col-span-1">
          <LocationStockHealthCard />
        </div>

        {/* Bottom Row: 1 very wide card + 1 regular card */}
        <div className="col-span-full md:col-span-2 lg:col-span-3 xl:col-span-3">
          <MonthlyOverviewChartCard />
        </div>
        <div className="col-span-full md:col-span-1">
          <ProfitabilityMetricsCard />
        </div>
      </div>

      <AddInventoryDialog
        isOpen={isAddInventoryDialogOpen}
        onClose={() => setIsAddInventoryDialogOpen(false)}
      />
      <ScanItemDialog
        isOpen={isScanItemDialogOpen}
        onClose={() => setIsScanItemDialogOpen(false)}
      />
    </div>
  );
};

export default DefaultDashboardContent;