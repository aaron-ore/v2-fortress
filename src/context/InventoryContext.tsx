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
import { useOrders } from "./OrdersContext"; // NEW: Import useOrders
import { useVendors } from "./VendorContext"; // NEW: Import useVendors
import { processAutoReorder } from "@/utils/autoReorderLogic"; // NEW: Import autoReorderLogic

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  committedStock: number;
  incomingStock: number;
  unitCost: number;
  retailPrice: number;
  location: string;
  status: string;
  lastUpdated: string;
  imageUrl?: string;
  vendorId?: string;
  barcodeUrl?: string;
  organizationId: string | null;
  autoReorderEnabled: boolean; // NEW: Auto-reorder flag
  autoReorderQuantity: number; // NEW: Quantity to reorder automatically
}

interface InventoryContextType {
  inventoryItems: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, "id" | "status" | "lastUpdated" | "organizationId">) => Promise<void>;
  updateInventoryItem: (updatedItem: InventoryItem) => Promise<void>;
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
  const { addOrder } = useOrders(); // NEW: Use addOrder from OrdersContext
  const { vendors } = useVendors(); // NEW: Use vendors from VendorContext
  const isInitialLoad = useRef(true); // To prevent auto-reorder on first fetch

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
      showError("Failed to load inventory items.");
      if (import.meta.env.DEV) {
        console.warn("Loading mock inventory items due to Supabase error in development mode.");
        setInventoryItems(mockInventoryItems);
      }
    } else {
      const fetchedItems: InventoryItem[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || "",
        sku: item.sku,
        category: item.category,
        quantity: item.quantity,
        reorderLevel: item.reorder_level,
        committedStock: item.committed_stock,
        incomingStock: item.incoming_stock,
        unitCost: parseFloat(item.unit_cost),
        retailPrice: parseFloat(item.retail_price),
        location: item.location,
        status: item.status,
        lastUpdated: item.last_updated,
        imageUrl: item.image_url || undefined,
        vendorId: item.vendor_id || undefined,
        barcodeUrl: item.barcode_url || undefined,
        organizationId: item.organization_id,
        autoReorderEnabled: item.auto_reorder_enabled || false, // Map new field
        autoReorderQuantity: item.auto_reorder_quantity || 0, // Map new field
      }));
      if (fetchedItems.length === 0 && import.meta.env.DEV) {
        console.warn("Loading mock inventory items as Supabase returned no data in development mode.");
        setInventoryItems(mockInventoryItems);
      } else {
        setInventoryItems(fetchedItems);
      }
    }
  }, [profile?.organizationId]);

  useEffect(() => {
    if (!isLoadingProfile) {
      fetchInventoryItems().then(() => {
        // Only run auto-reorder check after initial load and if not the very first render
        if (!isInitialLoad.current && profile?.organizationId) {
          processAutoReorder(inventoryItems, addOrder, vendors, profile.organizationId);
        }
        isInitialLoad.current = false;
      });
    }
  }, [fetchInventoryItems, isLoadingProfile, profile?.organizationId, addOrder, vendors]);

  const addInventoryItem = async (item: Omit<InventoryItem, "id" | "status" | "lastUpdated" | "organizationId">) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      throw new Error("You must be logged in and have an organization ID to add inventory items.");
    }

    const status = item.quantity > item.reorderLevel ? "In Stock" : (item.quantity > 0 ? "Low Stock" : "Out of Stock");
    const lastUpdated = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        name: item.name,
        description: item.description,
        sku: item.sku,
        category: item.category,
        quantity: item.quantity,
        reorder_level: item.reorderLevel,
        committed_stock: item.committedStock,
        incoming_stock: item.incomingStock,
        unit_cost: item.unitCost,
        retail_price: item.retailPrice,
        location: item.location,
        status: status,
        last_updated: lastUpdated,
        image_url: item.imageUrl,
        vendor_id: item.vendorId,
        barcode_url: item.barcodeUrl,
        user_id: session.user.id,
        organization_id: profile.organizationId,
        auto_reorder_enabled: item.autoReorderEnabled, // Include new field
        auto_reorder_quantity: item.autoReorderQuantity, // Include new field
      })
      .select();

    if (error) {
      console.error("Error adding inventory item:", error);
      throw error;
    } else if (data && data.length > 0) {
      const newItem: InventoryItem = {
        id: data[0].id,
        name: data[0].name,
        description: data[0].description || "",
        sku: data[0].sku,
        category: data[0].category,
        quantity: data[0].quantity,
        reorderLevel: data[0].reorder_level,
        committedStock: data[0].committed_stock,
        incomingStock: data[0].incoming_stock,
        unitCost: parseFloat(data[0].unit_cost),
        retailPrice: parseFloat(data[0].retail_price),
        location: data[0].location,
        status: data[0].status,
        lastUpdated: data[0].last_updated,
        imageUrl: data[0].image_url || undefined,
        vendorId: data[0].vendor_id || undefined,
        barcodeUrl: data[0].barcode_url || undefined,
        organizationId: data[0].organization_id,
        autoReorderEnabled: data[0].auto_reorder_enabled || false, // Map new field
        autoReorderQuantity: data[0].auto_reorder_quantity || 0, // Map new field
      };
      setInventoryItems((prevItems) => [...prevItems, newItem]);
      if (profile?.organizationId) {
        processAutoReorder([...inventoryItems, newItem], addOrder, vendors, profile.organizationId);
      }
    } else {
      throw new Error("Failed to add item: No data returned after insert.");
    }
  };

  const updateInventoryItem = async (updatedItem: InventoryItem) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      throw new Error("You must be logged in and have an organization ID to update inventory items.");
    }

    const newStatus = updatedItem.quantity > updatedItem.reorderLevel ? "In Stock" : (updatedItem.quantity > 0 ? "Low Stock" : "Out of Stock");
    const lastUpdated = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from("inventory_items")
      .update({
        name: updatedItem.name,
        description: updatedItem.description,
        sku: updatedItem.sku,
        category: updatedItem.category,
        quantity: updatedItem.quantity,
        reorder_level: updatedItem.reorderLevel,
        committed_stock: updatedItem.committedStock,
        incoming_stock: updatedItem.incomingStock,
        unit_cost: updatedItem.unitCost,
        retail_price: updatedItem.retailPrice,
        location: updatedItem.location,
        status: newStatus,
        last_updated: lastUpdated,
        image_url: updatedItem.imageUrl,
        vendor_id: updatedItem.vendorId,
        barcode_url: updatedItem.barcodeUrl,
        auto_reorder_enabled: updatedItem.autoReorderEnabled, // Include new field
        auto_reorder_quantity: updatedItem.autoReorderQuantity, // Include new field
      })
      .eq("id", updatedItem.id)
      .eq("organization_id", profile.organizationId)
      .select();

    if (error) {
      console.error("Error updating inventory item:", error);
      throw error;
    } else if (data && data.length > 0) {
      const updatedItemFromDB: InventoryItem = {
        id: data[0].id,
        name: data[0].name,
        description: data[0].description || "",
        sku: data[0].sku,
        category: data[0].category,
        quantity: data[0].quantity,
        reorderLevel: data[0].reorder_level,
        committedStock: data[0].committed_stock,
        incomingStock: data[0].incoming_stock,
        unitCost: parseFloat(data[0].unit_cost),
        retailPrice: parseFloat(data[0].retail_price),
        location: data[0].location,
        status: data[0].status,
        lastUpdated: data[0].last_updated,
        imageUrl: data[0].image_url || undefined,
        vendorId: data[0].vendor_id || undefined,
        barcodeUrl: data[0].barcode_url || undefined,
        organizationId: data[0].organization_id,
        autoReorderEnabled: data[0].auto_reorder_enabled || false, // Map new field
        autoReorderQuantity: data[0].auto_reorder_quantity || 0, // Map new field
      };
      setInventoryItems((prevItems) =>
        prevItems.map((item) =>
          item.id === updatedItemFromDB.id ? updatedItemFromDB : item,
        ),
      );
      if (profile?.organizationId) {
        processAutoReorder(inventoryItems.map(item => item.id === updatedItemFromDB.id ? updatedItemFromDB : item), addOrder, vendors, profile.organizationId);
      }
    } else {
      throw new Error("Update might not have been saved. Check database permissions.");
    }
  };

  const deleteInventoryItem = async (itemId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      showError("You must be logged in and have an organization ID to delete inventory items.");
      return;
    }

    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", itemId)
      .eq("organization_id", profile.organizationId);

    if (error) {
      console.error("Error deleting inventory item:", error);
      showError(`Failed to delete item: ${error.message}`);
    } else {
      setInventoryItems((prevItems) => prevItems.filter(item => item.id !== itemId));
      showSuccess("Item deleted successfully!");
    }
  };

  const refreshInventory = async () => {
    await fetchInventoryItems();
    if (profile?.organizationId) {
      processAutoReorder(inventoryItems, addOrder, vendors, profile.organizationId);
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