import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddInventoryDialog from "@/components/AddInventoryDialog";
import ImportCsvDialog from "@/components/ImportCsvDialog";
import ScanItemDialog from "@/components/ScanItemDialog";
import InventoryItemQuickViewDialog from "@/components/InventoryItemQuickViewDialog";
import InventoryCard from "@/components/InventoryCard";
import CategoryManagementDialog from "@/components/CategoryManagementDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useInventory, InventoryItem } from "@/context/InventoryContext";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal, ArrowUp, ArrowDown, ChevronDown, Table2, LayoutGrid, Trash2, MapPin, FileText } from "lucide-react"; // Added FileText icon for spreadsheet
import { useCategories } from "@/context/CategoryContext";
import { useOnboarding } from "@/context/OnboardingContext";
import ManageLocationsDialog from "@/components/ManageLocationsDialog";
import BulkUpdateDialog from "@/components/BulkUpdateDialog";
import AutoReorderSettingsDialog from "@/components/AutoReorderSettingsDialog";
import { exportToExcel } from "@/utils/exportToExcel";
import PlainSpreadsheetView from "@/components/inventory/PlainSpreadsheetView"; // NEW: Import PlainSpreadsheetView
import { useOrders } from "@/context/OrdersContext"; // NEW: Import useOrders
import { useVendors } from "@/context/VendorContext"; // NEW: Import useVendors
import { format, isValid } from "date-fns"; // Import date-fns for date formatting

// Define all possible columns for the table with sortable property and type
const allColumns = [
  { key: "reorderAutoFill", label: "Reorder (auto-fill)", className: "w-[120px]", sortable: true, type: "string" },
  { key: "lastSoldDate", label: "Last Sold Date", className: "w-[120px]", sortable: true, type: "string" },
  { key: "sku", label: "Item No.", className: "w-[100px]", sortable: true, type: "string" },
  { key: "dateOfLastOrder", label: "Date of Last Order", className: "w-[140px]", sortable: true, type: "string" },
  { key: "name", label: "Item name", className: "w-[150px]", sortable: true, type: "string" },
  { key: "vendorName", label: "Vendor", className: "w-[120px]", sortable: true, type: "string" },
  { key: "location", label: "Stock Location", className: "w-[150px]", sortable: true, type: "string" },
  { key: "description", label: "Description", className: "w-[200px]", sortable: false },
  { key: "unitCost", label: "Cost Per Item", className: "text-right w-[100px]", sortable: true, type: "number" },
  { key: "quantity", label: "Stock Quantity", className: "text-right w-[100px]", sortable: true, type: "number" },
  { key: "stockValue", label: "Total Value", className: "text-right w-[100px]", sortable: true, type: "number" },
  { key: "reorderLevel", label: "Reorder Level", className: "text-right w-[100px]", sortable: true, type: "number" },
  { key: "daysForReorder", label: "Days for Reorder", className: "text-right w-[120px]", sortable: true, type: "number" },
  { key: "nextReorderQuantity", label: "Next Reorder Quantity", className: "text-right w-[150px]", sortable: true, type: "number" },
  { key: "actions", label: "Actions", className: "w-[80px] text-center", sortable: false },
];

const Inventory: React.FC = () => {
  const { inventoryItems, deleteInventoryItem } = useInventory();
  const { categories } = useCategories();
  const { locations } = useOnboarding();
  const { orders } = useOrders(); // NEW: Use orders context
  const { vendors } = useVendors(); // NEW: Use vendors context
  const navigate = useNavigate();
  const [isAddInventoryDialogOpen, setIsAddInventoryDialogOpen] = useState(false);
  const [isImportCsvDialogOpen, setIsImportCsvDialogOpen] = useState(false);
  const [isScanItemDialogOpen, setIsScanItemDialogOpen] = useState(false);
  const [isQuickViewDialogOpen, setIsQuickViewDialogOpen] = useState(false);
  const [isCategoryManagementDialogOpen, setIsCategoryManagementDialogOpen] = useState(false);
  const [isManageLocationsDialogOpen, setIsManageLocationsDialogOpen] = useState(false);
  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false);
  const [isAutoReorderSettingsDialogOpen, setIsAutoReorderSettingsDialogOpen] = useState(false);
  const [selectedItemForQuickView, setSelectedItemForQuickView] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  const [viewMode, setViewMode] = useState<"table" | "card" | "spreadsheet">(() => {
    if (typeof window !== 'undefined') {
      const dashboardViewPreference = localStorage.getItem("dashboardViewPreference");
      return dashboardViewPreference === "classic" ? "spreadsheet" : "table";
    }
    return "table";
  });

  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const initialVisibility: Record<string, boolean> = {};
    // Default visible keys for the new spreadsheet layout
    const defaultVisibleKeys = [
      "reorderAutoFill", "lastSoldDate", "sku", "dateOfLastOrder", "name",
      "vendorName", "location", "description", "unitCost", "quantity",
      "stockValue", "reorderLevel", "daysForReorder", "nextReorderQuantity"
    ];
    allColumns.forEach(column => {
      initialVisibility[column.key] = defaultVisibleKeys.includes(column.key);
    });
    return initialVisibility;
  });

  // Memoize vendor names for quick lookup
  const vendorNameMap = useMemo(() => {
    return new Map(vendors.map(vendor => [vendor.id, vendor.name]));
  }, [vendors]);

  // Calculate last sold date for each item
  const lastSoldDateMap = useMemo(() => {
    const map: Record<string, string> = {};
    orders.filter(order => order.type === "Sales").forEach(order => {
      order.items.forEach(orderItem => {
        if (orderItem.inventoryItemId) {
          const orderDate = new Date(order.date);
          if (isValid(orderDate)) {
            const formattedDate = format(orderDate, "M/dd/yy");
            if (!map[orderItem.inventoryItemId] || new Date(map[orderItem.inventoryItemId]) < orderDate) {
              map[orderItem.inventoryItemId] = formattedDate;
            }
          }
        }
      });
    });
    return map;
  }, [orders]);

  // Calculate date of last purchase order for each item
  const dateOfLastOrderMap = useMemo(() => {
    const map: Record<string, string> = {};
    orders.filter(order => order.type === "Purchase").forEach(order => {
      order.items.forEach(orderItem => {
        if (orderItem.inventoryItemId) {
          const orderDate = new Date(order.date);
          if (isValid(orderDate)) {
            const formattedDate = format(orderDate, "M/dd/yy");
            if (!map[orderItem.inventoryItemId] || new Date(map[orderItem.inventoryItemId]) < orderDate) {
              map[orderItem.inventoryItemId] = formattedDate;
            }
          }
        }
      });
    });
    return map;
  }, [orders]);

  const handleExport = () => {
    if (filteredAndSortedItems.length === 0) {
      showError("No data to export.");
      return;
    }
    const dataToExport = filteredAndSortedItems.map(item => ({
      "Reorder (auto-fill)": item.reorderAutoFill,
      "Last Sold Date": item.lastSoldDate,
      "Item No.": item.sku,
      "Date of Last Order": item.dateOfLastOrder,
      "Item name": item.name,
      "Vendor": item.vendorName,
      "Stock Location": item.location,
      "Description": item.description,
      "Cost Per Item": item.unitCost,
      "Stock Quantity": item.quantity,
      "Total Value": item.stockValue,
      "Reorder Level": item.reorderLevel,
      "Days for Reorder": item.daysForReorder,
      "Next Reorder Quantity": item.nextReorderQuantity,
    }));
    exportToExcel(dataToExport, "Inventory_Report", "Inventory");
  };

  const handleBulkUpdate = () => setIsBulkUpdateDialogOpen(true);
  const handleSetAutoReorder = () => setIsAutoReorderSettingsDialogOpen(true);

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItemForQuickView(item);
    setIsQuickViewDialogOpen(true);
  };

  const handleCreateOrderFromCard = (item: InventoryItem) => {
    showSuccess(`Creating order for ${item.name} (SKU: ${item.sku})`);
  };

  const handleDeleteItemClick = (itemId: string, itemName: string) => {
    setItemToDelete({ id: itemId, name: itemName });
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      deleteInventoryItem(itemToDelete.id);
      showSuccess(`${itemToDelete.name} has been deleted.`);
      if (selectedItemForQuickView?.id === itemToDelete.id) {
        setIsQuickViewDialogOpen(false);
        setSelectedItemForQuickView(null);
      }
    }
    setIsConfirmDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleSort = (columnKey: string, columnType: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    let filtered = inventoryItems.map(item => ({
      ...item,
      availableStock: item.quantity - item.committedStock,
      stockValue: item.quantity * item.unitCost,
      vendorName: item.vendorId ? vendorNameMap.get(item.vendorId) || '-' : '-',
      reorderAutoFill: (item.status === "Low Stock" || item.status === "Out of Stock") && item.autoReorderEnabled ? "REORDER" : "OK",
      lastSoldDate: item.id ? lastSoldDateMap[item.id] || '-' : '-',
      dateOfLastOrder: item.id ? dateOfLastOrderMap[item.id] || '-' : '-',
      daysForReorder: (item.status === "Low Stock" || item.status === "Out of Stock") ? Math.floor(Math.random() * 14) + 1 : '-', // Simulate 1-14 days
      nextReorderQuantity: item.autoReorderEnabled ? item.autoReorderQuantity : '-',
    }));

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter((item) => item.location === locationFilter);
    }

    if (sortColumn) {
      const columnDef = allColumns.find(col => col.key === sortColumn);
      if (columnDef && columnDef.sortable) {
        filtered.sort((a, b) => {
          const aValue = (a as any)[sortColumn];
          const bValue = (b as any)[sortColumn];

          if (columnDef.type === "number") {
            return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
          } else {
            const comparison = String(aValue).localeCompare(String(bValue));
            return sortDirection === "asc" ? comparison : -comparison;
          }
        });
      }
    }

    return filtered;
  }, [inventoryItems, searchTerm, categoryFilter, statusFilter, locationFilter, sortColumn, sortDirection, vendorNameMap, lastSoldDateMap, dateOfLastOrderMap, orders]);

  const uniqueCategoriesForFilter = useMemo(() => {
    return ["all", ...categories.map(cat => cat.name)];
  }, [categories]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    inventoryItems.forEach(item => statuses.add(item.status));
    return ["all", ...Array.from(statuses)];
  }, [inventoryItems]);

  const uniqueLocationsForFilter = useMemo(() => {
    return ["all", ...locations];
  }, [locations]);

  const toggleColumnVisibility = (key: string, checked: boolean) => {
    setColumnVisibility(prev => ({ ...prev, [key]: checked }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Inventory Management</h1>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by name, SKU, or description..."
          className="max-w-sm bg-input border-border text-foreground flex-grow"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button onClick={() => setIsAddInventoryDialogOpen(true)}>+ Add New Item</Button>
        <Button onClick={() => setIsCategoryManagementDialogOpen(true)}>Manage Categories</Button>
        <Button variant="outline" onClick={() => setIsManageLocationsDialogOpen(true)}>
          <MapPin className="h-4 w-4 mr-2" /> Manage Locations
        </Button>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            {uniqueCategoriesForFilter.map(category => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            {uniqueStatuses.map(status => (
              <SelectItem key={status} value={status}>
                {status === "all" ? "All Statuses" : status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Location" />
          </SelectTrigger>
          <SelectContent>
            {uniqueLocationsForFilter.map(location => (
              <SelectItem key={location} value={location}>
                {location === "all" ? "All Locations" : location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1 border border-border rounded-md p-1">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("table")}
            aria-label="Table View"
          >
            <Table2 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "card" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("card")}
            aria-label="Card View"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "spreadsheet" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("spreadsheet")}
            aria-label="Spreadsheet View"
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Card className="bg-card border-border rounded-lg p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold">Current Stock</CardTitle>
          <div className="flex items-center gap-2">
            {/* Actions Dropdown */}
            {viewMode !== "spreadsheet" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Actions <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Inventory Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsImportCsvDialogOpen(true)}>Import CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport}>Export to Excel</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBulkUpdate}>Bulk Update (CSV)</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSetAutoReorder}>Auto-Reorder Settings</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button onClick={() => setIsScanItemDialogOpen(true)} variant="outline">Scan Item</Button>

            {/* Columns Dropdown (only visible in table and spreadsheet view) */}
            {(viewMode === "table" || viewMode === "spreadsheet") && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                  <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allColumns.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.key}
                      className="capitalize"
                      checked={columnVisibility[column.key]}
                      onCheckedChange={(checked) => toggleColumnVisibility(column.key, checked)}
                      onSelect={(e) => e.preventDefault()}
                      disabled={viewMode === "spreadsheet" && column.key === "actions"}
                    >
                      {column.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No inventory items found. Add a new item to get started!</p>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {allColumns.map(column =>
                      columnVisibility[column.key] && (
                        <TableHead
                          key={column.key}
                          className={column.className}
                          onClick={() => column.sortable && handleSort(column.key, column.type || "string")}
                          style={{ cursor: column.sortable ? "pointer" : "default" }}
                        >
                          <div className="flex items-center gap-1">
                            {column.label}
                            {sortColumn === column.key && (
                              sortDirection === "asc" ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            )}
                          </div>
                        </TableHead>
                      )
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedItems.map((item) => (
                    <TableRow key={item.id}>
                      {columnVisibility.reorderAutoFill && <TableCell className="font-medium cursor-pointer" onClick={() => handleItemClick(item)}>{item.reorderAutoFill}</TableCell>}
                      {columnVisibility.lastSoldDate && <TableCell className="cursor-pointer" onClick={() => handleItemClick(item)}>{item.lastSoldDate}</TableCell>}
                      {columnVisibility.sku && <TableCell className="truncate cursor-pointer" onClick={() => handleItemClick(item)}>{item.sku}</TableCell>}
                      {columnVisibility.dateOfLastOrder && <TableCell className="cursor-pointer" onClick={() => handleItemClick(item)}>{item.dateOfLastOrder}</TableCell>}
                      {columnVisibility.name && <TableCell className="truncate cursor-pointer" onClick={() => handleItemClick(item)}>{item.name}</TableCell>}
                      {columnVisibility.vendorName && <TableCell className="truncate cursor-pointer" onClick={() => handleItemClick(item)}>{item.vendorName}</TableCell>}
                      {columnVisibility.location && <TableCell className="truncate cursor-pointer" onClick={() => handleItemClick(item)}>{item.location}</TableCell>}
                      {columnVisibility.description && <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm cursor-pointer" onClick={() => handleItemClick(item)}>{item.description}</TableCell>}
                      {columnVisibility.unitCost && <TableCell className="text-right cursor-pointer" onClick={() => handleItemClick(item)}>${item.unitCost.toFixed(2)}</TableCell>}
                      {columnVisibility.quantity && <TableCell className="text-right font-bold text-primary cursor-pointer" onClick={() => handleItemClick(item)}>{item.quantity}</TableCell>}
                      {columnVisibility.stockValue && <TableCell className="text-right cursor-pointer" onClick={() => handleItemClick(item)}>${item.stockValue.toFixed(2)}</TableCell>}
                      {columnVisibility.reorderLevel && <TableCell className="text-right cursor-pointer" onClick={() => handleItemClick(item)}>{item.reorderLevel}</TableCell>}
                      {columnVisibility.daysForReorder && <TableCell className="text-right cursor-pointer" onClick={() => handleItemClick(item)}>{item.daysForReorder}</TableCell>}
                      {columnVisibility.nextReorderQuantity && <TableCell className="text-right cursor-pointer" onClick={() => handleItemClick(item)}>{item.nextReorderQuantity}</TableCell>}
                      {columnVisibility.actions && (
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItemClick(item.id, item.name);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedItems.map((item) => (
                <InventoryCard
                  key={item.id}
                  item={item}
                  onAdjustStock={handleItemClick}
                  onCreateOrder={handleCreateOrderFromCard}
                  onViewDetails={handleItemClick}
                  onDeleteItem={handleDeleteItemClick}
                />
              ))}
            </div>
          ) : ( // NEW: Spreadsheet View
            <PlainSpreadsheetView
              items={filteredAndSortedItems}
              visibleColumns={columnVisibility}
              allColumns={allColumns}
              vendorNameMap={vendorNameMap} // Pass vendorNameMap
            />
          )}
        </CardContent>
      </Card>
      <AddInventoryDialog
        isOpen={isAddInventoryDialogOpen}
        onClose={() => setIsAddInventoryDialogOpen(false)}
      />
      <ImportCsvDialog
        isOpen={isImportCsvDialogOpen}
        onClose={() => setIsImportCsvDialogOpen(false)}
      />
      <ScanItemDialog
        isOpen={isScanItemDialogOpen}
        onClose={() => setIsScanItemDialogOpen(false)}
      />
      {selectedItemForQuickView && (
        <InventoryItemQuickViewDialog
          isOpen={isQuickViewDialogOpen}
          onClose={() => setIsQuickViewDialogOpen(false)}
          item={selectedItemForQuickView}
        />
      )}
      <CategoryManagementDialog
        isOpen={isCategoryManagementDialogOpen}
        onClose={() => setIsCategoryManagementDialogOpen(false)}
      />
      <ManageLocationsDialog
        isOpen={isManageLocationsDialogOpen}
        onClose={() => setIsManageLocationsDialogOpen(false)}
      />
      <BulkUpdateDialog
        isOpen={isBulkUpdateDialogOpen}
        onClose={() => setIsBulkUpdateDialogOpen(false)}
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
          title="Confirm Deletion"
          description={`Are you sure you want to delete "${itemToDelete.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default Inventory;