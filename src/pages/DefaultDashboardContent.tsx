import React, { useState } from "react";
import AddInventoryDialog from "@/components/AddInventoryDialog";
import ScanItemDialog from "@/components/ScanItemDialog";

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
import MonthlyOverviewChartCard from "@/components/dashboard/MonthlyOverviewChartCard"; // Updated import
import ProfitabilityMetricsCard from "@/components/dashboard/ProfitabilityMetricsCard"; // Updated import
import GenerateReportButton from "@/components/dashboard/GenerateReportButton";

const DefaultDashboardContent: React.FC = () => {
  const [isAddInventoryDialogOpen, setIsAddInventoryDialogOpen] = useState(false);
  const [isScanItemDialogOpen, setIsScanItemDialogOpen] = useState(false);

  const handleScanItem = () => {
    setIsScanItemDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

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
          <MonthlyOverviewChartCard /> {/* Updated component usage */}
        </div>
        <div className="col-span-full md:col-span-1">
          <ProfitabilityMetricsCard /> {/* Updated component usage */}
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