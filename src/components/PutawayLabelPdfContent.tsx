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
    <div className="bg-white text-gray-900 font-sans text-xs p-4 w-[100mm] h-[50mm] border border-black flex flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold text-sm">PUTAWAY LABEL</div>
        <div className="text-right text-[0.6rem]">Printed: {printDate}</div>
      </div>

      {/* Item Details */}
      <div className="flex-grow grid grid-cols-2 gap-x-2 gap-y-1">
        <div className="col-span-2">
          <p className="font-bold text-sm truncate">{itemName}</p>
          <p className="text-xs">SKU: {itemSku}</p>
        </div>
        <div>
          <p className="font-bold">QTY:</p>
          <p className="text-lg font-extrabold">{receivedQuantity}</p>
        </div>
        <div>
          <p className="font-bold">LOCATION:</p>
          <p className="text-lg font-extrabold text-blue-700">{suggestedLocation}</p>
        </div>
        {lotNumber && (
          <div>
            <p className="font-bold">LOT:</p>
            <p>{lotNumber}</p>
          </div>
        )}
        {expirationDate && (
          <div>
            <p className="font-bold">EXP:</p>
            <p>{expirationDate}</p>
          </div>
        )}
      </div>

      {/* QR Code */}
      <div className="flex justify-center mt-2">
        <div dangerouslySetInnerHTML={{ __html: qrCodeSvg }} className="w-[40mm] h-[40mm] object-contain" />
      </div>
    </div>
  );
};

export default PutawayLabelPdfContent;