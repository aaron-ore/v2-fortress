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
    <div className="bg-white text-gray-900 font-sans text-xs p-1 w-[101.6mm] h-[50.8mm] border border-black flex flex-col overflow-hidden"> {/* 4x2 inches (landscape) */}
      {/* Top Color Bar */}
      <div className="h-[5mm] w-full flex-shrink-0" style={{ backgroundColor: color, zIndex: 10 }}></div>

      {/* Main Location String */}
      <div className="flex-shrink-0 text-center mt-1">
        <p className="text-xl font-extrabold text-black leading-tight">{locationString}</p>
      </div>

      {/* Content Area: QR Code and Stacked Details */}
      <div className="flex flex-grow items-start justify-start p-1">
        {/* QR Code on Left */}
        <div className="flex-shrink-0 w-[20mm] h-[20mm] flex items-center justify-center mr-2"> {/* Added right margin */}
          <div dangerouslySetInnerHTML={{ __html: qrCodeSvg }} className="w-full h-full object-contain" />
        </div>

        {/* Stacked Location Details on Right */}
        <div className="flex-grow text-left flex flex-col justify-center space-y-0.5"> {/* Added vertical spacing */}
          <p className="text-[0.6rem] text-black"><span className="font-semibold">Area:</span> {area}</p>
          <p className="text-[0.6rem] text-black"><span className="font-semibold">Row:</span> {row}</p>
          <p className="text-[0.6rem] text-black"><span className="font-semibold">Bay:</span> {bay}</p>
          <p className="text-[0.6rem] text-black"><span className="font-semibold">Level:</span> {level}</p>
          <p className="text-[0.6rem] text-black"><span className="font-semibold">Pos:</span> {pos}</p>
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