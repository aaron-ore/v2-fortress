import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess } from "@/utils/toast";
import { useProfile } from "./ProfileContext"; // Import useProfile

export interface POItem {
  id: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  inventoryItemId?: string; // New: Link to the actual inventory item
}

export interface OrderItem {
  id: string;
  type: "Sales" | "Purchase";
  customerSupplier: string;
  date: string; // This is the application-level date field
  status: "New Order" | "Processing" | "Packed" | "Shipped" | "On Hold / Problem" | "Archived";
  totalAmount: number;
  dueDate: string;
  itemCount: number;
  notes: string;
  orderType: "Retail" | "Wholesale";
  shippingMethod: "Standard" | "Express";
  items: POItem[]; // Added this field
  organizationId: string; // NEW: organization_id field
}

interface OrdersContextType {
  orders: OrderItem[];
  updateOrder: (updatedOrder: OrderItem) => void;
  addOrder: (newOrder: Omit<OrderItem, "id" | "organizationId">) => void;
  archiveOrder: (orderId: string) => void; // New: Function to archive an order
  fetchOrders: () => Promise<void>; // Add fetchOrders to context type
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

const initialOrders: OrderItem[] = []; // Cleared initial data

export const OrdersProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders);
  const { profile, isLoadingProfile } = useProfile(); // Use profile context

  const fetchOrders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) { // Ensure organizationId is available
      setOrders([]);
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("organization_id", profile.organizationId) // Filter by organization_id
      .order("created_at", { ascending: false }); // CHANGED: Order by 'created_at' instead of 'date'

    if (error) {
      console.error("Error fetching orders:", error);
      showError("Failed to load orders.");
    } else {
      const fetchedOrders: OrderItem[] = data.map((order: any) => ({
        id: order.id,
        type: order.type,
        customerSupplier: order.customer_supplier,
        date: order.created_at, // CHANGED: Map 'created_at' from DB to 'date' in app
        status: order.status,
        totalAmount: parseFloat(order.total_amount),
        dueDate: order.due_date,
        itemCount: order.item_count,
        notes: order.notes || "",
        orderType: order.order_type,
        shippingMethod: order.shipping_method,
        items: order.items || [], // Ensure items are mapped
        organizationId: order.organization_id, // Map organization_id
      }));
      setOrders(fetchedOrders);
    }
  }, [profile?.organizationId]); // Depend on profile.organizationId

  useEffect(() => {
    if (!isLoadingProfile) { // Only fetch once profile is loaded
      fetchOrders();
    }
  }, [fetchOrders, isLoadingProfile]);

  const updateOrder = async (updatedOrder: OrderItem) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      showError("You must be logged in and have an organization ID to update orders.");
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        type: updatedOrder.type,
        customer_supplier: updatedOrder.customerSupplier,
        created_at: updatedOrder.date, // CHANGED: Update 'created_at' in DB from 'date' in app
        status: updatedOrder.status,
        total_amount: updatedOrder.totalAmount,
        due_date: updatedOrder.dueDate,
        item_count: updatedOrder.itemCount,
        notes: updatedOrder.notes,
        order_type: updatedOrder.orderType,
        shipping_method: updatedOrder.shippingMethod,
        items: updatedOrder.items, // Update items array
      })
      .eq("id", updatedOrder.id)
      .eq("organization_id", profile.organizationId) // Filter by organization_id for update
      .select();

    if (error) {
      console.error("Error updating order:", error);
      showError(`Failed to update order: ${error.message}`);
    } else if (data && data.length > 0) {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === updatedOrder.id ? { ...updatedOrder, organizationId: data[0].organization_id } : order,
        ),
      );
      showSuccess(`Order ${updatedOrder.id} updated successfully!`);
    }
  };

  const addOrder = async (newOrder: Omit<OrderItem, "id" | "organizationId">) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      showError("You must be logged in and have an organization ID to add orders.");
      return;
    }

    const newId = `${newOrder.type === "Sales" ? "SO" : "PO"}${String(orders.length + 1).padStart(3, "0")}`;

    const { data, error } = await supabase
      .from("orders")
      .insert({
        id: newId,
        type: newOrder.type,
        customer_supplier: newOrder.customerSupplier,
        created_at: newOrder.date, // CHANGED: Insert 'created_at' in DB from 'date' in app
        status: newOrder.status,
        total_amount: newOrder.totalAmount,
        due_date: newOrder.dueDate,
        item_count: newOrder.itemCount,
        notes: newOrder.notes,
        order_type: newOrder.orderType,
        shipping_method: newOrder.shippingMethod,
        items: newOrder.items, // Insert items array
        user_id: session.user.id,
        organization_id: profile.organizationId, // Include organization_id
      })
      .select();

    if (error) {
      console.error("Error adding order:", error);
      showError(`Failed to add order: ${error.message}`);
    } else if (data && data.length > 0) {
      const addedOrder: OrderItem = { ...newOrder, id: data[0].id, organizationId: data[0].organization_id };
      setOrders((prevOrders) => [...prevOrders, addedOrder]);
      showSuccess(`Order ${addedOrder.id} created successfully!`);
    }
  };

  const archiveOrder = async (orderId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      showError("You must be logged in and have an organization ID to archive orders.");
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({ status: "Archived" })
      .eq("id", orderId)
      .eq("organization_id", profile.organizationId); // Filter by organization_id for update

    if (error) {
      console.error("Error archiving order:", error);
      showError(`Failed to archive order: ${error.message}`);
    } else {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: "Archived" } : order,
        ),
      );
      showSuccess(`Order ${orderId} has been archived.`);
    }
  };

  return (
    <OrdersContext.Provider value={{ orders, updateOrder, addOrder, archiveOrder, fetchOrders }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return context;
};