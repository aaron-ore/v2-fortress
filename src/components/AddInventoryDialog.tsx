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
import JsBarcode from "jsbarcode";
import { generateQrCodeSvg } from "@/utils/qrCodeGenerator"; // NEW: Import QR code generator

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
  const [pickingBinQuantity, setPickingBinQuantity] = useState(""); // NEW
  const [overstockQuantity, setOverstockQuantity] = useState(""); // NEW
  const [reorderLevel, setReorderLevel] = useState("");
  const [pickingReorderLevel, setPickingReorderLevel] = useState(""); // NEW
  const [unitCost, setUnitCost] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [location, setLocation] = useState("");
  const [pickingBinLocation, setPickingBinLocation] = useState(""); // NEW
  const [selectedVendorId, setSelectedVendorId] = useState("none");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [barcodeType, setBarcodeType] = useState<"CODE128" | "QR">("CODE128");
  const [barcodeSvg, setBarcodeSvg] = useState<string | null>(null);
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
      setPickingBinQuantity(""); // NEW
      setOverstockQuantity(""); // NEW
      setReorderLevel("");
      setPickingReorderLevel(""); // NEW
      setUnitCost("");
      setRetailPrice("");
      setLocation("");
      setPickingBinLocation(""); // NEW
      setSelectedVendorId("none");
      setBarcodeValue("");
      setBarcodeType("CODE128");
      setBarcodeSvg(null);
      setImageFile(null);
      setImageUrlPreview(null);
      setAutoReorderEnabled(false);
      setAutoReorderQuantity("");
    }
  }, [isOpen]);

  // Autopopulate barcodeValue with SKU
  useEffect(() => {
    setBarcodeValue(sku.trim());
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

  const handleGenerateBarcode = async () => {
    if (!barcodeValue.trim()) {
      showError("Please enter a value to generate the barcode/QR code (e.g., SKU).");
      setBarcodeSvg(null);
      return;
    }
    try {
      if (barcodeType === "CODE128") {
        const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        JsBarcode(svgElement, barcodeValue.trim(), {
          format: "CODE128",
          displayValue: true,
          height: 50,
          width: 2,
          margin: 0,
        });
        setBarcodeSvg(svgElement.outerHTML);
      } else {
        const qrSvg = await generateQrCodeSvg(barcodeValue.trim(), 100);
        setBarcodeSvg(qrSvg);
      }
      showSuccess(`${barcodeType === "CODE128" ? "Barcode" : "QR Code"} generated!`);
    } catch (error: any) {
      showError(`Failed to generate ${barcodeType === "CODE128" ? "barcode" : "QR code"}: ${error.message}`);
      setBarcodeSvg(null);
    }
  };

  const handleSubmit = async () => {
    if (
      !itemName.trim() ||
      !sku.trim() ||
      !category.trim() ||
      !pickingBinQuantity || // NEW
      !overstockQuantity || // NEW
      !reorderLevel ||
      !pickingReorderLevel || // NEW
      !unitCost ||
      !retailPrice ||
      !location ||
      !pickingBinLocation // NEW
    ) {
      showError("Please fill in all required fields.");
      return;
    }

    const parsedPickingBinQuantity = parseInt(pickingBinQuantity || '0'); // NEW: Default to '0'
    const parsedOverstockQuantity = parseInt(overstockQuantity || '0'); // NEW: Default to '0'
    const parsedReorderLevel = parseInt(reorderLevel || '0');
    const parsedPickingReorderLevel = parseInt(pickingReorderLevel || '0'); // NEW: Default to '0'
    const parsedUnitCost = parseFloat(unitCost || '0');
    const parsedRetailPrice = parseFloat(retailPrice || '0');
    const parsedAutoReorderQuantity = parseInt(autoReorderQuantity || '0');

    if (
      isNaN(parsedPickingBinQuantity) || parsedPickingBinQuantity < 0 || // NEW
      isNaN(parsedOverstockQuantity) || parsedOverstockQuantity < 0 || // NEW
      isNaN(parsedReorderLevel) || parsedReorderLevel < 0 ||
      isNaN(parsedPickingReorderLevel) || parsedPickingReorderLevel < 0 || // NEW
      isNaN(parsedUnitCost) || parsedUnitCost < 0 ||
      isNaN(parsedRetailPrice) || parsedRetailPrice < 0 ||
      (autoReorderEnabled && (isNaN(parsedAutoReorderQuantity) || parsedAutoReorderQuantity <= 0))
    ) {
      showError("Please enter valid positive numbers for all quantity and price fields, and Auto-Reorder Quantity (if enabled).");
      return;
    }

    const newItem = {
      name: itemName.trim(),
      description: description.trim(),
      sku: sku.trim(),
      category: category.trim(),
      pickingBinQuantity: parsedPickingBinQuantity, // NEW
      overstockQuantity: parsedOverstockQuantity, // NEW
      reorderLevel: parsedReorderLevel,
      pickingReorderLevel: parsedPickingReorderLevel, // NEW
      committedStock: 0,
      incomingStock: 0,
      unitCost: parsedUnitCost,
      retailPrice: parsedRetailPrice,
      location: location,
      pickingBinLocation: pickingBinLocation, // NEW
      imageUrl: imageUrlPreview || undefined,
      vendorId: selectedVendorId === "none" ? undefined : selectedVendorId,
      barcodeUrl: barcodeSvg || undefined,
      autoReorderEnabled: autoReorderEnabled,
      autoReorderQuantity: parsedAutoReorderQuantity,
    };

    await addInventoryItem(newItem);
    showSuccess(`Added ${parsedPickingBinQuantity + parsedOverstockQuantity} of ${itemName} to inventory!`);
    onClose();
  };

  const isFormInvalid =
    !itemName.trim() ||
    !sku.trim() ||
    !category.trim() ||
    !pickingBinQuantity || // NEW
    !overstockQuantity || // NEW
    !reorderLevel ||
    !pickingReorderLevel || // NEW
    !unitCost ||
    !retailPrice ||
    !location ||
    !pickingBinLocation || // NEW
    locations.length === 0 ||
    categories.length === 0 ||
    (autoReorderEnabled && (parseInt(autoReorderQuantity || '0') <= 0 || isNaN(parseInt(autoReorderQuantity || '0')))); // NEW: Default to '0'

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
            <Label htmlFor="barcodeValue">Barcode/QR Value</Label>
            <div className="flex gap-2">
              <Input
                id="barcodeValue"
                value={barcodeValue}
                onChange={(e) => setBarcodeValue(e.target.value)}
                placeholder="Enter SKU or custom value"
              />
              <Select value={barcodeType} onValueChange={(value: "CODE128" | "QR") => setBarcodeType(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CODE128">Barcode</SelectItem>
                  <SelectItem value="QR">QR Code</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" onClick={handleGenerateBarcode} variant="outline">
                Generate
              </Button>
            </div>
            {barcodeSvg && (
              <div className="mt-2 p-2 border border-border rounded-md bg-muted/20 flex justify-center">
                <div dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
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