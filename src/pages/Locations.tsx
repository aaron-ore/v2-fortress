import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Trash2, MapPin, QrCode, Printer } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useOnboarding } from "@/context/OnboardingContext";
import { usePrint, PrintContentData } from "@/context/PrintContext";
import LocationLabelGenerator from "@/components/LocationLabelGenerator"; // Import the new component
import { parseLocationString, LocationParts } from "@/utils/locationParser"; // NEW: Import parseLocationString and LocationParts

const Locations: React.FC = () => {
  const { locations, addLocation, removeLocation } = useOnboarding();
  const { initiatePrint } = usePrint();

  const [newLocationName, setNewLocationName] = useState("");
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);

  const [selectedLocationForLabel, setSelectedLocationForLabel] = useState<string | null>(null);

  // Parse location string into its components for the label generator
  // MOVED: This function is now imported from locationParser.ts
  // const parseLocationString = (locationStr: string) => {
  //   const parts = locationStr.split('-');
  //   return {
  //     area: parts[0] || "A",
  //     row: parts[1] || "01",
  //     bay: parts[2] || "01",
  //     level: parts[3] || "1",
  //     pos: parts[4] || "A",
  //   };
  // };

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
    setSelectedLocationForLabel(newLocationName.trim()); // Automatically select for label generation
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
      if (selectedLocationForLabel === locationToDelete) {
        setSelectedLocationForLabel(null); // Deselect if the deleted one was selected
      }
    }
    setIsConfirmDeleteDialogOpen(false);
    setLocationToDelete(null);
  };

  const handleEditLabelClick = (location: string) => {
    setSelectedLocationForLabel(location);
  };

  const handleGenerateAndPrintFromGenerator = (labelsToPrint: PrintContentData[]) => {
    for (const label of labelsToPrint) {
      initiatePrint(label);
    }
    showSuccess(`Generated and sent ${labelsToPrint.length} location labels to printer!`);
  };

  const initialLabelProps: Partial<LocationParts> = useMemo(() => { // Explicitly type as Partial<LocationParts>
    if (selectedLocationForLabel) {
      return parseLocationString(selectedLocationForLabel);
    }
    return { area: "A", row: "01", bay: "01", level: "1", pos: "A" }; // Default values if no location is selected
  }, [selectedLocationForLabel]);

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
                  onChange={(e) => setNewLocationName(e.target.value.toUpperCase())}
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
                        <Button
                          variant="ghost"
                          className="p-0 h-auto text-left font-normal hover:underline"
                          onClick={() => handleEditLabelClick(loc)}
                        >
                          {loc}
                        </Button>
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
          <CardContent className="p-4 flex-grow flex flex-col">
            <LocationLabelGenerator
              initialArea={initialLabelProps.area}
              initialRow={initialLabelProps.row}
              initialBay={initialLabelProps.bay}
              initialLevel={initialLabelProps.level}
              initialPos={initialLabelProps.pos}
              onGenerateAndPrint={handleGenerateAndPrintFromGenerator}
            />
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

export default Locations;