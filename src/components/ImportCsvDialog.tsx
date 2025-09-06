"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload } from "lucide-react";
import * as XLSX from 'xlsx';
import { useInventory } from "@/context/InventoryContext";
import { useCategories } from "@/context/CategoryContext";
import { useOnboarding, Location } from "@/context/OnboardingContext";
import { useStockMovement } from "@/context/StockMovementContext";
import { showError, showSuccess } from "@/utils/toast";
import { generateInventoryCsvTemplate } from "@/utils/csvGenerator";
import DuplicateItemsWarningDialog from "@/components/DuplicateItemsWarningDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { parseLocationString } from "@/utils/locationParser";

interface CsvDuplicateItem {
  sku: string;
  csvQuantity: number;
  itemName: string;
}

interface ImportCsvDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportCsvDialog: React.FC<ImportCsvDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { addInventoryItem, updateInventoryItem, inventoryItems } = useInventory();
  const { categories, addCategory } = useCategories();
  const { locations, addLocation } = useOnboarding();
  const { addStockMovement } = useStockMovement();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [jsonDataToProcess, setJsonDataToProcess] = useState<any[] | null>(null);

  // States for New Locations Confirmation
  const [newLocationsToConfirm, setNewLocationsToConfirm] = useState<string[]>([]);
  const [isConfirmNewLocationsDialogOpen, setIsConfirmNewLocationsDialogOpen] = useState(false);

  // States for Duplicate SKUs Warning
  const [duplicateSkusInCsv, setDuplicateSkusInCsv] = useState<CsvDuplicateItem[]>([]);
  const [isDuplicateItemsWarningDialogOpen, setIsDuplicateItemsWarningDialogOpen] = useState(false);
  const [duplicateAction, setDuplicateAction] = useState<"skip" | "add_to_stock">("skip"); // Default action for duplicates

  // Memoize existing SKUs for efficient lookup
  const existingInventorySkus = useMemo(() => {
    return new Set(inventoryItems.map(item => item.sku.toLowerCase()));
  }, [inventoryItems]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setJsonDataToProcess(null);
      setNewLocationsToConfirm([]);
      setIsConfirmNewLocationsDialogOpen(false);
      setDuplicateSkusInCsv([]);
      setIsDuplicateItemsWarningDialogOpen(false);
      setDuplicateAction("skip");
    }
  }, [isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.name.endsWith(".csv")) {
        setSelectedFile(file);
      } else {
        showError("Please select a CSV file.");
        setSelectedFile(null);
      }
    } else {
      setSelectedFile(null);
    }
  };

  // Helper function to check for new locations and then proceed with CSV processing
  const checkForNewLocationsAndProceed = async (data: any[], actionForDuplicates: "skip" | "add_to_stock") => {
    const uniqueLocationsInCsv = Array.from(new Set(data.map(row => String(row.location || '').trim())));
    const uniquePickingBinLocationsInCsv = Array.from(new Set(data.map(row => String(row.pickingBinLocation || '').trim())));
    const allUniqueLocationsInCsv = Array.from(new Set([...uniqueLocationsInCsv, ...uniquePickingBinLocationsInCsv]));

    const existingLocationsLower = new Set(locations.map(loc => loc.fullLocationString.toLowerCase()));
    const newLocations = allUniqueLocationsInCsv.filter(loc => loc && !existingLocationsLower.has(loc.toLowerCase()));

    if (newLocations.length > 0) {
      setNewLocationsToConfirm(newLocations);
      setDuplicateAction(actionForDuplicates); // Store action for duplicates
      setIsConfirmNewLocationsDialogOpen(true);
      setIsUploading(false); // Stop loading until user confirms new locations
    } else {
      // If no new locations, proceed directly to processing
      await processCsvData(data, [], actionForDuplicates);
      setSelectedFile(null);
    }
  };

  // Main processing function, now accepts duplicateAction
  const processCsvData = async (data: any[], confirmedNewLocationStrings: string[], actionForDuplicates: "skip" | "add_to_stock") => {
    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    const currentCategoriesMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat.id]));
    // Combine existing structured locations with newly confirmed ones
    const currentLocationsSet = new Set([
      ...locations.map(loc => loc.fullLocationString.toLowerCase()),
      ...confirmedNewLocationStrings.map(locString => locString.toLowerCase())
    ]);
    
    // Ensure all categories from CSV exist
    const uniqueCategoriesInCsv = Array.from(new Set(data.map(row => String(row.category || '').trim())));
    
    for (const csvCategory of uniqueCategoriesInCsv) {
      if (csvCategory && !currentCategoriesMap.has(csvCategory.toLowerCase())) {
        const addedCat = await addCategory(csvCategory);
        if (addedCat) {
          currentCategoriesMap.set(addedCat.name.toLowerCase(), addedCat.id);
        } else {
          errors.push(`Failed to ensure category '${csvCategory}' exists.`);
          errorCount++;
        }
      }
    }

    // Add any newly confirmed locations to the context
    for (const locString of confirmedNewLocationStrings) {
      const parsed = parseLocationString(locString);
      const newLocation: Omit<Location, "id" | "createdAt" | "userId" | "organizationId"> = {
        fullLocationString: locString,
        displayName: locString, // Use full string as display name for auto-added
        area: parsed.area || "N/A",
        row: parsed.row || "N/A",
        bay: parsed.bay || "N/A",
        level: parsed.level || "N/A",
        pos: parsed.pos || "N/A",
        color: "#CCCCCC", // Default color for auto-added locations
      };
      await addLocation(newLocation);
    }
    
    // Process inventory items
    for (const row of data) {
      const itemName = String(row.name || '').trim();
      const sku = String(row.sku || '').trim();
      const categoryName = String(row.category || '').trim();
      const pickingBinQuantity = parseInt(String(row.pickingBinQuantity || '0')); // NEW: Default to '0'
      const overstockQuantity = parseInt(String(row.overstockQuantity || '0')); // NEW: Default to '0'
      const reorderLevel = parseInt(String(row.reorderLevel || '0'));
      const pickingReorderLevel = parseInt(String(row.pickingReorderLevel || '0')); // NEW: Default to '0'
      const unitCost = parseFloat(String(row.unitCost || '0'));
      const retailPrice = parseFloat(String(row.retailPrice || '0'));
      const location = String(row.location || '').trim();
      const pickingBinLocation = String(row.pickingBinLocation || '').trim(); // NEW: Default to empty string

      // Basic validation for required fields
      if (!itemName || !sku || !categoryName || isNaN(pickingBinQuantity) || pickingBinQuantity < 0 || isNaN(overstockQuantity) || overstockQuantity < 0 || isNaN(reorderLevel) || reorderLevel < 0 || isNaN(pickingReorderLevel) || pickingReorderLevel < 0 || isNaN(unitCost) || unitCost < 0 || isNaN(retailPrice) || retailPrice < 0 || !location || !pickingBinLocation) {
        errors.push(`Row with SKU '${sku || 'N/A'}': Missing or invalid required fields (name, sku, category, pickingBinQuantity, overstockQuantity, reorderLevel, pickingReorderLevel, unitCost, retailPrice, location, pickingBinLocation).`);
        errorCount++;
        continue;
      }

      // Validate category exists
      if (!currentCategoriesMap.has(categoryName.toLowerCase())) {
        errors.push(`Row with SKU '${sku}': Category '${categoryName}' could not be found or created.`);
        errorCount++;
        continue;
      }
      // Validate location exists
      if (!currentLocationsSet.has(location.toLowerCase())) {
        errors.push(`Row with SKU '${sku}': Main Storage Location '${location}' does not exist and was not confirmed to be added. Item skipped.`);
        errorCount++;
        continue;
      }
      // Validate pickingBinLocation exists
      if (!currentLocationsSet.has(pickingBinLocation.toLowerCase())) {
        errors.push(`Row with SKU '${sku}': Picking Bin Location '${pickingBinLocation}' does not exist and was not confirmed to be added. Item skipped.`);
        errorCount++;
        continue;
      }

      const isDuplicate = existingInventorySkus.has(sku.toLowerCase());

      if (isDuplicate) {
        if (actionForDuplicates === "skip") {
          errors.push(`SKU '${sku}': Skipped due to duplicate entry confirmation.`);
          errorCount++;
          continue;
        } else if (actionForDuplicates === "add_to_stock") {
          const existingItem = inventoryItems.find(item => item.sku.toLowerCase() === sku.toLowerCase());
          if (existingItem) {
            const oldQuantity = existingItem.quantity;
            const quantityToAdd = pickingBinQuantity + overstockQuantity; // Total quantity from CSV row
            const newQuantity = oldQuantity + quantityToAdd;

            const updatedItem = {
              ...existingItem,
              pickingBinQuantity: existingItem.pickingBinQuantity + pickingBinQuantity, // Add to picking bin
              overstockQuantity: existingItem.overstockQuantity + overstockQuantity, // Add to overstock
              lastUpdated: new Date().toISOString().split('T')[0],
              // Other fields from CSV are ignored for 'add_to_stock' to keep it simple
            };

            try {
              await updateInventoryItem(updatedItem);
              await addStockMovement({
                itemId: existingItem.id,
                itemName: existingItem.name,
                type: "add",
                amount: quantityToAdd,
                oldQuantity: oldQuantity,
                newQuantity: newQuantity,
                reason: "CSV Bulk Import - Added to stock",
              });
              successCount++;
            } catch (updateError: any) {
              errors.push(`Failed to update item '${existingItem.name}' (SKU: ${sku}): ${updateError.message || 'Unknown error'}.`);
              errorCount++;
            }
            continue; // Move to next row after processing duplicate
          } else {
            errors.push(`SKU '${sku}': Item not found for stock addition, despite being marked as duplicate.`);
            errorCount++;
            continue;
          }
        }
      }

      // If not a duplicate, or duplicate but not handled by specific action, add as new item
      try {
        const newItemData = {
          name: itemName,
          description: String(row.description || '').trim(),
          sku: sku,
          category: categoryName,
          pickingBinQuantity: pickingBinQuantity,
          overstockQuantity: overstockQuantity,
          reorderLevel: reorderLevel,
          pickingReorderLevel: pickingReorderLevel,
          committedStock: parseInt(String(row.committedStock || '0')),
          incomingStock: parseInt(String(row.incomingStock || '0')),
          unitCost: unitCost,
          retailPrice: retailPrice,
          location: location,
          pickingBinLocation: pickingBinLocation,
          imageUrl: String(row.imageUrl || '').trim() || undefined,
          vendorId: String(row.vendorId || '').trim() || undefined,
          barcodeUrl: String(row.barcodeUrl || '').trim() || sku, // If barcodeUrl is not provided, use SKU
          autoReorderEnabled: String(row.autoReorderEnabled || 'false').toLowerCase() === 'true',
          autoReorderQuantity: parseInt(String(row.autoReorderQuantity || '0')),
        };
        await addInventoryItem(newItemData);
        successCount++;
      } catch (addError: any) {
        if (addError.code === '23505' && addError.message?.includes('inventory_items_sku_key')) {
          errors.push(`Failed to add item '${itemName}' (SKU: ${sku}): Duplicate SKU detected. An item with this SKU already exists.`);
        } else {
          errors.push(`Failed to add item '${itemName}' (SKU: ${sku}): ${addError.message || 'Unknown error'}.`);
        }
        errorCount++;
      }
    }

    if (successCount > 0) {
      showSuccess(`Successfully imported ${successCount} item(s).`);
    }
    if (errorCount > 0) {
      const errorMessage = errorCount === 1
        ? errors[0]
        : `Failed to import ${errorCount} item(s) due to various issues (e.g., duplicate SKUs, invalid data).`;
      showError(errorMessage);
      console.error("CSV Import Summary - Errors:", errors);
    }
    if (successCount === 0 && errorCount === 0) {
      showError("No valid data found in the CSV to import.");
    }
    setIsUploading(false);
    onClose();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showError("Please select a CSV file to upload.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const binaryString = e.target?.result;
        if (typeof binaryString !== 'string') {
          showError("Failed to read file content.");
          setIsUploading(false);
          return;
        }

        const workbook = XLSX.read(binaryString, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          showError("The CSV file is empty or contains no data rows.");
          setIsUploading(false);
          return;
        }

        setJsonDataToProcess(jsonData); // Store data for later processing

        // Check for duplicate SKUs first
        const duplicates: CsvDuplicateItem[] = [];
        const seenSkus = new Set<string>();
        jsonData.forEach(row => {
          const sku = String(row.sku || '').trim();
          if (sku && existingInventorySkus.has(sku.toLowerCase())) {
            if (!seenSkus.has(sku.toLowerCase())) { // Only add to duplicates list once
              duplicates.push({
                sku: sku,
                csvQuantity: parseInt(String(row.pickingBinQuantity || '0')) + parseInt(String(row.overstockQuantity || '0')),
                itemName: String(row.name || '').trim(),
              });
              seenSkus.add(sku.toLowerCase());
            }
          }
        });

        if (duplicates.length > 0) {
          setDuplicateSkusInCsv(duplicates);
          setIsDuplicateItemsWarningDialogOpen(true);
        } else {
          // If no duplicates, proceed directly to checking for new locations
          await checkForNewLocationsAndProceed(jsonData, "skip"); // Default to skip if no duplicates
        }

      } catch (parseError: any) {
        showError(`Error parsing CSV file: ${parseError.message}`);
        console.error("CSV Parse Error:", parseError);
      } finally {
        // setIsUploading(false); // Keep loading true if dialogs are open
        // setSelectedFile(null); // Keep file selected until final processing
      }
    };

    reader.onerror = () => {
      showError("Failed to read file.");
      setIsUploading(false);
      setSelectedFile(null);
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleDownloadTemplate = () => {
    const csv = generateInventoryCsvTemplate();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "inventory_import_template.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess("CSV template downloaded!");
    } else {
      showError("Your browser does not support downloading files directly.");
    }
  };

  // Handlers for Duplicate Items Warning Dialog
  const handleSkipAllDuplicates = async () => {
    setIsDuplicateItemsWarningDialogOpen(false);
    if (jsonDataToProcess) {
      await checkForNewLocationsAndProceed(jsonDataToProcess, "skip");
    } else {
      setIsUploading(false);
      setSelectedFile(null);
      onClose();
    }
  };

  const handleAddToExistingStock = async () => {
    setIsDuplicateItemsWarningDialogOpen(false);
    if (jsonDataToProcess) {
      await checkForNewLocationsAndProceed(jsonDataToProcess, "add_to_stock");
    } else {
      setIsUploading(false);
      setSelectedFile(null);
      onClose();
    }
  };

  const handleCancelDuplicateWarning = () => {
    setIsDuplicateItemsWarningDialogOpen(false);
    setIsUploading(false);
    setJsonDataToProcess(null);
    setDuplicateSkusInCsv([]);
    setSelectedFile(null);
    showError("CSV upload cancelled.");
    onClose();
  };

  // Handlers for New Locations Confirmation Dialog
  const handleConfirmAddLocations = async () => {
    setIsConfirmNewLocationsDialogOpen(false);
    setIsUploading(true);

    // The `addLocation` function in context now expects a structured object.
    // We need to convert the simple string names from `newLocationsToConfirm`
    // into `Location` objects before passing them.
    for (const locString of newLocationsToConfirm) {
      const parsed = parseLocationString(locString);
      const newLocation: Omit<Location, "id" | "createdAt" | "userId" | "organizationId"> = {
        fullLocationString: locString,
        displayName: locString, // Use full string as display name for auto-added
        area: parsed.area || "N/A",
        row: parsed.row || "N/A",
        bay: parsed.bay || "N/A",
        level: parsed.level || "N/A",
        pos: parsed.pos || "N/A",
        color: "#CCCCCC", // Default color for auto-added locations
      };
      await addLocation(newLocation);
    }
    showSuccess(`Added new locations: ${newLocationsToConfirm.join(", ")}`);

    if (jsonDataToProcess) {
      await processCsvData(jsonDataToProcess, newLocationsToConfirm, duplicateAction);
    }
    setNewLocationsToConfirm([]);
    setSelectedFile(null);
  };

  const handleCancelAddLocations = () => {
    setIsConfirmNewLocationsDialogOpen(false);
    setIsUploading(false);
    setJsonDataToProcess(null);
    setNewLocationsToConfirm([]);
    setSelectedFile(null);
    showError("CSV upload cancelled.");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import CSV File</DialogTitle>
          <DialogDescription>
            Upload a CSV file to update your inventory. New categories will be automatically added if they don't exist.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="csvFile" className="text-right">
              CSV File
            </Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="col-span-3"
            />
          </div>
          {selectedFile && (
            <p className="col-span-4 text-center text-sm text-muted-foreground">
              Selected: {selectedFile.name}
            </p>
          )}
          <div className="col-span-4 text-center">
            <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
              <Download className="h-4 w-4 mr-2" /> Download CSV Template
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Duplicate Items Warning Dialog */}
      <DuplicateItemsWarningDialog
        isOpen={isDuplicateItemsWarningDialogOpen}
        onClose={handleCancelDuplicateWarning}
        duplicates={duplicateSkusInCsv}
        onSkipAll={handleSkipAllDuplicates}
        onAddToExistingStock={handleAddToExistingStock}
      />

      {/* New Locations Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmNewLocationsDialogOpen}
        onClose={handleCancelAddLocations}
        onConfirm={handleConfirmAddLocations}
        title="New Locations Detected"
        description={
          <React.Fragment>
            The following new inventory locations were found in your CSV:
            <ul className="list-disc list-inside mt-2 ml-4 text-left">
              {newLocationsToConfirm.map((loc, index) => (
                <li key={index} className="font-semibold">{loc}</li>
              ))}
            </ul>
            Would you like to add these to your available locations? Items with these locations will only be imported if confirmed.
          </React.Fragment>
        }
        confirmText="Add Locations & Continue"
        cancelText="Cancel Import"
      />
    </Dialog>
  );
};

export default ImportCsvDialog;