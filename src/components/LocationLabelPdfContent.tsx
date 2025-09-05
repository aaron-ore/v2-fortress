import React from "react";
import { format, isValid } from "date-fns";
import { parseAndValidateDate } from "@/utils/dateUtils";

interface LocationLabelPdfContentProps {
  area: string;
  row: string;
  bay: string;
  level: string;
  pos: string;
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
  qrCodeSvg,
  printDate,
  locationString,
  className,
}, ref) => {
  // The printDateObj is no longer displayed on the label itself, but kept for potential debugging or internal use.
  // const printDateObj = parseAndValidateDate(printDate);

  return (
    <div ref={ref} className={`bg-white text-gray-900 font-sans w-[101.6mm] h-[50.8mm] border border-black flex flex-col overflow-hidden ${className || ''}`}>
      {/* Top Section: QR Code (left) and Fortress Logo (right) */}
      <div className="flex justify-between items-start flex-shrink-0 h-[29mm]"> {/* Adjusted height for top section */}
        {/* QR Code */}
        <div className="ml-[2mm] mt-[2mm] w-[25mm] h-[25mm] flex items-center justify-center">
          <div dangerouslySetInnerHTML={{ __html: qrCodeSvg }} className="w-full h-full object-contain" />
        </div>

        {/* Fortress Logo (SVG + Text) */}
        <div className="mr-[2mm] mt-[2mm] flex items-center space-x-1">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <path
              d="M12 2L2 12L12 22L22 12L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M12 2L2 12L12 22L22 12L12 2Z"
              fill="currentColor"
              fillOpacity="0.2"
            />
          </svg>
          <span className="text-xl font-semibold text-foreground">Fortress</span>
        </div>
      </div>

      {/* Bottom Section: Location Details */}
      <div className="flex justify-between items-end flex-grow px-[2mm] pb-[2mm]"> {/* Added padding */}
        {/* Individual location parts */}
        <div className="flex flex-col items-center leading-none">
          <span className="text-[0.6rem] font-bold uppercase text-gray-700">AREA</span>
          <span className="text-3xl font-extrabold text-black">{area}</span>
        </div>
        <div className="flex flex-col items-center leading-none">
          <span className="text-[0.6rem] font-bold uppercase text-gray-700">ROW</span>
          <span className="text-3xl font-extrabold text-black">{row}</span>
        </div>
        <div className="flex flex-col items-center leading-none">
          <span className="text-[0.6rem] font-bold uppercase text-gray-700">BAY</span>
          <span className="text-3xl font-extrabold text-black">{bay}</span>
        </div>
        <div className="flex flex-col items-center leading-none">
          <span className="text-[0.6rem] font-bold uppercase text-gray-700">LEVEL</span>
          <span className="text-3xl font-extrabold text-black bg-green-500 text-white px-2 rounded-sm">{level}</span>
        </div>
        <div className="flex flex-col items-center leading-none">
          <span className="text-[0.6rem] font-bold uppercase text-gray-700">POS</span>
          <span className="text-3xl font-extrabold text-black">{pos}</span>
        </div>
      </div>
    </div>
  );
});

LocationLabelPdfContent.displayName = "LocationLabelPdfContent";

export default LocationLabelPdfContent;