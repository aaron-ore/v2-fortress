import React from "react";

interface POItem {
  id: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
}

interface PurchaseOrderPdfContentProps {
  poNumber: string;
  poDate: string;
  supplierName: string;
  supplierEmail?: string; // New: Supplier Email
  supplierAddress: string;
  supplierContact: string; // This will be used for phone if email is separate
  recipientName: string; // This is your company's name
  recipientAddress: string; // This is your company's address
  recipientContact: string; // This is your company's contact (e.g., email)
  terms: string; // New: Payment Terms
  dueDate: string; // New: Due Date
  items: POItem[];
  notes: string;
  taxRate: number; // New: Tax Rate (e.g., 0.05 for 5%)
  companyLogoUrl?: string;
}

const PurchaseOrderPdfContent: React.FC<PurchaseOrderPdfContentProps> = ({
  poNumber,
  poDate,
  supplierName,
  supplierEmail,
  supplierAddress,
  supplierContact,
  recipientName,
  recipientAddress,
  recipientContact,
  terms,
  dueDate,
  items,
  notes,
  taxRate,
  companyLogoUrl,
}) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  return (
    <div className="bg-white text-gray-900 font-sans text-sm p-[20mm]"> {/* Changed padding to 20mm */}
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          {companyLogoUrl ? (
            <img src={companyLogoUrl} alt="Company Logo" className="max-h-20 object-contain mb-2" style={{ maxWidth: '1.5in' }} />
          ) : (
            <div className="text-xs text-gray-600 mb-1">YOUR LOGO</div>
          )}
          <h1 className="text-5xl font-extrabold uppercase tracking-tight mb-2">
            PURCHASE ORDER
          </h1>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">DATE: {poDate}</p>
          <p className="text-sm font-semibold">PO: {poNumber}</p>
        </div>
      </div>

      {/* FROM / TO Section */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="font-bold mb-2">FROM:</p>
          <div className="bg-gray-50 p-3 border border-gray-200 rounded">
            <p className="font-semibold">{recipientName}</p>
            <p>{recipientContact}</p> {/* Using recipientContact for email/phone */}
            <p>{recipientAddress.split('\n')[0]}</p>
            <p>{recipientAddress.split('\n')[1]}</p>
          </div>
        </div>
        <div>
          <p className="font-bold mb-2">TO:</p>
          <div className="bg-gray-50 p-3 border border-gray-200 rounded">
            <p className="font-semibold">{supplierName}</p>
            <p>{supplierEmail}</p>
            <p>{supplierAddress.split('\n')[0]}</p>
            <p>{supplierAddress.split('\n')[1]}</p>
          </div>
        </div>
      </div>

      {/* TERMS / DUE Section */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="font-bold mb-2">TERMS:</p>
          <div className="bg-gray-50 p-3 border border-gray-200 rounded">
            <p>{terms}</p>
          </div>
        </div>
        <div>
          <p className="font-bold mb-2">DUE:</p>
          <div className="bg-gray-50 p-3 border border-gray-200 rounded">
            <p>{dueDate}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse mb-8">
        <thead>
          <tr className="bg-gray-100 border border-gray-300">
            <th className="py-2 px-4 text-left font-semibold border-r border-gray-300">Item Description</th>
            <th className="py-2 px-4 text-right font-semibold w-24 border-r border-gray-300">Quantity</th>
            <th className="py-2 px-4 text-right font-semibold w-24 border-r border-gray-300">Unit Price</th>
            <th className="py-2 px-4 text-right font-semibold w-24">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-2 px-4 border-r border-gray-200">{item.itemName}</td>
              <td className="py-2 px-4 text-right border-r border-gray-200">{item.quantity}</td>
              <td className="py-2 px-4 text-right border-r border-gray-200">${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="py-2 px-4 text-right">${(item.quantity * item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          ))}
          {/* Add empty rows to fill space if needed, similar to the screenshot */}
          {Array.from({ length: Math.max(0, 10 - items.length) }).map((_, i) => (
            <tr key={`empty-${i}`} className="border-b border-gray-200">
              <td className="py-2 px-4 border-r border-gray-200">&nbsp;</td>
              <td className="py-2 px-4 border-r border-gray-200">&nbsp;</td>
              <td className="py-2 px-4 border-r border-gray-200">&nbsp;</td>
              <td className="py-2 px-4">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* New container for Notes and Totals */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Left side: Notes */}
        <div>
          <p className="font-bold mb-2">Notes</p>
          <div className="bg-gray-50 p-3 border border-gray-200 rounded min-h-[80px]">
            <p>{notes}</p>
          </div>
        </div>

        {/* Right side: Totals Summary */}
        <div className="flex flex-col items-end">
          <div className="w-full max-w-xs"> {/* Constrain width for totals block */}
            <div className="flex justify-between py-1">
              <span className="font-bold">Subtotal</span>
              <span>${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-bold">Tax ({taxRate * 100}%)</span>
              <span>${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-300 mt-2">
              <span className="font-bold text-lg">BALANCE DUE</span>
              <span className="font-bold text-lg">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 mt-12 text-right">
        <p>eForms.com</p> {/* Placeholder from screenshot */}
      </div>
    </div>
  );
};

export default PurchaseOrderPdfContent;