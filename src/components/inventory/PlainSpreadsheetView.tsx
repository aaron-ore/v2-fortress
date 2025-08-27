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
import { ChevronDown } from "lucide-react"; // Import ChevronDown icon

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
}

const PlainSpreadsheetView: React.FC<PlainSpreadsheetViewProps> = ({
  items,
  visibleColumns,
  allColumns,
  vendorNameMap,
}) => {
  const columnsToRender = allColumns.filter(
    (col) => visibleColumns[col.key] && col.key !== "actions" // Exclude actions column
  );

  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <Table className="min-w-full">
        <TableHeader className="bg-gray-800 text-white">
          <TableRow>
            {columnsToRender.map((column) => (
              <TableHead key={column.key} className={cn(column.className, "text-white font-bold text-sm px-4 py-2 border-r border-gray-700 last:border-r-0")}>
                <div className="flex items-center justify-between">
                  {column.label}
                  <ChevronDown className="h-3 w-3 text-gray-400 ml-1" />
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
                    ) : column.key === "sku" ? (
                      item.sku
                    ) : column.key === "dateOfLastOrder" ? (
                      item.dateOfLastOrder
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