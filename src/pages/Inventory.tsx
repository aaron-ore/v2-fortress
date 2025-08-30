import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, Search, Info, MoreHorizontal, Eye, Edit, Trash2, Grid2X2, List, LayoutGrid, MapPin, PackagePlus, Upload, Repeat, Scan as ScanIcon, Columns, ChevronDown } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
import { DataTable } from "@/components/ui/data-table"; // Keep DataTable for default view
import { ColumnDef } from "@tanstack/react-table";
import { useInventory, InventoryItem } from "@/context/InventoryContext";
import { useCategories } from "@/context/CategoryContext";
import { useVendors } from "@/context/VendorContext";
import { useOnboarding } from "@/context/OnboardingContext"; // Import useOnboarding
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { showError, showSuccess } from "@/utils/toast";

// Custom components for the new UI
import PlainSpreadsheetView from "@/components/inventory/PlainSpreadsheetView";
import InventoryCardGrid from "@/components/inventory/InventoryCardGrid";
import InventoryCard from "@/components/InventoryCard"; // Used by InventoryCardGrid
import ManageLocationsDialog from "@/components/ManageLocationsDialog";
import CategoryManagementDialog from "@/components/CategoryManagementDialog";
import ScanItemDialog from "@/components/ScanItemDialog";
import BulkUpdateDialog from "@/components/BulkUpdateDialog";
import ImportCsvDialog from "@/components/ImportCsvDialog";
import AutoReorderSettingsDialog from "@/components/AutoReorderSettingsDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import InventoryItemQuickViewDialog from "@/components/InventoryItemQuickViewDialog";
import AddInventoryDialog from "@/components/AddInventoryDialog"; // Use the existing AddInventoryDialog

const allColumns = [
  { key: "reorderAutoFill", label: "Reorder (auto-fill)", className: "w-[120px]", type: "string" },
  { key: "lastSoldDate", label: "Last Sold Date", className: "w-[120px]", type: "string" },
  { key: "dateOfLastOrder", label: "Date of Last Order", className: "w-[120px]", type: "string" },
  { key: "sku", label: "Item No.", className: "w-[120px]", type: "string" },
  { key: "name", label: "Item name", className: "min-w-[150px]", type: "string" },
  { key: "vendorName", label: "Vendor", className: "w-[120px]", type: "string" },
  { key: "location", label: "Stock Location", className: "w-[120px]", type: "string" },
  { key: "description", label: "Description", className: "min-w-[200px]", type: "string" },
  { key: "unitCost", label: "Cost Per Item", className: "w-[100px] text-right", type: "number" },
  { key: "quantity", label: "Stock Quantity", className: "w-[100px] text-right", type: "number" },
  { key: "stockValue", label: "Total Value", className: "w-[100px] text-right", type: "number" },
  { key: "reorderLevel", label: "Reorder Level", className: "w-[100px] text-right", type: "number" },
  { key: "daysForReorder", label: "Days for Reorder", className: "w-[120px] text-right", type: "string" },
  { key: "nextReorderQuantity", label: "Next Reorder Quantity", className: "w-[150px] text-right", type: "number" },
  { key: "actions", label: "Actions", className: "w-[80px] text-center", type: "actions" },
];

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
  const { vendors } = useVendors();
  const { locations } = useOnboarding(); // Get locations from onboarding context
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddInventoryDialogOpen, setIsAddInventoryDialogOpen] = useState(false); // Renamed for clarity
  const [isManageCategoriesDialogOpen, setIsManageCategoriesDialogOpen] = useState(false);
  const [isManageLocationsDialogOpen, setIsManageLocationsDialogOpen] = useState(false);
  const [isScanItemDialogOpen, setIsScanItemDialogOpen] = useState(false);
  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false);
  const [isImportCsvDialogOpen, setIsImportCsvDialogOpen] = useState(false);
  const [isAutoReorderSettingsDialogOpen, setIsAutoReorderSettingsDialogOpen] = useState(false);

  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  const [isQuickViewDialogOpen, setIsQuickViewDialogOpen] = useState(false);
  const [selectedItemForQuickView, setSelectedItemForQuickView] = useState<InventoryItem | null>(null);

  const [viewMode, setViewMode] = useState<"table" | "card" | "spreadsheet">("table"); // Default to table view
  const [locationFilter, setLocationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initialVisible: Record<string, boolean> = {};
    allColumns.forEach(col => {
      // Set default visibility for columns, e.g., hide description by default
      initialVisible[col.key] = !["description", "imageUrl", "barcodeUrl", "committedStock", "incomingStock", "pickingReorderLevel", "pickingBinLocation"].includes(col.key);
      // Ensure essential columns are visible
      if (["sku", "name", "quantity", "reorderLevel", "location", "actions"].includes(col.key)) {
        initialVisible[col.key] = true;
      }
    });
    return initialVisible;
  });

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  const vendorNameMap = useMemo(() => {
    return new Map(vendors.map(vendor => [vendor.id, vendor.name]));
  }, [vendors]);

  const filteredItems = useMemo(() => {
    return inventoryItems
      .filter(item => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.vendorId ? (vendorNameMap.get(item.vendorId) || "").toLowerCase().includes(searchTerm.toLowerCase()) : false);

        const matchesLocation = locationFilter === "all" || item.location === locationFilter;
        const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;

        return matchesSearch && matchesLocation && matchesCategory && matchesStatus;
      })
      .map(item => ({
        ...item,
        vendorName: item.vendorId ? vendorNameMap.get(item.vendorId) || '-' : '-',
        reorderAutoFill: item.quantity <= item.reorderLevel ? "REORDER" : "OK",
        lastSoldDate: "N/A", // Mock data
        dateOfLastOrder: "N/A", // Mock data
        daysForReorder: item.quantity <= item.reorderLevel ? 7 : "-", // Mock data
        nextReorderQuantity: item.quantity <= item.reorderLevel ? item.autoReorderQuantity : "-", // Mock data
        stockValue: item.quantity * item.unitCost, // Calculate stock value
      }));
  }, [inventoryItems, searchTerm, vendorNameMap, locationFilter, categoryFilter, statusFilter]);

  const handleDeleteItemClick = (itemId: string, itemName: string) => {
    setItemToDelete({ id: itemId, name: itemName });
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (itemToDelete) {
      await deleteInventoryItem(itemToDelete.id);
    }
    setIsConfirmDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleViewDetails = (item: InventoryItem) => {
    navigate(`/inventory/${item.id}`);
  };

  const handleEditItem = (item: InventoryItem) => {
    navigate(`/inventory/${item.id}`);
  };

  const handleQuickView = (item: InventoryItem) => {
    setSelectedItemForQuickView(item);
    setIsQuickViewDialogOpen(true);
  };

  const handleScanItem = () => {
    setIsScanItemDialogOpen(true);
  };

  const handleToggleColumn = (key: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const columnsForDataTable = useMemo(() => createInventoryColumns(deleteInventoryItem, navigate), [deleteInventoryItem, navigate]);

  return (
    <div className="flex flex-col space-y-6 p-6">
      <h1 className="text-3xl font-bold">Inventory Management</h1>

      {/* Top Row: Search, Add New Item, Manage Categories, Manage Locations */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by name, SKU, or description..."
          className="flex-grow max-w-xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button onClick={() => setIsAddInventoryDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" /> Add New Item
        </Button>
        <Button variant="outline" onClick={() => setIsManageCategoriesDialogOpen(true)}>
          Manage Categories
        </Button>
        <Button variant="outline" onClick={() => setIsManageLocationsDialogOpen(true)}>
          <MapPin className="h-4 w-4 mr-2" /> Manage Locations
        </Button>
      </div>

      {/* Second Row: Filters and View Toggles */}
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

        <div className="flex items-center ml-auto space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "table" ? "secondary" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Table View</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "card" ? "secondary" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("card")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Card View</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "spreadsheet" ? "secondary" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("spreadsheet")}
                >
                  <Grid2X2 className="h-4 w-4" /> {/* Using Grid2X2 for spreadsheet icon */}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Spreadsheet View</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main Inventory Display Area */}
      <div className="rounded-md border">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">Current Stock</CardTitle>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsImportCsvDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" /> Import CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsBulkUpdateDialogOpen(true)}>
                  <PackagePlus className="h-4 w-4 mr-2" /> Bulk Update
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsAutoReorderSettingsDialogOpen(true)}>
                  <Repeat className="h-4 w-4 mr-2" /> Auto-Reorder Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={handleScanItem}>
              <ScanIcon className="h-4 w-4 mr-2" /> Scan Item
            </Button>
            {viewMode === "spreadsheet" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Columns className="h-4 w-4 mr-2" /> Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-60 overflow-y-auto">
                  <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allColumns.map(col => (
                    <DropdownMenuItem key={col.key} onSelect={(e) => e.preventDefault()}> {/* Prevent menu closing */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`col-${col.key}`}
                          checked={visibleColumns[col.key]}
                          onCheckedChange={() => handleToggleColumn(col.key)}
                        />
                        <label htmlFor={`col-${col.key}`} className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {col.label}
                        </label>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No inventory items found.</p>
          ) : (
            <>
              {viewMode === "table" && (
                <DataTable columns={columnsForDataTable} data={filteredItems} />
              )}
              {viewMode === "card" && (
                <InventoryCardGrid
                  items={filteredItems}
                  onAdjustStock={handleQuickView} // Use quick view for adjust stock
                  onCreateOrder={(item) => showSuccess(`Create order for ${item.name} (placeholder)`)} // Placeholder
                  onViewDetails={handleViewDetails}
                  onDeleteItem={handleDeleteItemClick}
                />
              )}
              {viewMode === "spreadsheet" && (
                <PlainSpreadsheetView
                  items={filteredItems}
                  visibleColumns={visibleColumns}
                  allColumns={allColumns}
                  vendorNameMap={vendorNameMap}
                  onViewDetails={handleViewDetails}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleDeleteItemClick}
                />
              )}
            </>
          )}
        </CardContent>
      </div>

      {/* Dialogs */}
      <AddInventoryDialog
        isOpen={isAddInventoryDialogOpen}
        onClose={() => setIsAddInventoryDialogOpen(false)}
      />
      <ManageLocationsDialog
        isOpen={isManageLocationsDialogOpen}
        onClose={() => setIsManageLocationsDialogOpen(false)}
      />
      <CategoryManagementDialog
        isOpen={isManageCategoriesDialogOpen}
        onClose={() => setIsManageCategoriesDialogOpen(false)}
      />
      <ScanItemDialog
        isOpen={isScanItemDialogOpen}
        onClose={() => setIsScanItemDialogOpen(false)}
      />
      <BulkUpdateDialog
        isOpen={isBulkUpdateDialogOpen}
        onClose={() => setIsBulkUpdateDialogOpen(false)}
      />
      <ImportCsvDialog
        isOpen={isImportCsvDialogOpen}
        onClose={() => setIsImportCsvDialogOpen(false)}
      />
      <AutoReorderSettingsDialog
        isOpen={isAutoReorderSettingsDialogOpen}
        onClose={() => setIsAutoReorderSettingsDialogOpen(false)}
      />
      {itemToDelete && (
        <ConfirmDialog
          isOpen={isConfirmDeleteDialogOpen}
          onClose={() => setIsConfirmDeleteDialogOpen(false)}
          onConfirm={confirmDeleteItem}
          title="Confirm Item Deletion"
          description={`Are you sure you want to delete "${itemToDelete.name}" (SKU: ${itemToDelete.id})? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
      <InventoryItemQuickViewDialog
        isOpen={isQuickViewDialogOpen}
        onClose={() => setIsQuickViewDialogOpen(false)}
        item={selectedItemForQuickView}
      />
    </div>
  );
};

export default Inventory;