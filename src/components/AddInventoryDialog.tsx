"use client";

import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { showSuccess, showError } from "@/utils/toast";
import { useInventory } from "@/context/InventoryContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useCategories } from "@/context/CategoryContext";
import { useVendors } from "@/context/VendorContext";
import ManageLocationsDialog from "@/components/ManageLocationsDialog";
import { generateQrCodeSvg } from "@/utils/qrCodeGenerator"; // Import QR code generator
import { supabase } from "@/lib/supabaseClient"; // Import supabase client

interface AddInventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddInventoryDialog: React.FC<AddInventoryDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { addInventoryItem } = useInventory();
  const { locations } = useOnboarding();
  const { categories } = useCategories();
  const { vendors } = useVendors();

  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [pickingBinQuantity, setPickingBinQuantity] = useState("");
  const [overstockQuantity, setOverstockQuantity] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [pickingReorderLevel, setPickingReorderLevel] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [location, setLocation] = useState("");
  const [pickingBinLocation, setPickingBinLocation] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("none");
  const [barcodeValue, setBarcodeValue] = useState(""); // This will store the raw data for QR code
  const [qrCodeSvgPreview, setQrCodeSvgPreview] = useState<string | null>(null); // For displaying the generated QR
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlPreview, setImageUrlPreview] = useState<string | null>(null);
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(false);
  const [autoReorderQuantity, setAutoReorderQuantity] = useState("");

  const [isManageLocationsDialogOpen, setIsManageLocationsDialogOpen] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setItemName("");
      setDescription("");
      setSku("");
      setCategory("");
      setPickingBinQuantity("");
      setOverstockQuantity("");
      setReorderLevel("");
      setPickingReorderLevel("");
      setUnitCost("");
      setRetailPrice("");
      setLocation("");
      setPickingBinLocation("");
      setSelectedVendorId("none");
      setBarcodeValue("");
      setQrCodeSvgPreview(null);
      setImageFile(null);
      setImageUrlPreview(null);
      setAutoReorderEnabled(false);
      setAutoReorderQuantity("");
    }
  }, [isOpen]);

  // Autopopulate barcodeValue with SKU and generate QR preview
  useEffect(() => {
    const updateQrCode = async () => {
      const value = sku.trim();
      setBarcodeValue(value);
      if (value) {
        try {
          const svg = await generateQrCodeSvg(value, 100);
          setQrCodeSvgPreview(svg);
        } catch (error) {
          console.error("Error generating QR code preview:", error);
          setQrCodeSvgPreview(null);
        }
      } else {
        setQrCodeSvgPreview(null);
      }
    };
    updateQrCode();
  }, [sku]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageUrlPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        showError("Please select an image file (PNG, JPG, GIF, SVG).");
        setImageFile(null);
        setImageUrlPreview(null);
      }
    } else {
      setImageFile(null);
      setImageUrlPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (
      !itemName.trim() ||
      !sku.trim() ||
      !category.trim() ||
      !pickingBinQuantity ||
      !overstockQuantity ||
      !reorderLevel ||
      !pickingReorderLevel ||
      !unitCost ||
      !retailPrice ||
      !location ||
      !pickingBinLocation
    ) {
      showError("Please fill in all required fields.");
      return;
    }

    const parsedPickingBinQuantity = parseInt(pickingBinQuantity || '0');
    const parsedOverstockQuantity = parseInt(overstockQuantity || '0');
    const parsedReorderLevel = parseInt(reorderLevel || '0');
    const parsedPickingReorderLevel = parseInt(pickingReorderLevel || '0');
    const parsedUnitCost = parseFloat(unitCost || '0');
    const parsedRetailPrice = parseFloat(retailPrice || '0');
    const parsedAutoReorderQuantity = parseInt(autoReorderQuantity || '0');

    if (
      isNaN(parsedPickingBinQuantity) || parsedPickingBinQuantity < 0 ||
      isNaN(parsedOverstockQuantity) || parsedOverstockQuantity < 0 ||
      isNaN(parsedReorderLevel) || parsedReorderLevel < 0 ||
      isNaN(parsedPickingReorderLevel) || parsedPickingReorderLevel < 0 ||
      isNaN(parsedUnitCost) || parsedUnitCost < 0 ||
      isNaN(parsedRetailPrice) || parsedRetailPrice < 0 ||
      (autoReorderEnabled && (isNaN(parsedAutoReorderQuantity) || parsedAutoReorderQuantity <= 0))
    ) {
      showError("Please enter valid positive numbers for all quantity and price fields, and Auto-Reorder Quantity (if enabled).");
      return;
    }

    // Check for duplicate SKU before adding
    const { data: existingItem, error: fetchError } = await supabase
      .from('inventory_items')
      .select('sku')
      .eq('sku', sku.trim())
      .single();

    if (existingItem) {
      showError(`An item with SKU '${sku.trim()}' already exists. Please use a unique SKU.`);
      return;
    }
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means "no rows found", which is fine
      console.error("Error checking for duplicate SKU:", fetchError);
      showError("Failed to check for duplicate SKU. Please try again.");
      return;
    }

    const newItem = {
      name: itemName.trim(),
      description: description.trim(),
      sku: sku.trim(),
      category: category.trim(),
      pickingBinQuantity: parsedPickingBinQuantity,
      overstockQuantity: parsedOverstockQuantity,
      reorderLevel: parsedReorderLevel,
      pickingReorderLevel: parsedPickingReorderLevel,
      committedStock: 0,
      incomingStock: 0,
      unitCost: parsedUnitCost,
      retailPrice: parsedRetailPrice,
      location: location,
      pickingBinLocation: pickingBinLocation,
      imageUrl: imageUrlPreview || undefined,
      vendorId: selectedVendorId === "none" ? undefined : selectedVendorId,
      barcodeUrl: barcodeValue || undefined, // Store the raw barcode value
      autoReorderEnabled: autoReorderEnabled,
      autoReorderQuantity: parsedAutoReorderQuantity,
    };

    try {
      await addInventoryItem(newItem);
      showSuccess(`Added ${parsedPickingBinQuantity + parsedOverstockQuantity} of ${itemName} to inventory!`);
      onClose();
    } catch (error: any) {
      console.error("Failed to add inventory item:", error);
      showError("Failed to add item: " + (error.message || "Unknown error. Please check console for details."));
    }
  };

  const isFormInvalid =
    !itemName.trim() ||
    !sku.trim() ||
    !category.trim() ||
    !pickingBinQuantity ||
    !overstockQuantity ||
    !reorderLevel ||
    !pickingReorderLevel ||
    !unitCost ||
    !retailPrice ||
    !location ||
    !pickingBinLocation ||
    locations.length === 0 ||
    categories.length === 0 ||
    (autoReorderEnabled && (parseInt(autoReorderQuantity || '0') <= 0 || isNaN(parseInt(autoReorderQuantity || '0'))));

  const handleOpenManageLocations = () => {
    setIsManageLocationsDialogOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
          <DialogDescription>
            Enter details for the new item to add to your inventory. Fields marked with (*) are required.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="itemName">Item Name <span className="text-red-500">*</span></Label>
            <Input
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Laptop Pro X"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU <span className="text-red-500">*</span></Label>
            <Input
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g., LPX-512-16"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed product description..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
            <Select value={category} onValueChange={setCategory} disabled={categories.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-categories" disabled>
                    No categories set up. Manage categories.
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Main Storage Location <span className="text-red-500">*</span></Label>
            <Select value={location} onValueChange={setLocation} disabled={locations.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations.length > 0 ? (
                  locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-locations" disabled>
                    No locations set up.
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {locations.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                You need to set up inventory locations first.
                <Button variant="link" size="sm" onClick={handleOpenManageLocations} className="p-0 h-auto ml-1">
                  Manage Locations
                </Button>
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pickingBinLocation">Picking Bin Location <span className="text-red-500">*</span></Label>
            <Select value={pickingBinLocation} onValueChange={setPickingBinLocation} disabled={locations.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Select a picking bin location" />
              </SelectTrigger>
              <SelectContent>
                {locations.length > 0 ? (
                  locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-locations" disabled>
                    No locations set up.
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pickingBinQuantity">Picking Bin Quantity <span className="text-red-500">*</span></Label>
            <Input
              id="pickingBinQuantity"
              type="number"
              value={pickingBinQuantity}
              onChange={(e) => setPickingBinQuantity(e.target.value)}
              placeholder="e.g., 50"
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="overstockQuantity">Overstock Quantity <span className="text-red-500">*</span></Label>
            <Input
              id="overstockQuantity"
              type="number"
              value={overstockQuantity}
              onChange={(e) => setOverstockQuantity(e.target.value)}
              placeholder="e.g., 100"
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reorderLevel">Overall Reorder Level <span className="text-red-500">*</span></Label>
            <Input
              id="reorderLevel"
              type="number"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
              placeholder="e.g., 20"
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pickingReorderLevel">Picking Bin Reorder Level <span className="text-red-500">*</span></Label>
            <Input
              id="pickingReorderLevel"
              type="number"
              value={pickingReorderLevel}
              onChange={(e) => setPickingReorderLevel(e.target.value)}
              placeholder="e.g., 10"
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitCost">Unit Cost <span className="text-red-500">*</span></Label>
            <Input
              id="unitCost"
              type="number"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="e.g., 900.00"
              step="0.01"
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retailPrice">Retail Price <span className="text-red-500">*</span></Label>
            <Input
              id="retailPrice"
              type="number"
              value={retailPrice}
              onChange={(e) => setRetailPrice(e.target.value)}
              placeholder="e.g., 1200.00"
              step="0.01"
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor">Primary Vendor</Label>
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger id="vendor">
                <SelectValue placeholder="Select a vendor (Optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Vendor</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="barcodeValue">QR Code Value (from SKU)</Label>
            <Input
              id="barcodeValue"
              value={barcodeValue}
              onChange={(e) => setSku(e.target.value)} // Update SKU, which triggers QR generation
              placeholder="Enter SKU or custom value"
              disabled // Disable direct editing, it's tied to SKU
            />
            {qrCodeSvgPreview && (
              <div className="mt-2 p-2 border border-border rounded-md bg-muted/20 flex justify-center">
                <div dangerouslySetInnerHTML={{ __html: qrCodeSvgPreview }} />
              </div>
            )}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="itemImage">Product Image</Label>
            <Input
              id="itemImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imageUrlPreview && (
              <div className="mt-2">
                <img src={imageUrlPreview} alt="Product Preview" className="max-w-[100px] max-h-[100px] object-contain border border-border p-1 rounded-md" />
              </div>
            )}
          </div>
          <div className="space-y-2 md:col-span-2 border-t border-border pt-4 mt-4">
            <h3 className="text-lg font-semibold">Auto-Reorder Settings</h3>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="autoReorderEnabled">Enable Auto-Reorder</Label>
              <Switch
                id="autoReorderEnabled"
                checked={autoReorderEnabled}
                onCheckedChange={setAutoReorderEnabled}
              />
            </div>
            {autoReorderEnabled && (
              <div className="space-y-2 mt-2">
                <Label htmlFor="autoReorderQuantity">Quantity to Auto-Reorder</Label>
                <Input
                  id="autoReorderQuantity"
                  type="number"
                  value={autoReorderQuantity}
                  onChange={(e) => setAutoReorderQuantity(e.target.value)}
                  placeholder="e.g., 50"
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  This quantity will be ordered when stock drops to or below the overall reorder level.
                </p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isFormInvalid}>
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
      <ManageLocationsDialog
        isOpen={isManageLocationsDialogOpen}
        onClose={() => setIsManageLocationsDialogOpen(false)}
      />
    </Dialog>
  );
};

export default AddInventoryDialog;