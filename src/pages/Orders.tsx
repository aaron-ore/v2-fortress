import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useOrders, OrderItem } from "@/context/OrdersContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Package, TrendingUp, Clock, AlertCircle, ChevronDown, Table2, LayoutGrid, PlusCircle } from "lucide-react";
import KanbanBoard from "@/components/orders/KanbanBoard";
import OrderListTable from "@/components/orders/OrderListTable"; // New import for list view
import ReceiveShipmentDialog from "@/components/orders/ReceiveShipmentDialog";
import FulfillOrderDialog from "@/components/orders/FulfillOrderDialog";
import TransferStockDialog from "@/components/orders/TransferStockDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // New import for toggle group

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { orders } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [shippingMethodFilter, setShippingMethodFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban"); // New state for view mode

  const [isReceiveShipmentDialogOpen, setIsReceiveShipmentDialogOpen] = useState(false);
  const [isFulfillOrderDialogOpen, setIsFulfillOrderDialogOpen] = useState(false);
  const [isTransferStockDialogOpen, setIsTransferStockDialogOpen] = useState(false);

  const handleCreatePO = () => navigate("/create-po");
  const handleCreateInvoice = () => navigate("/create-invoice");
  const handleReceiveShipment = () => setIsReceiveShipmentDialogOpen(true);
  const handleFulfillOrder = () => setIsFulfillOrderDialogOpen(true);
  const handleTransferStock = () => setIsTransferStockDialogOpen(true);

  const handleOrderClick = (order: OrderItem) => {
    navigate(`/orders/${order.id}`);
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerSupplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((order) => order.type === typeFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    } else {
      // Default 'all' filter should exclude archived orders
      filtered = filtered.filter((order) => order.status !== "Archived");
    }

    if (orderTypeFilter !== "all") {
      filtered = filtered.filter((order) => order.orderType === orderTypeFilter);
    }

    if (shippingMethodFilter !== "all") {
      filtered = filtered.filter((order) => order.shippingMethod === shippingMethodFilter);
    }

    return filtered;
  }, [orders, searchTerm, typeFilter, statusFilter, orderTypeFilter, shippingMethodFilter]);

  const uniqueOrderTypes = useMemo(() => {
    const types = new Set<string>();
    orders.forEach(order => types.add(order.orderType));
    return ["all", ...Array.from(types)];
  }, [orders]);

  const uniqueShippingMethods = useMemo(() => {
    const methods = new Set<string>();
    orders.forEach(order => methods.add(order.shippingMethod));
    return ["all", ...Array.from(methods)];
  }, [orders]);

  const today = new Date();
  const ordersDueToday = filteredOrders.filter(
    (order) =>
      new Date(order.dueDate).toDateString() === today.toDateString() &&
      order.status !== "Shipped" &&
      order.status !== "Packed" &&
      order.status !== "Archived" // Exclude archived from due today
  ).length;

  const totalNewOrders = filteredOrders.filter(order => order.status === "New Order").length;
  const totalProcessingOrders = filteredOrders.filter(order => order.status === "Processing").length;
  const totalPackedOrders = filteredOrders.filter(order => order.status === "Packed").length;
  const totalShippedOrders = filteredOrders.filter(order => order.status === "Shipped").length;
  const totalOnHoldOrders = filteredOrders.filter(order => order.status === "On Hold / Problem").length;


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" /> Create Order <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>New Order</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCreatePO}>Purchase Order</DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreateInvoice}>Sales Invoice</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="bg-card border-border rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNewOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProcessingOrders}</div>
            <p className="text-xs text-muted-foreground">In fulfillment</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Packed Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPackedOrders}</div>
            <p className="text-xs text-muted-foreground">Ready for shipment</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due Today</CardTitle>
            <CalendarDays className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersDueToday}</div>
            <p className="text-xs text-muted-foreground">Urgent orders</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">On Hold</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOnHoldOrders}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Consolidated row for actions, search, filters, and view mode */}
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Inventory Actions <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Stock Operations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleFulfillOrder}>Fulfill Order</DropdownMenuItem>
            <DropdownMenuItem onClick={handleReceiveShipment}>Receive Shipment</DropdownMenuItem>
            <DropdownMenuItem onClick={handleTransferStock}>Transfer Stock</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Input
          placeholder="Search orders..."
          className="max-w-xs bg-input border-border text-foreground flex-grow"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Sales">Sales</SelectItem>
            <SelectItem value="Purchase">Purchase</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Active</SelectItem> {/* Changed label */}
            <SelectItem value="New Order">New Order</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Packed">Packed</SelectItem>
            <SelectItem value="Shipped">Shipped</SelectItem>
            <SelectItem value="On Hold / Problem">On Hold / Problem</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem> {/* New filter option */}
          </SelectContent>
        </Select>
        <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by Order Type" />
          </SelectTrigger>
          <SelectContent>
            {uniqueOrderTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type === "all" ? "All Order Types" : type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={shippingMethodFilter} onValueChange={setShippingMethodFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by Shipping" />
          </SelectTrigger>
          <SelectContent>
            {uniqueShippingMethods.map(method => (
              <SelectItem key={method} value={method}>
                {method === "all" ? "All Shipping Methods" : method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <ToggleGroup type="single" value={viewMode} onValueChange={(value: "kanban" | "list") => value && setViewMode(value)} aria-label="View mode toggle">
          <ToggleGroupItem value="kanban" aria-label="Toggle Kanban view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="Toggle List view">
            <Table2 className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {orders.length > 0 ? (
        viewMode === "kanban" ? (
          <KanbanBoard onOrderClick={handleOrderClick} filteredOrders={filteredOrders} />
        ) : (
          <OrderListTable onOrderClick={handleOrderClick} filteredOrders={filteredOrders} />
        )
      ) : (
        <Card className="bg-card border-border rounded-lg p-6 text-center text-muted-foreground">
          <CardTitle className="text-xl font-semibold mb-2">No Orders Found</CardTitle>
          <CardContent>
            <p>Start by creating a new Purchase Order or importing sales data.</p>
            <Button onClick={handleCreatePO} className="mt-4">
              + Create First Purchase Order
            </Button>
          </CardContent>
        </Card>
      )}

      <ReceiveShipmentDialog
        isOpen={isReceiveShipmentDialogOpen}
        onClose={() => setIsReceiveShipmentDialogOpen(false)}
      />
      <FulfillOrderDialog
        isOpen={isFulfillOrderDialogOpen}
        onClose={() => setIsFulfillOrderDialogOpen(false)}
      />
      <TransferStockDialog
        isOpen={isTransferStockDialogOpen}
        onClose={() => setIsTransferStockDialogOpen(false)}
      />
    </div>
  );
};

export default Orders;