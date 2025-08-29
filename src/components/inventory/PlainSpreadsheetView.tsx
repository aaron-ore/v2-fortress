import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InventoryItem } from "@/context/InventoryContext";
import { cn } from "@/lib/utils";
import { ChevronDown, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"; // Import necessary icons
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import DropdownMenu components
import { Button } from "@/components/ui/button"; // Import Button

interface PlainSpreadsheetViewProps {
  items: (InventoryItem & {
    vendorName: string;
    reorderAutoFill: string;
    lastSoldDate: string;
    dateOfLastOrder: string;
    daysForReorder: number | string;
    nextReorderQuantity: number | string;
  })[];
  visibleColumns: Record<string, boolean>;
  allColumns: { key: string; label: string; className?: string; type?: string }[];
  vendorNameMap: Map<string, string>; // Pass vendorNameMap
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
  const columnsToRender = allColumns.filter(
    (col) => visibleColumns[col.key]
  );

  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <Table className="min-w-full">
        <TableHeader className="bg-muted text-muted-foreground"> {/* Changed header background */}
          <TableRow>
            {columnsToRender.map((column) => (
              <TableHead key={column.key} className={cn(column.className, "font-bold text-sm px-4 py-2 border-r border-border last:border-r-0")}>
                <div className="flex items-center justify-between">
                  {column.label}
                  {/* Only show chevron for sortable columns, not actions */}
                  {column.key !== "actions" && <ChevronDown className="h-3 w-3 text-muted-foreground ml-1" />}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnsToRender.length} className="text-center text-muted-foreground py-8 bg-card">
                No inventory items found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <TableRow
                key={item.id}
                className={cn(
                  "text-foreground text-sm",
                  (item.reorderAutoFill === "REORDER") ? "bg-orange-500/10 hover:bg-orange-500/20" : "even:bg-card odd:bg-background hover:bg-muted/20"
                )}
              >
                {columnsToRender.map((column) => (
                  <TableCell key={column.key} className={cn(column.className, "px-4 py-2 border-r border-border last:border-r-0")}>
                    {column.key === "reorderAutoFill" ? (
                      <span className={cn("font-semibold", item.reorderAutoFill === "REORDER" ? "text-destructive" : "text-green-500")}>
                        {item.reorderAutoFill}
                      </span>
                    ) : column.key === "lastSoldDate" ? (
                      item.lastSoldDate
                    ) : column.key === "dateOfLastOrder" ? (
                      item.dateOfLastOrder
                    ) : column.key === "sku" ? (
                      item.sku
                    ) : column.key === "name" ? (
                      item.name
                    ) : column.key === "vendorName" ? (
                      item.vendorId ? vendorNameMap.get(item.vendorId) || '-' : '-'
                    ) : column.key === "location" ? (
                      item.location
                    ) : column.key === "description" ? (
                      item.description
                    ) : column.key === "unitCost" ? (
                      `$${item.unitCost.toFixed(2)}`
                    ) : column.key === "quantity" ? (
                      item.quantity
                    ) : column.key === "stockValue" ? (
                      `$${(item.quantity * item.unitCost).toFixed(2)}`
                    ) : column.key === "reorderLevel" ? (
                      item.reorderLevel
                    ) : column.key === "daysForReorder" ? (
                      item.daysForReorder
                    ) : column.key === "nextReorderQuantity" ? (
                      item.nextReorderQuantity
                    ) : column.key === "actions" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(item)}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditItem(item)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit Item
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id)}>
                            Copy item ID
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDeleteItem(item.id, item.name)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      (item as any)[column.key]
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PlainSpreadsheetView;