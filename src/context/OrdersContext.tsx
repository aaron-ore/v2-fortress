import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess } from "@/utils/toast";
import { useProfile } from "./ProfileContext";
// REMOVED: import { mockOrders } from "@/utils/mockData";
// REMOVED: import { useActivityLogs } from "./ActivityLogContext";

export interface POItem {
  id: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  inventoryItemId?: string;
}

export interface OrderItem {
  id: string;
  type: "Sales" | "Purchase";
  customerSupplier: string;
  date: string;
  status: "New Order" | "Processing" | "Packed" | "Shipped" | "On Hold / Problem" | "Archived";
  totalAmount: number;
  dueDate: string;
  itemCount: number;
  notes: string;
  orderType: "Retail" | "Wholesale";
  shippingMethod: "Standard" | "Express";
  deliveryRoute?: string; // NEW: Added for picking wave creation
  items: POItem[];
  organizationId: string | null;
  terms?: string;
}

interface OrdersContextType {
  orders: OrderItem[];
  updateOrder: (updatedOrder: OrderItem) => void;
  addOrder: (newOrder: Omit<OrderItem, "id" | "organizationId">) => Promise<void>; // Made async
  archiveOrder: (orderId: string) => void;
  fetchOrders: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

const initialOrders: OrderItem[] = [];

export const OrdersProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders);
  const { profile, isLoadingProfile } = useProfile();
  // REMOVED: const { addActivity } = useActivityLogs();

  const mapSupabaseOrderItemToOrderItem = (order: any): OrderItem => {
    const totalAmount = parseFloat(order.total_amount || '0');
    const itemCount = parseInt(order.item_count || '0');
    const items: POItem[] = (order.items || []).map((item: any) => ({
      id: item.id,
      itemName: item.itemName,
      quantity: parseInt(item.quantity || '0'),
      unitPrice: parseFloat(item.unitPrice || '0'),
      inventoryItemId: item.inventoryItemId,
    }));

    // Ensure date strings are valid or provide a fallback
    const createdAtDate = order.created_at && !isNaN(new Date(order.created_at).getTime())
      ? order.created_at
      : new Date().toISOString().split('T')[0]; // Fallback to today's date
    
    const dueDate = order.due_date && !isNaN(new Date(order.due_date).getTime())
      ? order.due_date
      : new Date().toISOString().split('T')[0]; // Fallback to today's date

    return {
      id: order.id,
      type: order.type,
      customerSupplier: order.customer_supplier,
      date: createdAtDate, // Use validated date
      status: order.status,
      totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
      dueDate: dueDate, // Use validated date
      itemCount: isNaN(itemCount) ? 0 : itemCount,
      notes: order.notes || "",
      orderType: order.order_type,
      shippingMethod: order.shipping_method,
      deliveryRoute: order.delivery_route || undefined, // NEW
      items: items,
      organizationId: order.organization_id,
      terms: order.terms || undefined,
    };
  };

  const fetchOrders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      setOrders([]);
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("organization_id", profile.organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      showError("Failed to load orders.");
      setOrders([]); // Return empty array on error
    } else {
      const fetchedOrders: OrderItem[] = data.map(mapSupabaseOrderItemToOrderItem);
      setOrders(fetchedOrders); // Set fetched data, could be empty
    }
  }, [profile?.organizationId]);

  useEffect(() => {
    if (!isLoadingProfile) {
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
        created_at: updatedOrder.date,
        status: updatedOrder.status,
        total_amount: updatedOrder.totalAmount,
        due_date: updatedOrder.dueDate,
        item_count: updatedOrder.itemCount,
        notes: updatedOrder.notes,
        order_type: updatedOrder.orderType,
        shipping_method: updatedOrder.shippingMethod,
        delivery_route: updatedOrder.deliveryRoute, // NEW
        items: updatedOrder.items,
        terms: updatedOrder.terms,
      })
      .eq("id", updatedOrder.id)
      .eq("organization_id", profile.organizationId)
      .select();

    if (error) {
      console.error("Error updating order:", error);
      // REMOVED: addActivity("Order Update Failed", `Failed to update order: ${updatedOrder.id}.`, { error: error.message, orderId: updatedOrder.id });
      showError(`Failed to update order: ${error.message}`);
    } else if (data && data.length > 0) {
      const addedOrder: OrderItem = mapSupabaseOrderItemToOrderItem(data[0]);
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === updatedOrder.id ? addedOrder : order,
        ),
      );
      // REMOVED: addActivity("Order Updated", `Updated ${updatedOrder.type} order: ${updatedOrder.id} to status "${updatedOrder.status}".`, { orderId: updatedOrder.id, newStatus: updatedOrder.status });
      showSuccess(`Order ${updatedOrder.id} updated successfully!`);
    }
  };

  const addOrder = async (newOrder: Omit<OrderItem, "id" | "organizationId">) => { // Made async
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
        created_at: newOrder.date,
        status: newOrder.status,
        total_amount: newOrder.totalAmount,
        due_date: newOrder.dueDate,
        item_count: newOrder.itemCount,
        notes: newOrder.notes,
        order_type: newOrder.orderType,
        shipping_method: newOrder.shippingMethod,
        delivery_route: newOrder.deliveryRoute, // NEW
        items: newOrder.items,
        terms: newOrder.terms,
        user_id: session.user.id,
        organization_id: profile.organizationId,
      })
      .select();

    if (error) {
      console.error("Error adding order:", error);
      // REMOVED: addActivity("Order Add Failed", `Failed to add new ${newOrder.type} order for ${newOrder.customerSupplier}.`, { error: error.message, orderType: newOrder.type });
      showError(`Failed to add order: ${error.message}`);
    } else if (data && data.length > 0) {
      const addedOrder: OrderItem = mapSupabaseOrderItemToOrderItem(data[0]);
      setOrders((prevOrders) => [...prevOrders, addedOrder]);
      // REMOVED: addActivity("Order Added", `Created new ${addedOrder.type} order: ${addedOrder.id} for ${addedOrder.customerSupplier}.`, { orderId: addedOrder.id, orderType: addedOrder.type });
      showSuccess(`Order ${addedOrder.id} created successfully!`);
    }
  };

  const archiveOrder = async (orderId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile?.organizationId) {
      showError("You must be logged in and have an organization ID to archive orders.");
      return;
    }

    const orderToArchive = orders.find(o => o.id === orderId);

    const { error } = await supabase
      .from("orders")
      .update({ status: "Archived" })
      .eq("id", orderId)
      .eq("organization_id", profile.organizationId);

    if (error) {
      console.error("Error archiving order:", error);
      // REMOVED: addActivity("Order Archive Failed", `Failed to archive order: ${orderId}.`, { error: error.message, orderId });
      showError(`Failed to archive order: ${error.message}`);
    } else {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: "Archived" } : order,
        ),
      );
      // REMOVED: addActivity("Order Archived", `Archived order: ${orderId}.`, { orderId });
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