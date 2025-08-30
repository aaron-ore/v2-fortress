import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { InventoryItem, useInventory } from "@/context/InventoryContext";
import { useCategories } from "@/context/CategoryContext";
import { useVendors } from "@/context/VendorContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2, Save, XCircle, Edit, Trash2 } from "lucide-react";

interface PlainSpreadsheetViewProps {
  items: InventoryItem[];
  visibleColumns: Record<string, boolean>;
  allColumns: { key: string; label: string; className?: string; type: "string" | "number" | "actions" }[];
  vendorNameMap: Map<string, string>;
  onViewDetails: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string, itemName: string) => void;
}

const PlainSpreadsheetView: React.FC<PlainSpreadsheetViewProps> = ({
  items,
  visibleColumns,
  allColumns,
  vendorNameMap,
  onViewDetails,
  onEditItem,
  onDeleteItem,
}) => {
  const { updateInventoryItem, refreshInventory } = useInventory();
  const { categories } = useCategories();
  const { vendors } = useVendors();
  const { locations } = useOnboarding();

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<InventoryItem>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setEditedValues({ ...item }); // Initialize with current item values
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditedValues({});
  };

  const handleValueChange = (
    field: keyof InventoryItem,
    value: string | number | boolean | undefined
  ) => {
    setEditedValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    setIsSaving(true);
    try {
      const updatedItem: InventoryItem = {
        ...editingItem,
        ...editedValues,
        // Ensure numeric fields are parsed correctly
        pickingBinQuantity: Number(editedValues.pickingBinQuantity ?? editingItem.pickingBinQuantity),
        overstockQuantity: Number(editedValues.overstockQuantity ?? editingItem.overstockQuantity),
        reorderLevel: Number(editedValues.reorderLevel ?? editingItem.reorderLevel),
        pickingReorderLevel: Number(editedValues.pickingReorderLevel ?? editingItem.pickingReorderLevel),
        unitCost: Number(editedValues.unitCost ?? editingItem.unitCost),
        retailPrice: Number(editedValues.retailPrice ?? editingItem.retailPrice),
        autoReorderQuantity: Number(editedValues.autoReorderQuantity ?? editingItem.autoReorderQuantity),
      };

      await updateInventoryItem(updatedItem);
      showSuccess(`Item ${updatedItem.name} updated successfully.`);
      setEditingItem(null);
      setEditedValues({});
      refreshInventory(); // Refresh to ensure UI reflects latest data
    } catch (error: any) {
      showError(`Failed to save changes: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderCell = (item: InventoryItem, columnKey: string) => {
    const isEditing = editingItem?.id === item.id;
    const column = allColumns.find(col => col.key === columnKey);

    if (!column) return null;

    const currentValue = (editedValues[columnKey as keyof InventoryItem] !== undefined
      ? editedValues[columnKey as keyof InventoryItem]
      : item[columnKey as keyof InventoryItem]) as string | number | boolean | undefined;

    if (columnKey === "actions") {
      return (
        <div className="flex items-center justify-center space-x-1">
          {isEditing ? (
            <>
              <Button variant="ghost" size="icon" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-green-500" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCancelEdit} disabled={isSaving}>
                <XCircle className="h-4 w-4 text-destructive" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)}>
                <Edit className="h-4 w-4 text-primary" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDeleteItem(item.id, item.name)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      );
    }

    if (isEditing && column.type !== "actions") {
      switch (columnKey) {
        case "category":
          return (
            <Select
              value={String(currentValue)}
              onValueChange={(val) => handleValueChange("category", val)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        case "vendorId":
          return (
            <Select
              value={String(currentValue || "none")} {/* Ensure default is 'none' */}
              onValueChange={(val) => handleValueChange("vendorId", val === "none" ? undefined : val)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem> {/* Changed value to 'none' */}
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        case "location":
        case "pickingBinLocation":
          return (
            <Select
              value={String(currentValue || "")}
              onValueChange={(val) => handleValueChange(columnKey as keyof InventoryItem, val)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </MSelectContent>
            </Select>
          );
        case "autoReorderEnabled":
          return (
            <input
              type="checkbox"
              checked={Boolean(currentValue)}
              onChange={(e) => handleValueChange("autoReorderEnabled", e.target.checked)}
              className="h-4 w-4"
            />
          );
        case "description":
          return (
            <Input
              type="text"
              value={String(currentValue || "")}
              onChange={(e) => handleValueChange(columnKey as keyof InventoryItem, e.target.value)}
              className="h-8"
            />
          );
        default:
          return (
            <Input
              type={column.type === "number" ? "number" : "text"}
              value={String(currentValue || "")}
              onChange={(e) => handleValueChange(columnKey as keyof InventoryItem, column.type === "number" ? Number(e.target.value) : e.target.value)}
              className="h-8"
              step={columnKey.includes("Price") || columnKey.includes("Cost") ? "0.01" : "1"}
            />
          );
      }
    }

    // Display mode
    switch (columnKey) {
      case "name":
        return (
          <Button variant="link" className="p-0 h-auto" onClick={() => onViewDetails(item)}>
            {item.name}
          </Button>
        );
      case "quantity":
        return (
          <span className={item.quantity <= item.reorderLevel ? "text-red-500 font-semibold" : ""}>
            {item.quantity}
          </span>
        );
      case "unitCost":
      case "retailPrice":
      case "stockValue":
        return `$${Number(item[columnKey as keyof InventoryItem] || 0).toFixed(2)}`;
      case "vendorId":
        return vendorNameMap.get(String(item.vendorId)) || '-';
      case "autoReorderEnabled":
        return item.autoReorderEnabled ? "Yes" : "No";
      case "reorderAutoFill":
        return item.quantity <= item.reorderLevel ? "REORDER" : "OK";
      case "lastSoldDate":
      case "dateOfLastOrder":
      case "daysForReorder":
      case "nextReorderQuantity":
        return String(item[columnKey as keyof InventoryItem] || '-'); // Display mock data
      default:
        return String(item[columnKey as keyof InventoryItem] || '-');
    }
  };

  const visibleColumnsData = useMemo(() => allColumns.filter(col => visibleColumns[col.key]), [allColumns, visibleColumns]);

  if (items.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No inventory items found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            {visibleColumnsData.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              {visibleColumnsData.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {renderCell(item, column.key)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PlainSpreadsheetView;