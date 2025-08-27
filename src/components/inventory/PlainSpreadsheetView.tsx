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

interface PlainSpreadsheetViewProps {
  items: InventoryItem[];
  visibleColumns: Record<string, boolean>;
  allColumns: { key: string; label: string; className?: string; type?: string }[];
}

const PlainSpreadsheetView: React.FC<PlainSpreadsheetViewProps> = ({
  items,
  visibleColumns,
  allColumns,
}) => {
  const columnsToRender = allColumns.filter(
    (col) => visibleColumns[col.key] && col.key !== "actions" // Exclude actions column
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columnsToRender.map((column) => (
              <TableHead key={column.key} className={cn(column.className, "text-muted-foreground")}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnsToRender.length} className="text-center text-muted-foreground py-8">
                No inventory items found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                {columnsToRender.map((column) => (
                  <TableCell key={column.key} className={cn(column.className, "text-foreground")}>
                    {column.key === "status" ? (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          item.status === "In Stock"
                            ? "bg-green-500/20 text-green-400"
                            : item.status === "Low Stock"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    ) : column.key === "unitCost" || column.key === "retailPrice" || column.key === "stockValue" ? (
                      `$${(item as any)[column.key].toFixed(2)}`
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