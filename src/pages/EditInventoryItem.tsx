import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; // NEW: Import Switch
import { showSuccess, showError } from "@/utils/toast";
import { useInventory, InventoryItem } from "@/context/InventoryContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useCategories } from "@/context/CategoryContext";
import { useVendors } from "@/context/VendorContext";
import JsBarcode from "jsbarcode";

const EditInventoryItem: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { inventoryItems, updateInventoryItem } = useInventory();
  const { locations } = useOnboarding();
  const { categories } = useCategories();
  const { vendors } = useVendors();

  const [item, setItem] = useState<InventoryItem | null>(null);

  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [committedStock, setCommittedStock] = useState("");
  const [incomingStock, setIncomingStock] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [location, setLocation] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("none");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [barcodeSvg, setBarcodeSvg] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlPreview, setImageUrlPreview] = useState<string | null>(null);
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(false); // NEW: State for auto-reorder
  const [autoReorderQuantity, setAutoReorderQuantity] = useState(""); // NEW: State for auto-reorder quantity

  useEffect(() => {
    if (id) {
      const foundItem = inventoryItems.find((invItem) => invItem.id === id);
      if (foundItem) {
        setItem(foundItem);
        setItemName(foundItem.name);
        setDescription(foundItem.description);
        setSku(foundItem.sku);
        setCategory(foundItem.category);
        setQuantity(foundItem.quantity.toString());
        setReorderLevel(foundItem.reorderLevel.toString());
        setCommittedStock(foundItem.committedStock.toString());
        setIncomingStock(foundItem.incomingStock.toString());
        setUnitCost(foundItem.unitCost.toString());
        setRetailPrice(foundItem.retailPrice.toString());
        setLocation(foundItem.location);
        setImageUrlPreview(foundItem.imageUrl || null);
        setSelectedVendorId(foundItem.vendorId || "none");
        setBarcodeSvg(foundItem.barcodeUrl || null);
        if (foundItem.barcodeUrl) {
          setBarcodeValue(foundItem.sku);
        }
        setAutoReorderEnabled(foundItem.autoReorderEnabled); // Set new field
        setAutoReorderQuantity(foundItem.autoReorderQuantity.toString()); // Set new field
      } else {
        showError("Inventory item not found.");
        navigate("/inventory");
      }
    }
  }, [id, inventoryItems, navigate]);

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

  const handleSubmit = () => {
    if (
      !itemName ||
      !sku ||
      !category ||
      !quantity ||
      !reorderLevel ||
      !committedStock ||
      !incomingStock ||
      !unitCost ||
      !retailPrice ||
      !location
    ) {
      showError("Please fill in all required fields.");
      return;
    }

    const parsedAutoReorderQuantity = parseInt(autoReorderQuantity) || 0;
    if (autoReorderEnabled && (isNaN(parsedAutoReorderQuantity) || parsedAutoReorderQuantity <= 0)) {
      showError("Please enter a valid positive number for Auto-Reorder Quantity if auto-reorder is enabled.");
      return;
    }

    if (item) {
      const updatedItem: InventoryItem = {
        ...item,
        name: itemName,
        description: description,
        sku: sku,
        category: category,
        quantity: parseInt(quantity),
        reorderLevel: parseInt(reorderLevel),
        committedStock: parseInt(committedStock),
        incomingStock: parseInt(incomingStock),
        unitCost: parseFloat(unitCost),
        retailPrice: parseFloat(retailPrice),
        location: location,
        imageUrl: imageUrlPreview || undefined,
        vendorId: selectedVendorId === "none" ? undefined : selectedVendorId,
        barcodeUrl: barcodeSvg || undefined,
        autoReorderEnabled: autoReorderEnabled, // Include new field
        autoReorderQuantity: parsedAutoReorderQuantity, // Include new field
      };
      updateInventoryItem(updatedItem);
      showSuccess(`Updated ${itemName}!`);
      navigate("/inventory");
    }
  };

  if (!item) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Loading item details...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Inventory Item: {item.name}</h1>

      <Card className="bg-card border-border rounded-lg shadow-sm p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Item Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
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
            <Label htmlFor="location">Location</Label>
            <Select value={location} onValueChange={setLocation}>
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
                    No locations set up. Go to Onboarding.
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reorderLevel">Reorder Level</Label>
            <Input
              id="reorderLevel"
              type="number"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="committedStock">Committed Stock</Label>
            <Input
              id="committedStock"
              type="number"
              value={committedStock}
              onChange={(e) => setCommittedStock(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="incomingStock">Incoming Stock</Label>
            <Input
              id="incomingStock"
              type="number"
              value={incomingStock}
              onChange={(e) => setIncomingStock(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitCost">Unit Cost</Label>
            <Input
              id="unitCost"
              type="number"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retailPrice">Retail Price</Label>
            <Input
              id="retailPrice"
              type="number"
              value={retailPrice}
              onChange={(e) => setRetailPrice(e.target.value)}
              step="0.01"
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
                <img src={imageUrlPreview} alt="Product Preview" className="max-w-[150px] max-h-[100px] object-contain border border-border p-1 rounded-md" />
              </div>
            )}
          </div>
          {/* NEW: Auto-Reorder Section */}
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
                  This quantity will be ordered when stock drops to or below the reorder level.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => navigate("/inventory")}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Save Changes</Button>
      </div>
    </div>
  );
};

export default EditInventoryItem;