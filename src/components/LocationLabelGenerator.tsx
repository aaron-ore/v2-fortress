import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, QrCode, Palette } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { usePrint, PrintContentData } from "@/context/PrintContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { generateQrCodeSvg } from "@/utils/qrCodeGenerator";
import { format } from "date-fns";
import LocationLabelPdfContent from "@/components/LocationLabelPdfContent";

// Predefined colors for labels, matching some of the designs
const labelColors = [
  { name: "Green", hex: "#4CAF50" },
  { name: "Blue", hex: "#2196F3" },
  { name: "Purple", hex: "#9C27B0" },
  { name: "Yellow", hex: "#FFEB3B" },
  { name: "Red", hex: "#F44336" },
  { name: "Orange", hex: "#FF9800" },
];

interface LocationLabelGeneratorProps {
  initialArea?: string;
  initialRow?: string;
  initialBay?: string;
  initialLevel?: string;
  initialPos?: string;
  initialColor?: string;
  initialLocationString?: string; // NEW: Add initialLocationString prop
  onGenerateAndPrint?: (data: PrintContentData[]) => void; // Optional callback for external print
}

const LocationLabelGenerator: React.FC<LocationLabelGeneratorProps> = ({
  initialArea = "A",
  initialRow = "01",
  initialBay = "01",
  initialLevel = "1",
  initialPos = "A",
  initialColor = labelColors[0].hex,
  initialLocationString, // NEW: Destructure initialLocationString
  onGenerateAndPrint,
}) => {
  const { initiatePrint } = usePrint();
  const { companyProfile, locations } = useOnboarding(); // Get all existing locations

  const [area, setArea] = useState(initialArea);
  const [row, setRow] = useState(initialRow);
  const [bay, setBay] = useState(initialBay);
  const [level, setLevel] = useState(initialLevel);
  const [pos, setPos] = useState(initialPos);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [quantity, setQuantity] = useState("1");
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);

  // Update internal state when initial props change
  useEffect(() => {
    setArea(initialArea);
    setRow(initialRow);
    setBay(initialBay);
    setLevel(initialLevel);
    setPos(initialPos);
    setSelectedColor(initialColor);
  }, [initialArea, initialRow, initialBay, initialLevel, initialPos, initialColor]);

  const locationString = useMemo(() => {
    return `${area}-${row}-${bay}-${level}-${pos}`;
  }, [area, row, bay, level, pos]);

  // Generate QR code for preview
  useEffect(() => {
    const generatePreviewQr = async () => {
      if (locationString) {
        try {
          // Generate a larger QR code for better quality when scaled down
          const svg = await generateQrCodeSvg(locationString, 150); 
          setQrCodeSvg(svg);
        } catch (error) {
          console.error("Error generating QR for preview:", error);
          setQrCodeSvg(null);
        }
      } else {
        setQrCodeSvg(null);
      }
    };
    generatePreviewQr();
  }, [locationString]);

  const handleGenerateAndPrint = async () => {
    if (!area || !row || !bay || !level || !pos || !selectedColor || !quantity) {
      showError("Please fill in all location details and select a color.");
      return;
    }

    const numQuantity = parseInt(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0 || numQuantity > 100) {
      showError("Please enter a valid quantity between 1 and 100.");
      return;
    }

    if (!companyProfile) {
      showError("Company profile not set up. Please complete onboarding or set company details in settings.");
      return;
    }

    // NEW: Duplication check
    const existingLocation = locations.find(loc => loc.toLowerCase() === locationString.toLowerCase());
    if (existingLocation && (
        !initialLocationString || // Case 1: Creating a new label, but the generated string already exists
        (initialLocationString && existingLocation.toLowerCase() !== initialLocationString.toLowerCase()) // Case 2: Editing an existing label, but the new generated string duplicates another existing one
    )) {
      showError(`A location with the identifier "${locationString}" already exists. Please choose a unique identifier.`);
      return;
    }

    try {
      const qrSvg = await generateQrCodeSvg(locationString, 150); // Generate QR for print

      const labelsToPrint: PrintContentData[] = Array.from({ length: numQuantity }).map(() => ({
        type: "location-label",
        props: {
          area,
          row,
          bay,
          level,
          pos,
          color: selectedColor,
          qrCodeSvg: qrSvg,
          printDate: format(new Date(), "MMM dd, yyyy HH:mm"),
          locationString,
        },
      }));

      if (onGenerateAndPrint) {
        onGenerateAndPrint(labelsToPrint);
      } else {
        for (const label of labelsToPrint) {
          initiatePrint(label);
        }
        showSuccess(`Generated and sent ${numQuantity} location labels to printer!`);
      }
    } catch (error: any) {
      showError(`Failed to generate labels: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4 flex-grow flex flex-col">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="area">Area (e.g., A, B, C)</Label>
          <Input id="area" value={area} onChange={(e) => setArea(e.target.value.toUpperCase())} placeholder="A" maxLength={2} aria-label="Location Area" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="row">Row (e.g., 01, 02)</Label>
          <Input id="row" value={row} onChange={(e) => setRow(e.target.value)} placeholder="01" maxLength={2} aria-label="Location Row" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bay">Bay (e.g., 01, 02)</Label>
          <Input id="bay" value={bay} onChange={(e) => setBay(e.target.value)} placeholder="01" maxLength={2} aria-label="Location Bay" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="level">Level (e.g., 1, 2, 3)</Label>
          <Input id="level" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="1" maxLength={2} aria-label="Location Level" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pos">Position (e.g., A, B, C)</Label>
          <Input id="pos" value={pos} onChange={(e) => setPos(e.target.value.toUpperCase())} placeholder="A" maxLength={2} aria-label="Location Position" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Label Color</Label>
          <Select value={selectedColor} onValueChange={setSelectedColor}>
            <SelectTrigger id="color" aria-label="Select label color">
              <SelectValue placeholder="Select a color" />
            </SelectTrigger>
            <SelectContent>
              {labelColors.map((c) => (
                <SelectItem key={c.hex} value={c.hex}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.hex }}></div>
                    {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Number of Labels to Print (1-100)</Label>
        <Input
          id="quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="1"
          min="1"
          max="100"
          aria-label="Number of labels to print"
        />
      </div>

      <div className="flex-grow flex flex-col items-center justify-center min-h-[150px] border border-dashed border-muted-foreground/50 rounded-md p-2">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Label Preview</h3>
        {qrCodeSvg ? (
          <div className="w-[50.8mm] h-[50.8mm] flex items-center justify-center overflow-hidden"> {/* Set preview container to 2x2 inches square */}
            <LocationLabelPdfContent
              area={area}
              row={row}
              bay={bay}
              level={level}
              pos={pos}
              color={selectedColor}
              qrCodeSvg={qrCodeSvg}
              printDate={format(new Date(), "MMM dd, yyyy HH:mm")}
              locationString={locationString}
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Enter details to see a preview.</p>
        )}
      </div>
      <Button onClick={handleGenerateAndPrint} className="w-full mt-auto" aria-label="Generate and print labels">
        <Printer className="h-4 w-4 mr-2" /> Generate & Print Labels
      </Button>
    </div>
  );
};

export default LocationLabelGenerator;