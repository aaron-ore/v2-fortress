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
    <div className="bg-white text-gray-900 font-sans text-xs p-1 w-[101.6mm] h-[50.8mm] border border-black flex flex-col overflow-hidden"> {/* Changed to 4x2 inches (landscape) */}
      {/* Top Color Bar */}
      <div className="h-[5mm] w-full flex-shrink-0" style={{ backgroundColor: color, zIndex: 10 }}></div> {/* Adjusted height */}

      {/* Content Area */}
      <div className="flex flex-grow items-center justify-between p-1">
        {/* QR Code on Left */}
        <div className="flex-shrink-0 w-[20mm] h-[20mm] flex items-center justify-center"> {/* Adjusted size */}
          <div dangerouslySetInnerHTML={{ __html: qrCodeSvg }} className="w-full h-full object-contain" />
        </div>

        {/* Location Details on Right */}
        <div className="flex-grow ml-1 text-left"> {/* Adjusted margin */}
          <div className="grid grid-cols-5 gap-x-0.5 gap-y-0.5 text-[0.5rem] font-semibold uppercase text-black"> {/* Adjusted font size and gap */}
            <div>AREA</div>
            <div>ROW</div>
            <div>BAY</div>
            <div>LEVEL</div>
            <div>POS</div>
          </div>
          <div className="grid grid-cols-5 gap-x-0.5 gap-y-0.5 text-base font-bold mt-0.5 text-black"> {/* Adjusted font size and gap */}
            <div className="col-span-1">{area}</div>
            <div className="col-span-1">{row}</div>
            <div className="col-span-1">{bay}</div>
            <div className="col-span-1">{level}</div>
            <div className="col-span-1">{pos}</div>
          </div>
          <p className="text-[0.5rem] mt-0.5 font-mono break-all text-black">{locationString}</p> {/* Adjusted font size and margin */}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 text-right text-[0.4rem] text-gray-500 mt-0.5"> {/* Adjusted font size and margin */}
        Printed: {printDateObj && isValid(printDateObj) ? format(printDateObj, "MMM dd, yyyy HH:mm") : "N/A"}
      </div>
    </div>
  );
};

export default LocationLabelPdfContent;