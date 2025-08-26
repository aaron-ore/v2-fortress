import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/ConfirmDialog"; // Import ConfirmDialog
import { useOnboarding } from "@/context/OnboardingContext";
import { showSuccess, showError } from "@/utils/toast";
import { PlusCircle, Trash2, MapPin } from "lucide-react";

interface ManageLocationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageLocationsDialog: React.FC<ManageLocationsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { locations, addLocation, removeLocation } = useOnboarding();
  const [newLocationName, setNewLocationName] = useState("");

  // State for delete confirmation dialog
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> Manage Inventory Locations
          </DialogTitle>
          <DialogDescription>
            Add, view, or remove your inventory storage locations.
          </DialogDescription>
        </DialogHeader>
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
              <Button onClick={handleAddLocation}>
                <PlusCircle className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
          </div>

          {locations.length > 0 && (
            <div className="space-y-2">
              <Label>Existing Locations</Label>
              <ul className="border border-border rounded-md p-3 bg-muted/20 max-h-40 overflow-y-auto">
                {locations.map((loc, index) => (
                  <li key={index} className="flex items-center justify-between py-1 text-foreground">
                    <span>{loc}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLocationClick(loc)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
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
    </Dialog>
  );
};

export default ManageLocationsDialog;