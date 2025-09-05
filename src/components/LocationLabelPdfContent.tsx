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
    <div className="bg-white text-gray-900 font-sans text-xs p-1 w-[50.8mm] h-[50.8mm] border border-black flex flex-col overflow-hidden"> {/* 2x2 inches (square) */}
      {/* Top Color Bar */}
      <div className="h-[5mm] w-full flex-shrink-0" style={{ backgroundColor: color, zIndex: 10 }}></div>

      {/* Main Content Area */}
      <div className="flex flex-grow flex-col items-center justify-center p-1">
        {/* Main Location String (most prominent) */}
        <p className="text-lg font-extrabold text-black leading-tight mb-1">{locationString}</p>

        <div className="flex items-start justify-between w-full flex-grow">
          {/* QR Code on Left */}
          <div className="flex-shrink-0 w-[25mm] h-[25mm] flex items-center justify-center mr-1"> {/* Increased size, added right margin */}
            <div dangerouslySetInnerHTML={{ __html: qrCodeSvg }} className="w-full h-full object-contain" />
          </div>

          {/* Stacked Location Details on Right */}
          <div className="flex-grow text-right flex flex-col justify-center space-y-0.5 ml-1"> {/* Pushed to right, added left margin */}
            <p className="text-[0.6rem] text-black"><span className="font-semibold">Area:</span> {area}</p>
            <p className="text-[0.6rem] text-black"><span className="font-semibold">Row:</span> {row}</p>
            <p className="text-[0.6rem] text-black"><span className="font-semibold">Bay:</span> {bay}</p>
            <p className="text-[0.6rem] text-black"><span className="font-semibold">Level:</span> {level}</p>
            <p className="text-[0.6rem] text-black"><span className="font-semibold">Pos:</span> {pos}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 text-right text-[0.4rem] text-gray-500 mt-0.5">
        Printed: {printDateObj && isValid(printDateObj) ? format(printDateObj, "MMM dd, yyyy HH:mm") : "N/A"}
      </div>
    </div>
  );
};

export default LocationLabelPdfContent;