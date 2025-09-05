import React from "react";
import { format, isValid } from "date-fns";
import { parseAndValidateDate } from "@/utils/dateUtils"; // NEW: Import parseAndValidateDate

interface LocationLabelPdfContentProps {
  area: string;
  row: string;
  bay: string;
  level: string;
  pos: string;
  color: string; // Hex color string for the top bar
  qrCodeSvg: string; // SVG string for the QR code
  printDate: string;
  locationString: string; // The full string encoded in QR code
}

const LocationLabelPdfContent: React.FC<LocationLabelPdfContentProps> = ({
  area,
  row,
  bay,
  level,
  pos,
  color,
  qrCodeSvg,
  printDate,
  locationString,
}) => {
  const printDateObj = parseAndValidateDate(printDate);

  return (
    <div className="bg-white text-gray-900 font-sans text-xs p-2 w-[101.6mm] h-[152.4mm] border border-black flex flex-col overflow-hidden"> {/* Changed to 4x6 inches (portrait) */}
      {/* Top Color Bar */}
      <div className="h-[8mm] w-full flex-shrink-0" style={{ backgroundColor: color }}></div>

      {/* Content Area */}
      <div className="flex flex-grow items-center justify-between p-1">
        {/* QR Code on Left */}
        <div className="flex-shrink-0 w-[35mm] h-[35mm] flex items-center justify-center">
          <div dangerouslySetInnerHTML={{ __html: qrCodeSvg }} className="w-full h-full object-contain" />
        </div>

        {/* Location Details on Right */}
        <div className="flex-grow ml-2 text-left">
          <div className="grid grid-cols-5 gap-x-1 gap-y-0.5 text-[0.6rem] font-semibold uppercase text-black"> {/* Explicitly set text-black */}
            <div>AREA</div>
            <div>ROW</div>
            <div>BAY</div>
            <div>LEVEL</div>
            <div>POS</div>
          </div>
          <div className="grid grid-cols-5 gap-x-1 gap-y-0.5 text-lg font-extrabold mt-0.5 text-black"> {/* Explicitly set text-black */}
            <div className="col-span-1">{area}</div>
            <div className="col-span-1">{row}</div>
            <div className="col-span-1">{bay}</div>
            <div className="col-span-1">{level}</div>
            <div className="col-span-1">{pos}</div>
          </div>
          <p className="text-[0.6rem] mt-1 font-mono break-all text-black">{locationString}</p> {/* Explicitly set text-black */}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 text-right text-[0.5rem] text-gray-500 mt-1">
        Printed: {printDateObj && isValid(printDateObj) ? format(printDateObj, "MMM dd, yyyy HH:mm") : "N/A"}
      </div>
    </div>
  );
};

export default LocationLabelPdfContent;