import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, Search, Info, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useOnboarding } from "@/context/OnboardingContext";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMutation } from "@tanstack/react-query";
import { showError, showSuccess } from "@/utils/toast";
import { generateBarcodeSvgDataUri } from "@/utils/barcode";

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

interface AddInventoryFormProps {
  onClose: () => void;
}

const AddInventoryForm: React.FC<AddInventoryFormProps> = ({ onClose }) => {
  const { addInventoryItem } = useInventory();
  const { categories } = useCategories();
  const { vendors } = useVendors();
  const { locations } = useOnboarding();

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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await addInventoryItem(values);
      onClose();
      form.reset();
    } catch (error: any) {
      showError(`Failed to add item: ${error.message}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                </SelectContent>
              </Select>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
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
            name="pickingBinLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Picking Bin Location</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a picking bin location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="vendorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        <Button type="submit" className="w-full">Add Item</Button>
      </form>
    </Form>
  );
};

export const createInventoryColumns = (deleteItem: (id: string, name: string) => void, navigate: (path: string) => void): ColumnDef<InventoryItem>[] => [
  {
    accessorKey: "name",
    header: "Item Name",
    cell: ({ row }) => (
      <Link to={`/inventory/${row.original.id}`} className="font-medium hover:underline">
        {row.getValue("name")}
      </Link>
    ),
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
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => (
      <span className={row.original.quantity <= row.original.reorderLevel ? "text-red-500 font-semibold" : ""}>
        {row.getValue("quantity")}
      </span>
    ),
  },
  {
    accessorKey: "reorderLevel",
    header: "Reorder Level",
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" = "default";
      switch (row.original.status) {
        case "In Stock":
          variant = "success";
          break;
        case "Low Stock":
          variant = "warning";
          break;
        case "Out of Stock":
          variant = "destructive";
          break;
      }
      return <Badge variant={variant}>{row.original.status}</Badge>;
    },
  },
  {
    accessorKey: "unitCost",
    header: "Unit Cost",
    cell: ({ row }) => `$${parseFloat(row.original.unitCost.toString() || '0').toFixed(2)}`,
  },
  {
    accessorKey: "retailPrice",
    header: "Retail Price",
    cell: ({ row }) => `$${parseFloat(row.original.retailPrice.toString() || '0').toFixed(2)}`,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => navigate(`/inventory/${row.original.id}`)}>
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => navigate(`/inventory/${row.original.id}`)}>
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Item</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="destructive" size="icon" onClick={() => deleteItem(row.original.id, row.original.name)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Item</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    ),
  },
];

const Inventory: React.FC = () => {
  const { inventoryItems, deleteInventoryItem, refreshInventory } = useInventory();
  const { categories } = useCategories();
  const { locations } = useOnboarding();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddInventoryDialogOpen, setIsAddInventoryDialogOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLocation = locationFilter === "all" || item.location === locationFilter;
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesLocation && matchesCategory && matchesStatus;
    });
  }, [inventoryItems, searchTerm, locationFilter, categoryFilter, statusFilter]);

  const columns = useMemo(() => createInventoryColumns(deleteInventoryItem, navigate), [deleteInventoryItem, navigate]);

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
          <Dialog open={isAddInventoryDialogOpen} onOpenChange={setIsAddInventoryDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new item to your inventory.
                </DialogDescription>
              </DialogHeader>
              <AddInventoryForm onClose={() => setIsAddInventoryDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map(loc => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="In Stock">In Stock</SelectItem>
            <SelectItem value="Low Stock">Low Stock</SelectItem>
            <SelectItem value="Out of Stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <DataTable columns={columns} data={filteredItems} />
      </div>
    </div>
  );
};

export default Inventory;