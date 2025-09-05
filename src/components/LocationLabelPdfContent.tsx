import React from "react";
import { format, isValid } from "date-fns";
import { parseAndValidateDate } from "@/utils/dateUtils"; // NEW: Import parseAndValidateDate

interface LocationLabelPdfContentProps {
  area: string;
  row: string;
  bay: string;
  level: string;
  pos: string;
  // Removed 'color' prop as the top bar is no longer needed
  qrCodeSvg: string; // SVG string for the QR code
  printDate: string;
  locationString: string; // The full string encoded in QR code
  className?: string;
}

const LocationLabelPdfContent = React.forwardRef<HTMLDivElement, LocationLabelPdfContentProps>(({
  area,
  row,
  bay,
  level,
  pos,
  // color, // No longer used
  qrCodeSvg,
  printDate,
  locationString,
  className,
}, ref) => {
  // The printDateObj is no longer displayed on the label itself, but kept for potential debugging or internal use.
  // const printDateObj = parseAndValidateDate(printDate);

  return (
    <div ref={ref} className={`bg-white text-gray-900 font-sans p-[2mm] w-[101.6mm] h-[50.8mm] border border-black flex flex-col items-center justify-center overflow-hidden ${className || ''}`}> {/* 4x2 inches (rectangular) */}
      {/* QR Code at the top */}
      <div className="flex-shrink-0 w-[30mm] h-[30mm] flex items-center justify-center mb-[2mm]"> {/* Adjusted size for QR code */}
        <div dangerouslySetInnerHTML={{ __html: qrCodeSvg }} className="w-full h-full object-contain" />
      </div>

      {/* Location Details */}
      <div className="flex w-full justify-around items-end flex-grow">
        <div className="flex flex-col items-center leading-none">
          <span className="text-[0.6rem] font-bold uppercase text-gray-700 mb-[1mm]">AISLE</span>
          <span className="text-3xl font-extrabold text-black">{area}</span>
        </div>
        <div className="flex flex-col items-center leading-none">
          <span className="text-[0.6rem] font-bold uppercase text-gray-700 mb-[1mm]">ROW</span> {/* Corrected to ROW */}
          <span className="text-3xl font-extrabold text-black">{row}</span>
        </div>
        <div className="flex flex-col items-center leading-none">
          <span className="text-[0.6rem] font-bold uppercase text-gray-700 mb-[1mm]">BAY</span> {/* Added BAY */}
          <span className="text-3xl font-extrabold text-black">{bay}</span>
        </div>
        <div className="flex flex-col items-center leading-none">
          <span className="text-[0.6rem] font-bold uppercase text-gray-700 mb-[1mm]">LEVEL</span>
          <span className="text-3xl font-extrabold text-black bg-green-500 text-white px-2 rounded-sm">{level}</span>
        </div>
        <div className="flex flex-col items-center leading-none">
          <span className="text-[0.6rem] font-bold uppercase text-gray-700 mb-[1mm]">SLOT</span>
          <span className="text-3xl font-extrabold text-black">{pos}</span>
        </div>
      </div>
    </div>
  );
});

LocationLabelPdfContent.displayName = "LocationLabelPdfContent";

export default LocationLabelPdfContent;