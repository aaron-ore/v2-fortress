import React from "react";
import { format } from "date-fns";

interface ProductSalesData {
  productName: string;
  sku: string;
  category: string;
  unitsSold: number;
  totalRevenue: number;
}

interface SalesByProductPdfContentProps {
  companyName: string;
  companyAddress: string;
  companyContact: string;
  companyLogoUrl?: string;
  reportDate: string;
  productSales: ProductSalesData[];
  dateRange?: { from?: Date; to?: Date };
}

const SalesByProductPdfContent: React.FC<SalesByProductPdfContentProps> = ({
  companyName,
  companyAddress,
  companyContact,
  companyLogoUrl,
  reportDate,
  productSales,
  dateRange,
}) => {
  const formattedDateRange = dateRange?.from
    ? `${format(dateRange.from, "MMM dd, yyyy")} - ${dateRange.to ? format(dateRange.to, "MMM dd, yyyy") : format(new Date(), "MMM dd, yyyy")}`
    : "All Time";

  const totalOverallRevenue = productSales.reduce((sum, data) => sum + data.totalRevenue, 0);
  const totalOverallUnits = productSales.reduce((sum, data) => sum + data.unitsSold, 0);

  return (
    <div className="bg-white text-gray-900 font-sans text-sm p-[20mm]">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          {companyLogoUrl ? (
            <img src={companyLogoUrl} alt="Company Logo" className="max-h-20 object-contain mb-2" style={{ maxWidth: '1.5in' }} />
          ) : (
            <div className="text-xs text-gray-600 mb-1">YOUR LOGO</div>
          )}
          <h1 className="text-5xl font-extrabold uppercase tracking-tight mb-2">
            SALES BY PRODUCT
          </h1>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">REPORT DATE: {reportDate}</p>
          <p className="text-sm font-semibold">DATA PERIOD: {formattedDateRange}</p>
        </div>
      </div>

      {/* Company Info */}
      <div className="mb-8">
        <p className="font-bold mb-2">REPORT FOR:</p>
        <div className="bg-gray-50 p-3 border border-gray-200 rounded">
          <p className="font-semibold">{companyName}</p>
          <p>{companyContact}</p>
          <p>{companyAddress.split('\n')[0]}</p>
          <p>{companyAddress.split('\n')[1]}</p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="font-bold mb-2">OVERALL SALES SUMMARY:</p>
          <div className="bg-gray-50 p-3 border border-gray-200 rounded space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold">Total Sales Revenue:</span>
              <span>${totalOverallRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Total Units Sold:</span>
              <span>{totalOverallUnits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Number of Products:</span>
              <span>{productSales.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Data Table */}
      <div className="mb-8">
        <p className="font-bold mb-2">DETAILED SALES BY PRODUCT:</p>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border border-gray-300">
              <th className="py-2 px-4 text-left font-semibold border-r border-gray-300">Product Name</th>
              <th className="py-2 px-4 text-left font-semibold border-r border-gray-300">SKU</th>
              <th className="py-2 px-4 text-left font-semibold border-r border-gray-300">Category</th>
              <th className="py-2 px-4 text-right font-semibold border-r border-gray-300">Units Sold</th>
              <th className="py-2 px-4 text-right font-semibold">Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {productSales.length > 0 ? (
              productSales.map((data, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-2 px-4 border-r border-gray-200">{data.productName}</td>
                  <td className="py-2 px-4 border-r border-gray-200">{data.sku}</td>
                  <td className="py-2 px-4 border-r border-gray-200">{data.category}</td>
                  <td className="py-2 px-4 text-right border-r border-gray-200">{data.unitsSold.toLocaleString()}</td>
                  <td className="py-2 px-4 text-right">${data.totalRevenue.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr className="border-b border-gray-200">
                <td colSpan={5} className="py-2 px-4 text-center text-gray-600">No sales data available for this report.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 mt-12 text-right">
        <p>Generated by Fortress on {reportDate}</p>
      </div>
    </div>
  );
};

export default SalesByProductPdfContent;