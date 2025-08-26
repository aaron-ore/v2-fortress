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
import { showSuccess, showError } from "@/utils/toast";
import { useInventory } from "@/context/InventoryContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useCategories } from "@/context/CategoryContext";
import { useVendors } from "@/context/VendorContext"; // New import
import ManageLocationsDialog from "@/components/ManageLocationsDialog";
import JsBarcode from "jsbarcode"; // New import

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
  const { vendors } = useVendors(); // Use vendors from context

  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [location, setLocation] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("none"); // Changed initial state to "none"
  const [barcodeValue, setBarcodeValue] = useState(""); // Value to generate barcode from
  const [barcodeSvg, setBarcodeSvg] = useState<string | null>(null); // Generated barcode SVG
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlPreview, setImageUrlPreview] = useState<string | null>(null);

  const [isManageLocationsDialogOpen, setIsManageLocationsDialogOpen] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setItemName("");
      setDescription("");
      setSku("");
      setCategory("");
      setQuantity("");
      setReorderLevel("");
      setUnitCost("");
      setRetailPrice("");
      setLocation("");
      setSelectedVendorId("none"); // Changed reset value to "none"
      setBarcodeValue("");
      setBarcodeSvg(null);
      setImageFile(null);
      setImageUrlPreview(null);
    }
  }, [isOpen]);

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

  const handleGenerateBarcode = () => {
    if (!barcodeValue.trim()) {
      showError("Please enter a value to generate the barcode (e.g., SKU).");
      setBarcodeSvg(null);
      return;
    }
    try {
      const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      JsBarcode(svgElement, barcodeValue.trim(), {
        format: "CODE128",
        displayValue: true,
        height: 50,
        width: 2,
        margin: 0,
      });
      setBarcodeSvg(svgElement.outerHTML);
      showSuccess("Barcode generated!");
    } catch (error: any) {
      showError(`Failed to generate barcode: ${error.message}`);
      setBarcodeSvg(null);
    }
  };

  const handleSubmit = async () => {
    if (
      !itemName.trim() ||
      !sku.trim() ||
      !category.trim() ||
      !quantity ||
      !reorderLevel ||
      !unitCost ||
      !retailPrice ||
      !location
    ) {
      showError("Please fill in all required fields.");
      return;
    }

    const parsedQuantity = parseInt(quantity);
    const parsedReorderLevel = parseInt(reorderLevel);
    const parsedUnitCost = parseFloat(unitCost);
    const parsedRetailPrice = parseFloat(retailPrice);

    if (
      isNaN(parsedQuantity) || parsedQuantity < 0 ||
      isNaN(parsedReorderLevel) || parsedReorderLevel < 0 ||
      isNaN(parsedUnitCost) || parsedUnitCost < 0 ||
      isNaN(parsedRetailPrice) || parsedRetailPrice < 0
    ) {
      showError("Please enter valid positive numbers for Quantity, Reorder Level, Unit Cost, and Retail Price.");
      return;
    }

    const newItem = {
      name: itemName.trim(),
      description: description.trim(),
      sku: sku.trim(),
      category: category.trim(),
      quantity: parsedQuantity,
      reorderLevel: parsedReorderLevel,
      committedStock: 0,
      incomingStock: 0,
      unitCost: parsedUnitCost,
      retailPrice: parsedRetailPrice,
      location: location,
      imageUrl: imageUrlPreview || undefined,
      vendorId: selectedVendorId === "none" ? undefined : selectedVendorId, // Adjusted logic
      barcodeUrl: barcodeSvg || undefined, // Include generated barcode SVG
    };

    await addInventoryItem(newItem);
    showSuccess(`Added ${parsedQuantity} of ${itemName} to inventory!`); // Added success toast here
    onClose();
  };

  const isFormInvalid =
    !itemName.trim() ||
    !sku.trim() ||
    !category.trim() ||
    !quantity ||
    !reorderLevel ||
    !unitCost ||
    !retailPrice ||
    !location ||
    locations.length === 0 ||
    categories.length === 0;

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
            <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
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
            <Label htmlFor="quantity">Quantity <span className="text-red-500">*</span></Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g., 100"
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reorderLevel">Reorder Level <span className="text-red-500">*</span></Label>
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
                <SelectItem value="none">No Vendor</SelectItem> {/* Changed value to "none" */}
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