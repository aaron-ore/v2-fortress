import React from "react";

interface PutawayLabelPdfContentProps {
  itemName: string;
  itemSku: string;
  receivedQuantity: number;
  suggestedLocation: string;
  lotNumber?: string;
  expirationDate?: string;
  qrCodeSvg: string; // SVG string for the QR code
  printDate: string;
}

const PutawayLabelPdfContent: React.FC<PutawayLabelPdfContentProps> = ({
  itemName,
  itemSku,
  receivedQuantity,
  suggestedLocation,
  lotNumber,
  expirationDate,
  qrCodeSvg,
  printDate,
}) => {
  return (
    <div className="bg-white text-gray-900 font-sans text-xs p-2 w-[100mm] h-[50mm] border border-black flex flex-col">
      {/* QR Code at the top */}
      <div className="flex justify-center mb-1">
        <div dangerouslySetInnerHTML={{ __html: qrCodeSvg }} className="w-[30mm] h-[30mm] object-contain" />
      </div>

      {/* Item Name */}
      <p className="font-bold text-sm text-center mb-1 leading-tight">{itemName}</p>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[0.6rem] flex-grow">
        <div>
          <span className="font-bold">Code:</span> {itemSku}
        </div>
        <div>
          <span className="font-bold">Qty:</span> {receivedQuantity}
        </div>
        {lotNumber && (
          <div>
            <span className="font-bold">Lot:</span> {lotNumber}
          </div>
        )}
        {expirationDate && (
          <div>
            <span className="font-bold">Exp:</span> {expirationDate}
          </div>
        )}
        <div className="col-span-2">
          <span className="font-bold">Location:</span> <span className="text-blue-700 font-extrabold">{suggestedLocation}</span>
        </div>
      </div>

      {/* Footer Date */}
      <div className="text-right text-[0.6rem] mt-1">
        Date: {printDate}
      </div>
    </div>
  );
};

export default PutawayLabelPdfContent;