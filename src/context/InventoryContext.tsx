import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess } from "@/utils/toast";
import { useProfile } from "./ProfileContext";
import { mockInventoryItems } from "@/utils/mockData";
import { useOrders } from "./OrdersContext";
import { useVendors } from "./VendorContext";
import { processAutoReorder } from "@/utils/autoReorderLogic";
import { useNotifications } from "./NotificationContext";
// REMOVED: import { useActivityLogs } from "./ActivityLogContext";

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  // NEW: Split quantity into pickingBinQuantity and overstockQuantity
  pickingBinQuantity: number;
  overstockQuantity: number;
  // Derived total quantity
  quantity: number; 
  reorderLevel: number; // This will now be the overall reorder level
  pickingReorderLevel: number; // NEW: Reorder level specifically for picking bins
  committedStock: number;
  incomingStock: number;
  unitCost: number;
  retailPrice: number;
  location: string; // Overall primary storage location
  pickingBinLocation: string; // NEW: Specific location for picking bin
  status: string;
  lastUpdated: string;
  imageUrl?: string;
  vendorId?: string;
  barcodeUrl?: string;
  organizationId: string | null;
  autoReorderEnabled: boolean;
  autoReorderQuantity: number;
}

interface InventoryContextType {
  inventoryItems: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, "id" | "status" | "lastUpdated" | "organizationId" | "quantity">) => Promise<void>;
  updateInventoryItem: (updatedItem: Omit<InventoryItem, "quantity"> & { id: string }) => Promise<void>;
  deleteInventoryItem: (itemId: string) => Promise<void>;
  refreshInventory: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(
  undefined,
);

const initialInventoryItems: InventoryItem[] = [];

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(initialInventoryItems);
  const { profile, isLoadingProfile } = useProfile();
  const { addOrder } = useOrders();
  const { vendors } = useVendors();
  const { addNotification } = useNotifications();
  // REMOVED: const { addActivity } = useActivityLogs();
  const isInitialLoad = useRef(true);

  const mapSupabaseItemToInventoryItem = (item: any): InventoryItem => ({
    id: item.id,
    name: item.name,
    description: item.description || "",
    sku: item.sku,
    pickingBinQuantity: item.picking_bin_quantity,
    overstockQuantity: item.overstock_quantity,
    quantity: item.picking_bin_quantity + item.overstock_quantity, // Derived
    reorderLevel: item.reorder_level,
    pickingReorderLevel: item.picking_reorder_level || 0, // Default to 0 if null
    committedStock: item.committed_stock,
    incomingStock: item.incoming_stock,
    unitCost: parseFloat(item.unit_cost || '0'), // Ensure it's a number, default to 0
    retailPrice: parseFloat(item.retail_price || '0'), // Ensure it's a number, default to 0
    location: item.location,
    pickingBinLocation: item.picking_bin_location || item.location, // Default to main location if not set
    status: item.status,
    lastUpdated: item.last_updated,
    imageUrl: item.image_url || undefined,
    vendorId: item.vendor_id || undefined,
    barcodeUrl: item.barcode_url || undefined,
    organizationId: item.organization_id,
    autoReorderEnabled: item.auto_reorder_enabled || false,
    autoReorderQuantity: item.auto_reorder_quantity || 0,
  });

  const fetchInventoryItems = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !profile?.organizationId) {
      setInventoryItems([]);
      return;
    }

    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("organization_id", profile.organizationId);

    if (error) {
      console.error("Error fetching inventory items:", error);
      // REMOVED: showError("Failed to load inventory items."); // Removed this toast
      console.warn("Loading mock inventory items due to Supabase error.");
      setInventoryItems(mockInventoryItems.map(mapSupabaseItemToInventoryItem));
    } else {
      const fetchedItems: InventoryItem[] = data.map(mapSupabaseItemToInventoryItem);
      if (fetchedItems.length === 0) { // Always load mock data if no data is returned
        console.warn("Loading mock inventory items as Supabase returned no data.");
        setInventoryItems(mockInventoryItems.map(mapSupabaseItemToInventoryItem));
      } else {
        setInventoryItems(fetchedItems);
      }
    }
  }, [profile?.organizationId]);

  useEffect(() => {
    if (!isLoadingProfile) {
      fetchInventoryItems().then(() => {
        if (!isInitialLoad.current && profile?.organizationId) {
          processAutoReorder(inventoryItems, addOrder, vendors, profile.organizationId, addNotification);
        }
        isInitialLoad.current = false;
      });
    }
  }, [fetchInventoryItems, isLoadingProfile, profile?.organizationId, addOrder, vendors, addNotification, inventoryItems]);

  const addInventoryItem = async (item: Omit<InventoryItem, "id" | "status" | "lastUpdated" | "organizationId" | "quantity">) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      throw new Error("You must be logged in and have an organization ID to add inventory items.");
    }

    const totalQuantity = item.pickingBinQuantity + item.overstockQuantity;
    const status = totalQuantity > item.reorderLevel ? "In Stock" : (totalQuantity > 0 ? "Low Stock" : "Out of Stock");
    const lastUpdated = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        name: item.name,
        description: item.description,
        sku: item.sku,
        category: item.category,
        picking_bin_quantity: item.pickingBinQuantity,
        overstock_quantity: item.overstockQuantity,
        reorder_level: item.reorderLevel,
        picking_reorder_level: item.pickingReorderLevel,
        committed_stock: 0,
        incoming_stock: 0,
        unit_cost: item.unitCost,
        retail_price: item.retailPrice,
        location: item.location,
        picking_bin_location: item.pickingBinLocation,
        status: status,
        last_updated: lastUpdated,
        image_url: item.imageUrl,
        vendor_id: item.vendorId,
        barcode_url: item.barcodeUrl,
        user_id: session.user.id,
        organization_id: profile.organizationId,
        auto_reorder_enabled: item.autoReorderEnabled,
        auto_reorder_quantity: item.autoReorderQuantity,
      })
      .select();

    if (error) {
      console.error("Error adding inventory item:", error);
      // REMOVED: addActivity("Inventory Add Failed", `Failed to add inventory item: ${item.name} (SKU: ${item.sku}).`, { error: error.message, item });
      throw error;
    } else if (data && data.length > 0) {
      const newItem: InventoryItem = mapSupabaseItemToInventoryItem(data[0]);
      setInventoryItems((prevItems) => [...prevItems, newItem]);
      // REMOVED: addActivity("Inventory Added", `Added new inventory item: ${newItem.name} (SKU: ${newItem.sku}).`, { itemId: newItem.id, sku: newItem.sku, quantity: newItem.quantity });
      showSuccess(`Added new inventory item: ${newItem.name} (SKU: ${newItem.sku}).`);
      if (profile?.organizationId) {
        processAutoReorder([...inventoryItems, newItem], addOrder, vendors, profile.organizationId, addNotification);
      }
    } else {
      const errorMessage = "Failed to add item: No data returned after insert.";
      console.error(errorMessage);
      // REMOVED: addActivity("Inventory Add Failed", errorMessage, { item });
      throw new Error(errorMessage);
    }
  };

  const updateInventoryItem = async (updatedItem: Omit<InventoryItem, "quantity"> & { id: string }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      throw new Error("You must be logged in and have an organization ID to update inventory items.");
    }

    const totalQuantity = updatedItem.pickingBinQuantity + updatedItem.overstockQuantity;
    const newStatus = totalQuantity > updatedItem.reorderLevel ? "In Stock" : (totalQuantity > 0 ? "Low Stock" : "Out of Stock");
    const lastUpdated = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from("inventory_items")
      .update({
        name: updatedItem.name,
        description: updatedItem.description,
        sku: updatedItem.sku,
        category: updatedItem.category,
        picking_bin_quantity: updatedItem.pickingBinQuantity,
        overstock_quantity: updatedItem.overstockQuantity,
        reorder_level: updatedItem.reorderLevel,
        picking_reorder_level: updatedItem.pickingReorderLevel,
        committed_stock: updatedItem.committedStock,
        incoming_stock: updatedItem.incomingStock,
        unit_cost: updatedItem.unitCost,
        retail_price: updatedItem.retailPrice,
        location: updatedItem.location,
        picking_bin_location: updatedItem.pickingBinLocation,
        status: newStatus,
        last_updated: lastUpdated,
        image_url: updatedItem.imageUrl,
        vendor_id: updatedItem.vendorId,
        barcode_url: updatedItem.barcodeUrl,
        auto_reorder_enabled: updatedItem.autoReorderEnabled,
        auto_reorder_quantity: updatedItem.autoReorderQuantity,
      })
      .eq("id", updatedItem.id)
      .eq("organization_id", profile.organizationId)
      .select();

    if (error) {
      console.error("Error updating inventory item:", error);
      // REMOVED: addActivity("Inventory Update Failed", `Failed to update inventory item: ${updatedItem.name} (SKU: ${updatedItem.sku}).`, { error: error.message, itemId: updatedItem.id, sku: updatedItem.sku });
      throw error;
    } else if (data && data.length > 0) {
      const updatedItemFromDB: InventoryItem = mapSupabaseItemToInventoryItem(data[0]);
      setInventoryItems((prevItems) =>
        prevItems.map((item) =>
          item.id === updatedItemFromDB.id ? updatedItemFromDB : item,
        ),
      );
      // REMOVED: addActivity("Inventory Updated", `Updated inventory item: ${updatedItemFromDB.name} (SKU: ${updatedItemFromDB.sku}).`, { itemId: updatedItemFromDB.id, sku: updatedItemFromDB.sku, newQuantity: updatedItemFromDB.quantity });
      showSuccess(`Updated inventory item: ${updatedItemFromDB.name} (SKU: ${updatedItemFromDB.sku}).`);
      if (profile?.organizationId) {
        processAutoReorder(inventoryItems.map(item => item.id === updatedItemFromDB.id ? updatedItemFromDB : item), addOrder, vendors, profile.organizationId, addNotification);
      }
    } else {
      const errorMessage = "Update might not have been saved. Check database permissions.";
      console.error(errorMessage);
      // REMOVED: addActivity("Inventory Update Failed", errorMessage, { itemId: updatedItem.id, sku: updatedItem.sku });
      throw new Error(errorMessage);
    }
  };

  const deleteInventoryItem = async (itemId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      showError("You must be logged in and have an organization ID to delete inventory items.");
      return;
    }

    const itemToDelete = inventoryItems.find(item => item.id === itemId);

    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", itemId)
      .eq("organization_id", profile.organizationId);

    if (error) {
      console.error("Error deleting inventory item:", error);
      // REMOVED: addActivity("Inventory Delete Failed", `Failed to delete inventory item: ${itemToDelete?.name || itemId}.`, { error: error.message, itemId });
      showError(`Failed to delete item: ${error.message}`);
    } else {
      setInventoryItems((prevItems) => prevItems.filter(item => item.id !== itemId));
      // REMOVED: addActivity("Inventory Deleted", `Deleted inventory item: ${itemToDelete?.name || itemId}.`, { itemId });
      showSuccess("Item deleted successfully!");
    }
  };

  const refreshInventory = async () => {
    await fetchInventoryItems();
    if (profile?.organizationId) {
      processAutoReorder(inventoryItems, addOrder, vendors, profile.organizationId, addNotification);
    }
  };

  return (
    <InventoryContext.Provider
      value={{ inventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem, refreshInventory }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};