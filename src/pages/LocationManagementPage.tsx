import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, QrCode, Palette, PlusCircle, Trash2, MapPin } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { usePrint } from "@/context/PrintContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { generateQrCodeSvg } from "@/utils/qrCodeGenerator";
import { format } from "date-fns";
import LocationLabelPdfContent from "@/components/LocationLabelPdfContent";
import ConfirmDialog from "@/components/ConfirmDialog";

// Predefined colors for labels, matching some of the designs
const labelColors = [
  { name: "Green", hex: "#4CAF50" },
  { name: "Blue", hex: "#2196F3" },
  { name: "Purple", hex: "#9C27B0" },
  { name: "Yellow", hex: "#FFEB3B" },
  { name: "Red", hex: "#F44336" },
  { name: "Orange", hex: "#FF9800" },
];

const LocationManagementPage: React.FC = () => {
  const { initiatePrint } = usePrint();
  const { companyProfile, locations, addLocation, removeLocation } = useOnboarding();

  // State for adding new locations
  const [newLocationName, setNewLocationName] = useState("");
  // State for deleting existing locations
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);

  // States for label generation
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
  useEffect(() => {
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

  // Handlers for adding/removing locations
  const handleAddLocation = () => {
    if (newLocationName.trim() === "") {
      showError("Location name cannot be empty.");
      return;
    }
    if (locations.some(loc => loc.toLowerCase() === newLocationName.trim().toLowerCase())) {
      showError("This location already exists.");
      return;
    }
    addLocation(newLocationName.trim());
    showSuccess(`Location "${newLocationName.trim()}" added.`);
    setNewLocationName("");
  };

  const handleRemoveLocationClick = (location: string) => {
    setLocationToDelete(location);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmRemoveLocation = () => {
    if (locationToDelete) {
      removeLocation(locationToDelete);
      showSuccess(`Location "${locationToDelete}" removed.`);
    }
    setIsConfirmDeleteDialogOpen(false);
    setLocationToDelete(null);
  };

  // Handler for generating and printing labels
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

      const labelsToPrint = Array.from({ length: numQuantity }).map(() => ({
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

      for (const label of labelsToPrint) {
        initiatePrint(label);
      }
      showSuccess(`Generated and sent ${numQuantity} location labels to printer!`);
    } catch (error: any) {
      showError(`Failed to generate labels: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 p-6">
      <h1 className="text-3xl font-bold">Location Management</h1>
      <p className="text-muted-foreground">Manage your inventory storage locations and generate QR code labels for them.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow">
        {/* Manage Locations Card */}
        <Card className="bg-card border-border shadow-sm flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Existing Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 flex-grow flex flex-col">
            <div className="space-y-2">
              <Label htmlFor="newLocation">Add New Location</Label>
              <div className="flex gap-2">
                <Input
                  id="newLocation"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="e.g., Main Warehouse, Shelf A"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddLocation();
                    }
                  }}
                />
                <Button onClick={handleAddLocation} aria-label="Add new location">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {locations.length > 0 && (
              <div className="space-y-2 flex-grow flex flex-col">
                <Label>Current Locations</Label>
                <ScrollArea className="flex-grow border border-border rounded-md p-3 bg-muted/20">
                  <ul className="space-y-1">
                    {locations.map((loc, index) => (
                      <li key={index} className="flex items-center justify-between py-1 text-foreground">
                        <span>{loc}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLocationClick(loc)}
                          aria-label={`Remove location ${loc}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Labels Card */}
        <Card className="bg-card border-border shadow-sm flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <QrCode className="h-5 w-5 text-accent" /> Generate Location Labels
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 flex-grow flex flex-col">
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
                <div className="scale-75">
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
          </CardContent>
        </Card>
      </div>

      {locationToDelete && (
        <ConfirmDialog
          isOpen={isConfirmDeleteDialogOpen}
          onClose={() => setIsConfirmDeleteDialogOpen(false)}
          onConfirm={confirmRemoveLocation}
          title="Confirm Location Deletion"
          description={`Are you sure you want to delete the location "${locationToDelete}"? This cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default LocationManagementPage;