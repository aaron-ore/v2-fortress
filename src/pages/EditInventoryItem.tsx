"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useInventory } from "@/context/InventoryContext";
import { useCategories } from "@/context/CategoryContext";
import { useVendors } from "@/context/VendorContext";
import { PlusCircle, Loader2 } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { generateQrCodeSvg } from "@/utils/qrCodeGenerator"; // Import QR code generator

const formSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  pickingBinQuantity: z.number().min(0, "Must be non-negative"),
  overstockQuantity: z.number().min(0, "Must be non-negative"),
  reorderLevel: z.number().min(0, "Must be non-negative"),
  pickingReorderLevel: z.number().min(0, "Must be non-negative"),
  committedStock: z.number().min(0, "Must be non-negative"),
  incomingStock: z.number().min(0, "Must be non-negative"),
  unitCost: z.number().min(0, "Must be non-negative"),
  retailPrice: z.number().min(0, "Must be non-negative"),
  location: z.string().min(1, "Location is required"),
  pickingBinLocation: z.string().min(1, "Picking bin location is required"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  vendorId: z.string().optional().or(z.literal("null-vendor")),
  autoReorderEnabled: z.boolean().default(false),
  autoReorderQuantity: z.number().min(0, "Must be non-negative").optional(),
});

const EditInventoryItem: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { inventoryItems, updateInventoryItem } = useInventory();
  const { categories, addCategory } = useCategories();
  const { vendors } = useVendors();
  const [itemNotFound, setItemNotFound] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [qrCodeSvg, setQrCodeSvg] = useState<string | undefined>(undefined); // State for QR code SVG

  const item = useMemo(() => inventoryItems.find((i) => i.id === id), [inventoryItems, id]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: useMemo(() => {
      if (item) {
        return {
          name: item.name,
          description: item.description || "",
          sku: item.sku,
          category: item.category,
          pickingBinQuantity: item.pickingBinQuantity,
          overstockQuantity: item.overstockQuantity,
          reorderLevel: item.reorderLevel,
          pickingReorderLevel: item.pickingReorderLevel,
          committedStock: item.committedStock,
          incomingStock: item.incomingStock,
          unitCost: item.unitCost,
          retailPrice: item.retailPrice,
          location: item.location,
          pickingBinLocation: item.pickingBinLocation,
          imageUrl: item.imageUrl || "",
          vendorId: item.vendorId || "null-vendor",
          autoReorderEnabled: item.autoReorderEnabled,
          autoReorderQuantity: item.autoReorderQuantity,
        };
      }
      return {
        name: "",
        description: "",
        sku: "",
        category: "",
        pickingBinQuantity: 0,
        overstockQuantity: 0,
        reorderLevel: 0,
        pickingReorderLevel: 0,
        committedStock: 0,
        incomingStock: 0,
        unitCost: 0,
        retailPrice: 0,
        location: "",
        pickingBinLocation: "",
        imageUrl: "",
        vendorId: "null-vendor",
        autoReorderEnabled: false,
        autoReorderQuantity: 0,
      };
    }, [item]),
  });

  useEffect(() => {
    if (!item && id) {
      setItemNotFound(true);
    } else if (item) {
      setItemNotFound(false);
      form.reset({
        ...item,
        vendorId: item.vendorId || "null-vendor",
      });
      // Generate QR code SVG from item.barcodeUrl (which now stores raw data)
      const generateAndSetQr = async () => {
        if (item.barcodeUrl) {
          try {
            const svg = await generateQrCodeSvg(item.barcodeUrl, 100);
            setQrCodeSvg(svg);
          } catch (error) {
            console.error("Error generating QR code for display:", error);
            setQrCodeSvg(undefined);
          }
        } else {
          setQrCodeSvg(undefined);
        }
      };
      generateAndSetQr();
    }
  }, [item, id, form]);

  const watchSku = form.watch("sku");
  useEffect(() => {
    // Regenerate QR code preview if SKU changes
    const generateAndSetQr = async () => {
      if (watchSku) {
        try {
          const svg = await generateQrCodeSvg(watchSku, 100);
          setQrCodeSvg(svg);
        } catch (error) {
          console.error("Error generating QR code preview:", error);
          setQrCodeSvg(undefined);
        }
      } else {
        setQrCodeSvg(undefined);
      }
    };
    generateAndSetQr();
  }, [watchSku]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!item) {
      showError("Item not found for update.");
      return;
    }
    setIsSaving(true);
    try {
      // Store the raw SKU value in barcodeUrl, not the SVG
      const finalBarcodeValue = values.sku || undefined;

      await updateInventoryItem({
        ...item,
        ...values,
        vendorId: values.vendorId === "null-vendor" ? undefined : values.vendorId,
        barcodeUrl: finalBarcodeValue, // Store raw SKU value
      });
      showSuccess("Inventory item updated successfully!");
      navigate("/inventory");
    } catch (error: any) {
      console.error("Failed to update inventory item:", error);
      showError(`Failed to update item: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      const newCat = await addCategory(newCategoryName.trim());
      if (newCat) {
        form.setValue("category", newCat.name);
        setNewCategoryName("");
        setIsAddingCategory(false);
      }
    }
  };

  if (itemNotFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <h1 className="text-4xl font-bold text-destructive">404</h1>
        <p className="text-xl text-muted-foreground">Inventory Item Not Found</p>
        <Button onClick={() => navigate("/inventory")}>Back to Inventory</Button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading item details...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Inventory Item: {item.name}</h1>
        <Button variant="outline" onClick={() => navigate("/inventory")}>
          Back to Inventory
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Item Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Basic Information</h2>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {qrCodeSvg && (
                <FormItem>
                  <FormLabel>QR Code</FormLabel>
                  <FormControl>
                    <div dangerouslySetInnerHTML={{ __html: qrCodeSvg }} className="max-w-[100px] h-auto border p-2 rounded-md bg-white" />
                  </FormControl>
                  <FormDescription>This QR code is generated from the SKU.</FormDescription>
                </FormItem>
              )}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="add-new-category" onClick={() => setIsAddingCategory(true)}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Add New Category
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isAddingCategory && (
                <div className="flex space-x-2">
                  <Input
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <Button type="button" onClick={handleAddCategory}>
                    Add
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddingCategory(false)}>
                    Cancel
                  </Button>
                </div>
              )}
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vendor (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null-vendor">None</SelectItem>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Stock & Pricing */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Stock & Pricing</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pickingBinQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Picking Bin Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value || '0'))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="overstockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overstock Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value || '0'))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reorderLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Level (Total)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value || '0'))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pickingReorderLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Picking Reorder Level</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value || '0'))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="committedStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Committed Stock</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value || '0'))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="incomingStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incoming Stock</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value || '0'))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value || '0'))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="retailPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retail Price</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value || '0'))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pickingBinLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Picking Bin Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="autoReorderEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable Auto-Reorder</FormLabel>
                      <FormDescription>
                        Automatically create purchase orders when stock hits reorder level.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              {form.watch("autoReorderEnabled") && (
                <FormField
                  control={form.control}
                  name="autoReorderQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auto-Reorder Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value || '0'))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default EditInventoryItem;