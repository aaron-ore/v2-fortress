import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { showError } from "@/utils/toast";
import { useProfile } from "./ProfileContext";
// REMOVED: import { useActivityLogs } from "./ActivityLogContext";

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: "add" | "subtract";
  amount: number;
  oldQuantity: number;
  newQuantity: number;
  reason: string;
  timestamp: string;
  organizationId: string | null;
}

interface StockMovementContextType {
  stockMovements: StockMovement[];
  addStockMovement: (movement: Omit<StockMovement, "id" | "timestamp" | "organizationId">) => Promise<void>;
  fetchStockMovements: (itemId?: string) => Promise<void>;
}

const StockMovementContext = createContext<StockMovementContextType | undefined>(undefined);

export const StockMovementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const { profile, isLoadingProfile } = useProfile();
  // REMOVED: const { addActivity } = useActivityLogs();

  const fetchStockMovements = useCallback(async (itemId?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      setStockMovements([]);
      return;
    }

    let query = supabase
      .from("stock_movements")
      .select("*")
      .eq("organization_id", profile.organizationId)
      .order("timestamp", { ascending: false });

    if (itemId) {
      query = query.eq("item_id", itemId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching stock movements:", error);
      showError("Failed to load stock movements.");
      // No mock data for stock movements as it's highly dynamic and item-specific
    } else {
      const fetchedMovements: StockMovement[] = data.map((movement: any) => ({
        id: movement.id,
        itemId: movement.item_id,
        itemName: movement.item_name,
        type: movement.type,
        amount: movement.amount,
        oldQuantity: movement.old_quantity,
        newQuantity: movement.new_quantity,
        reason: movement.reason,
        timestamp: movement.timestamp,
        organizationId: movement.organization_id,
      }));
      setStockMovements(fetchedMovements);
    }
  }, [profile?.organizationId]);

  useEffect(() => {
    if (!isLoadingProfile) {
      fetchStockMovements();
    }
  }, [fetchStockMovements, isLoadingProfile]);

  const addStockMovement = async (movement: Omit<StockMovement, "id" | "timestamp" | "organizationId">) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      showError("You must be logged in and have an organization ID to log stock movements.");
      return;
    }

    const { data, error } = await supabase
      .from("stock_movements")
      .insert({
        item_id: movement.itemId,
        item_name: movement.itemName,
        type: movement.type,
        amount: movement.amount,
        old_quantity: movement.oldQuantity,
        new_quantity: movement.newQuantity,
        reason: movement.reason,
        user_id: session.user.id,
        organization_id: profile.organizationId,
      })
      .select();

    if (error) {
      console.error("Error adding stock movement:", error);
      // REMOVED: addActivity("Stock Movement Failed", `Failed to log stock movement for ${movement.itemName} (Item ID: ${movement.itemId}).`, { error: error.message, movement });
      showError(`Failed to log stock movement: ${error.message}`);
    } else if (data && data.length > 0) {
      const newMovement: StockMovement = {
        id: data[0].id,
        itemId: data[0].item_id,
        itemName: data[0].item_name,
        type: data[0].type,
        amount: data[0].amount,
        oldQuantity: data[0].old_quantity,
        newQuantity: data[0].new_quantity,
        reason: data[0].reason,
        timestamp: data[0].timestamp,
        organizationId: data[0].organization_id,
      };
      setStockMovements((prev) => [newMovement, ...prev]);
      // REMOVED: addActivity("Stock Movement", `${movement.type === 'add' ? 'Added' : 'Subtracted'} ${movement.amount} units of ${movement.itemName}. Reason: ${movement.reason}.`, { itemId: movement.itemId, itemName: movement.itemName, type: movement.type, amount: movement.amount, newQuantity: movement.newQuantity });
    }
  };

  return (
    <StockMovementContext.Provider value={{ stockMovements, addStockMovement, fetchStockMovements }}>
      {children}
    </StockMovementContext.Provider>
  );
};

export const useStockMovement = () => {
  const context = useContext(StockMovementContext);
  if (context === undefined) {
    throw new Error("useStockMovement must be used within a StockMovementProvider");
  }
  return context;
};