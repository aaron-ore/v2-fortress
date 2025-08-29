import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Search, Info, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"; // Added Eye, Edit, Trash2
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useInventory, InventoryItem } from "@/context/InventoryContext";
import { useCategories } from "@/context/CategoryContext";
import { useVendors } from "@/context/VendorContext";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMutation } from "@tanstack/react-query";
import { showError, showSuccess } from "@/utils/toast";
import { generateBarcodeSvgDataUri } from "@/utils/barcode"; // Import barcode utility

const formSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  pickingBinQuantity: z.number().min(0, "Must be non-negative"),
  overstockQuantity: z.number().min(0, "Must be non-negative"),
  reorderLevel: z.number().min(0, "Must be non-negative"),
  pickingReorderLevel: z.number().min(0, "Must be non-negative"),
  unitCost: z.number().min(0, "Must be non-negative"),
  retailPrice: z.number().min(0, "Must be non-negative"),
  location: z.string().min(1, "Location is required"),
  pickingBinLocation: z.string().min(1, "Picking bin location is required"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  vendorId: z.string().optional().or(z.literal("")),
  autoReorderEnabled: z.boolean().default(false),
  autoReorderQuantity: z.number().min(0, "Must be non-negative").optional(),
});

interface AddItemFormProps {
  onClose: () => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onClose }) => {
  const { addInventoryItem } = useInventory();
  const { categories, addCategory } = useCategories();
  const { vendors } = useVendors();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      category: "",
      pickingBinQuantity: 0,
      overstockQuantity: 0,
      reorderLevel: 0,
      pickingReorderLevel: 0,
      unitCost: 0,
      retailPrice: 0,
      location: "",
      pickingBinLocation: "",
      imageUrl: "",
      vendorId: "",
      autoReorderEnabled: false,
      autoReorderQuantity: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      let finalBarcodeUrl = "";
      if (values.sku) {
        finalBarcodeUrl = generateBarcodeSvgDataUri(values.sku);
      }
      await addInventoryItem({ ...values, barcodeUrl: finalBarcodeUrl });
    },
    onSuccess: () => {
      // Success toast is handled inside addInventoryItem now
      onClose();
      form.reset();
    },
    onError: (error) => {
      showError(`Failed to add item: ${error.message}`);
    },
  });

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(mutation.mutate)} className="space-y-4">
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setIsAddingCategory(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Category
                  </DropdownMenuItem>
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
                  <SelectItem value="">None</SelectItem>
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pickingBinQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Picking Bin Quantity</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                  <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                  <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                  <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                  <Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                  <Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                  <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Adding Item..." : "Add Item"}
        </Button>
      </form>
    </Form>
  );
};

export const createInventoryColumns = (vendors: { id: string; name: string }[], deleteInventoryItem: (id: string) => Promise<void>): ColumnDef<InventoryItem>[] => [
  {
    accessorKey: "name",
    header: "Item Name",
    cell: ({ row }) => <Link to={`/inventory/${row.original.id}`} className="font-medium hover:underline">{row.getValue("name")}</Link>,
  },
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "quantity", // This is the derived total quantity
    header: "Total Stock",
    cell: ({ row }) => (
      <div className="flex items-center space-x-1">
        <span>{row.original.pickingBinQuantity}</span>
        <span className="text-muted-foreground">/</span>
        <span>{row.original.overstockQuantity}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground ml-1" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Picking Bin / Overstock</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    ),
  },
  {
    accessorKey: "reorderLevel",
    header: "Reorder Level",
  },
  {
    accessorKey: "unitCost",
    header: "Unit Cost",
    cell: ({ row }) => `$${parseFloat(row.original.unitCost.toString() || '0').toFixed(2)}`, // Ensure it's a number and format
  },
  {
    accessorKey: "retailPrice",
    header: "Retail Price",
    cell: ({ row }) => `$${parseFloat(row.original.retailPrice.toString() || '0').toFixed(2)}`, // Ensure it's a number and format
  },
  {
    accessorKey: "vendorId",
    header: "Vendor",
    cell: ({ row }) => {
      const vendor = vendors.find((v) => v.id === row.original.vendorId);
      return vendor ? vendor.name : "N/A";
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const quantity = row.original.pickingBinQuantity + row.original.overstockQuantity;
      const reorderLevel = row.original.reorderLevel;

      if (quantity === 0) {
        return <Badge variant="destructive">Out of Stock</Badge>;
      } else if (quantity < reorderLevel) {
        return <Badge variant="warning">Low Stock</Badge>;
      } else {
        return <Badge variant="success">In Stock</Badge>;
      }
    },
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <Link to={`/inventory/${row.original.id}`}>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" /> View
          </Button>
        </Link>
        <Link to={`/inventory/${row.original.id}`}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>
              Copy item ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => deleteInventoryItem(row.original.id)} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" /> Delete Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];

const Inventory: React.FC = () => {
  const { inventoryItems, deleteInventoryItem, refreshInventory } = useInventory();
  const { vendors } = useVendors();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vendors.find(v => v.id === item.vendorId)?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventoryItems, searchTerm, vendors]);

  const columns = useMemo(() => createInventoryColumns(vendors, deleteInventoryItem), [vendors, deleteInventoryItem]);

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new item to your inventory.
                </DialogDescription>
              </DialogHeader>
              <AddItemForm onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <DataTable columns={columns} data={filteredItems} />
      </div>
    </div>
  );
};

export default Inventory;