import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, QrCode, Palette } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { usePrint } from "@/context/PrintContext";
import { useOnboarding } from "@/context/OnboardingContext"; // For company profile
import { generateQrCodeSvg } from "@/utils/qrCodeGenerator";
import { format } from "date-fns";
import LocationLabelPdfContent from "@/components/LocationLabelPdfContent"; // Import the new PDF content component

// Predefined colors for labels, matching some of the designs
const labelColors = [
  { name: "Green", hex: "#4CAF50" },
  { name: "Blue", hex: "#2196F3" },
  { name: "Purple", hex: "#9C27B0" },
  { name: "Yellow", hex: "#FFEB3B" },
  { name: "Red", hex: "#F44336" },
  { name: "Orange", hex: "#FF9800" },
];

const LocationLabelGenerator: React.FC = () => {
  const { initiatePrint } = usePrint();
  const { companyProfile } = useOnboarding();

  const [area, setArea] = useState("A");
  const [row, setRow] = useState("01");
  const [bay, setBay] = useState("01");
  const [level, setLevel] = useState("1");
  const [pos, setPos] = useState("A");
  const [selectedColor, setSelectedColor] = useState(labelColors[0].hex);
  const [quantity, setQuantity] = useState("1");
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);

  const locationString = useMemo(() => {
    return `${area}-${row}-${bay}-${level}-${pos}`;
  }, [area, row, bay, level, pos]);

  // Generate QR code for preview
  React.useEffect(() => {
    const generatePreviewQr = async () => {
      if (locationString) {
        try {
          const svg = await generateQrCodeSvg(locationString, 100);
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

    try {
      const qrSvg = await generateQrCodeSvg(locationString, 128); // Generate QR for print

      const labelsToPrint = Array.from({ length: numQuantity }).map((_, index) => ({
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

      // Initiate print for each label. For simplicity, we'll print them one by one.
      // In a real-world scenario, you might batch them or generate a single PDF with multiple pages.
      for (const label of labelsToPrint) {
        initiatePrint(label);
        // Add a small delay between prints if needed, but window.print() is blocking
        // await new Promise(resolve => setTimeout(resolve, 100));
      }
      showSuccess(`Generated and sent ${numQuantity} location labels to printer!`);
    } catch (error: any) {
      showError(`Failed to generate labels: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <h2 className="text-xl font-bold text-center">Generate Location Labels</h2>

      <ScrollArea className="flex-grow pb-4">
        <div className="space-y-4 pr-2">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" /> Label Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area">Area (e.g., A, B, C)</Label>
                  <Input id="area" value={area} onChange={(e) => setArea(e.target.value.toUpperCase())} placeholder="A" maxLength={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="row">Row (e.g., 01, 02)</Label>
                  <Input id="row" value={row} onChange={(e) => setRow(e.target.value)} placeholder="01" maxLength={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bay">Bay (e.g., 01, 02)</Label>
                  <Input id="bay" value={bay} onChange={(e) => setBay(e.target.value)} placeholder="01" maxLength={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Level (e.g., 1, 2, 3)</Label>
                  <Input id="level" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="1" maxLength={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pos">Position (e.g., A, B, C)</Label>
                  <Input id="pos" value={pos} onChange={(e) => setPos(e.target.value.toUpperCase())} placeholder="A" maxLength={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Label Color</Label>
                  <Select value={selectedColor} onValueChange={setSelectedColor}>
                    <SelectTrigger id="color">
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
                />
              </div>
            </CardContent>
          </Card>

          {/* Label Preview */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5 text-accent" /> Label Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex justify-center items-center min-h-[150px]">
              {qrCodeSvg ? (
                <div className="scale-75 border border-dashed border-muted-foreground p-2">
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
                <p className="text-muted-foreground">Enter details to see a preview.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <div className="mt-6">
        <Button onClick={handleGenerateAndPrint} className="w-full">
          <Printer className="h-4 w-4 mr-2" /> Generate & Print Labels
        </Button>
      </div>
    </div>
  );
};

export default LocationLabelGenerator;