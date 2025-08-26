import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/context/OnboardingContext";
import { showSuccess, showError } from "@/utils/toast";
import { XCircle } from "lucide-react";

interface LocationSetupStepProps {
  onNext: () => void;
  onBack: () => void;
}

const LocationSetupStep: React.FC<LocationSetupStepProps> = ({ onNext, onBack }) => {
  const { locations, addLocation, removeLocation } = useOnboarding();
  const [newLocationName, setNewLocationName] = useState("");

  const handleAddLocation = () => {
    if (newLocationName.trim() === "") {
      showError("Location name cannot be empty.");
      return;
    }
    if (locations.includes(newLocationName.trim())) {
      showError("This location already exists.");
      return;
    }
    addLocation(newLocationName.trim());
    showSuccess(`Added location: ${newLocationName.trim()}`);
    setNewLocationName("");
  };

  const handleRemoveLocation = (location: string) => {
    removeLocation(location);
    showSuccess(`Removed location: ${location}`);
  };

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold text-foreground">Warehouse & Location Setup</h2>
      <p className="text-muted-foreground">Define your inventory storage locations (e.g., Main Warehouse, Store Front, Bin A1).</p>

      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="newLocation">New Location Name</Label>
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
            <Button onClick={handleAddLocation}>Add</Button>
          </div>
        </div>

        {locations.length > 0 && (
          <div className="space-y-2">
            <Label>Current Locations</Label>
            <ul className="border border-border rounded-md p-3 bg-muted/20 max-h-40 overflow-y-auto">
              {locations.map((loc, index) => (
                <li key={index} className="flex items-center justify-between py-1 text-foreground">
                  <span>{loc}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveLocation(loc)}>
                    <XCircle className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </div>
  );
};

export default LocationSetupStep;