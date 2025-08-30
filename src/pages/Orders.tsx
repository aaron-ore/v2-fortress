import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, Search, Edit, Archive, Eye, PackageCheck, PackagePlus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOrders, OrderItem, POItem } from "@/context/OrdersContext";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/context/ProfileContext";
import { useInventory } from "@/context/InventoryContext";
import { showError, showSuccess } from "@/utils/toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/DateRangePicker"; // NEW: Import DateRangePicker
import { DateRange } from "react-day-picker"; // NEW: Import DateRange
import FulfillOrderDialog from "@/components/orders/FulfillOrderDialog"; // NEW: Import FulfillOrderDialog
import ReceiveShipmentDialog from "@/components/orders/ReceiveShipmentDialog"; // NEW: Import ReceiveShipmentDialog
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  type: z.enum(["Sales", "Purchase"]),
  customerSupplier: z.string().min(1, "Customer/Supplier name is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["New Order", "Processing", "Packed", "Shipped", "On Hold / Problem", "Archived"]),
  totalAmount: z.number().min(0, "Total amount must be non-negative"),
  dueDate: z.string().min(1, "Due date is required"),
  itemCount: z.number().min(1, "At least one item is required"),
  notes: z.string().optional(),
  orderType: z.enum(["Retail", "Wholesale"]),
  shippingMethod: z.enum(["Standard", "Express"]),
  deliveryRoute: z.string().optional(),
  items: z.array(z.object({
    itemName: z.string().min(1, "Item name is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Unit price must be non-negative"),
    inventoryItemId: z.string().optional(),
  })).min(1, "At least one item is required"),
  terms: z.string().optional(),
});

interface AddOrderFormProps {
  onClose: () => void;
}

const AddOrderForm: React.FC<AddOrderFormProps> = ({ onClose }) => {
  const { addOrder } = useOrders();
  const { inventoryItems } = useInventory();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "Sales",
      customerSupplier: "",
      date: new Date().toISOString().split('T')[0],
      status: "New Order",
      totalAmount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      itemCount: 0,
      notes: "",
      orderType: "Retail",
      shippingMethod: "Standard",
      deliveryRoute: "",
      items: [{ itemName: "", quantity: 1, unitPrice: 0, inventoryItemId: "" }],
      terms: "",
    },
  });

  const watchItems = form.watch("items");
  useEffect(() => {
    const newTotalAmount = watchItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    form.setValue("totalAmount", newTotalAmount);
    form.setValue("itemCount", watchItems.length);
  }, [watchItems, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await addOrder(values);
      onClose();
      form.reset();
    } catch (error: any) {
      showError(`Failed to add order: ${error.message}`);
    }
  };

  const handleAddItem = () => {
    form.setValue("items", [...form.getValues("items"), { itemName: "", quantity: 1, unitPrice: 0, inventoryItemId: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    const currentItems = form.getValues("items");
    form.setValue("items", currentItems.filter((_, i) => i !== index));
  };

  const handleInventoryItemChange = (index: number, inventoryItemId: string) => {
    const selectedItem = inventoryItems.find(item => item.id === inventoryItemId);
    if (selectedItem) {
      form.setValue(`items.${index}.itemName`, selectedItem.name);
      form.setValue(`items.${index}.unitPrice`, selectedItem.retailPrice); // Or unitCost depending on order type
      form.setValue(`items.${index}.inventoryItemId`, selectedItem.id);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select order type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Purchase">Purchase</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="customerSupplier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{form.watch("type") === "Sales" ? "Customer Name" : "Supplier Name"}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
          )}
        />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="New Order">New Order</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Packed">Packed</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                  <SelectItem value="On Hold / Problem">On Hold / Problem</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="orderType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sales Order Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select order type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Wholesale">Wholesale</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shippingMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shipping Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shipping method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Express">Express</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="deliveryRoute"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Route (Optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <h3 className="text-lg font-semibold mt-6">Items</h3>
        {form.watch("items").map((item, index) => (
          <div key={index} className="border p-4 rounded-md space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Item #{index + 1}</h4>
              <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveItem(index)}>
                Remove
              </Button>
            </div>
            <FormField
              control={form.control}
              name={`items.${index}.inventoryItemId`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Inventory Item</FormLabel>
                  <Select onValueChange={(value) => handleInventoryItemChange(index, value)} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inventoryItems.map((invItem) => (
                        <SelectItem key={invItem.id} value={invItem.id}>
                          {invItem.name} (SKU: {invItem.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`items.${index}.itemName`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.unitPrice`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={handleAddItem}>
          Add Another Item
        </Button>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Terms and Conditions (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between items-center font-bold text-lg">
          <span>Total Amount:</span>
          <span>${form.watch("totalAmount").toFixed(2)}</span>
        </div>
        <Button type="submit" className="w-full">Add Order</Button>
      </form>
    </Form>
  );
};

export const createOrderColumns = (updateOrder: (order: OrderItem) => void, archiveOrder: (id: string) => void): ColumnDef<OrderItem>[] => [
  {
    accessorKey: "id",
    header: "Order ID",
    cell: ({ row }) => <Link to={`/orders/${row.original.id}`} className="font-medium hover:underline">{row.getValue("id")}</Link>,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant={row.original.type === "Sales" ? "info" : "default"}> {/* Using 'info' for Sales, 'default' for Purchase */}
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "customerSupplier",
    header: "Customer/Supplier",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "muted" = "info";
      switch (row.original.status) {
        case "New Order":
          variant = "default"; // Primary color
          break;
        case "Processing":
          variant = "secondary"; // Secondary color
          break;
        case "Packed":
          variant = "outline"; // Greenish
          break;
        case "Shipped":
          variant = "muted"; // Grayish
          break;
        case "On Hold / Problem":
          variant = "warning"; // Yellow/Orange
          break;
        case "Archived":
          variant = "destructive"; // Red
          break;
      }
      return <Badge variant={variant}>{row.original.status}</Badge>;
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Total Amount",
    cell: ({ row }) => `$${parseFloat(row.original.totalAmount.toString() || '0').toFixed(2)}`,
  },
  {
    accessorKey: "itemCount",
    header: "Items",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <Link to={`/orders/${row.original.id}`}>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" /> View
          </Button>
        </Link>
        <Link to={`/orders/${row.original.id}`}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
        </Link>
        {row.original.status !== "Archived" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => archiveOrder(row.original.id)}
          >
            <Archive className="h-4 w-4 mr-1" /> Archive
          </Button>
        )}
      </div>
    ),
  },
];

const Orders: React.FC = () => {
  const { orders, fetchOrders, updateOrder, archiveOrder } = useOrders();
  const { profile } = useProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOrderDialogOpen, setIsAddOrderDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // State for active tab

  // NEW: State for date range filter
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  // NEW: States for new dialogs
  const [isFulfillOrderDialogOpen, setIsFulfillOrderDialogOpen] = useState(false);
  const [isReceiveShipmentDialogOpen, setIsReceiveShipmentDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // NEW: Handler to clear date filter
  const handleClearDateFilter = () => {
    setDateRange(undefined);
  };

  const filteredOrders = useMemo(() => {
    let currentOrders = orders;

    // Apply tab filter
    if (activeTab === "sales") {
      currentOrders = currentOrders.filter(order => order.type === "Sales");
    } else if (activeTab === "purchase") {
      currentOrders = currentOrders.filter(order => order.type === "Purchase");
    } else if (activeTab === "archived") {
      currentOrders = currentOrders.filter(order => order.status === "Archived");
    } else {
      // "all" tab, exclude archived by default unless explicitly filtered
      currentOrders = currentOrders.filter(order => order.status !== "Archived");
    }

    // Apply search term filter
    const searchFiltered = currentOrders.filter(order =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerSupplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // NEW: Apply date range filter
    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = dateRange.to ? new Date(dateRange.to) : fromDate;
      toDate.setHours(23, 59, 59, 999);

      return searchFiltered.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }

    return searchFiltered;
  }, [orders, searchTerm, activeTab, dateRange]); // NEW: Add dateRange to dependencies

  const columns = useMemo(() => createOrderColumns(updateOrder, archiveOrder), [updateOrder, archiveOrder]);

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"> {/* NEW: Adjusted for layout */}
        <h1 className="text-3xl font-bold">Order Management</h1>
        <div className="flex flex-wrap items-center gap-2">
          {/* NEW: Order Actions Dropdown - Moved to the left */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Order Actions <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsReceiveShipmentDialogOpen(true)}>
                <PackagePlus className="h-4 w-4 mr-2" /> Receive Shipment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsFulfillOrderDialogOpen(true)}>
                <PackageCheck className="h-4 w-4 mr-2" /> Fulfill Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          {/* NEW: Date Range Picker */}
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          {dateRange?.from && (
            <Button variant="outline" onClick={handleClearDateFilter}>
              Clear Filter
            </Button>
          )}
          <Dialog open={isAddOrderDialogOpen} onOpenChange={setIsAddOrderDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new sales or purchase order.
                </DialogDescription>
              </DialogHeader>
              <AddOrderForm onClose={() => setIsAddOrderDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Active Orders</TabsTrigger>
          <TabsTrigger value="sales">Sales Orders</TabsTrigger>
          <TabsTrigger value="purchase">Purchase Orders</TabsTrigger>
          <TabsTrigger value="archived">Archived Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <div className=""> {/* Removed rounded-md border */}
            <DataTable columns={columns} data={filteredOrders} />
          </div>
        </TabsContent>
        <TabsContent value="sales">
          <div className=""> {/* Removed rounded-md border */}
            <DataTable columns={columns} data={filteredOrders} />
          </div>
        </TabsContent>
        <TabsContent value="purchase">
          <div className=""> {/* Removed rounded-md border */}
            <DataTable columns={columns} data={filteredOrders} />
          </div>
        </TabsContent>
        <TabsContent value="archived">
          <div className=""> {/* Removed rounded-md border */}
            <DataTable columns={columns} data={filteredOrders} />
          </div>
        </TabsContent>
      </Tabs>

      {/* NEW: Fulfill Order Dialog */}
      <FulfillOrderDialog
        isOpen={isFulfillOrderDialogOpen}
        onClose={() => setIsFulfillOrderDialogOpen(false)}
      />
      {/* NEW: Receive Shipment Dialog */}
      <ReceiveShipmentDialog
        isOpen={isReceiveShipmentDialogOpen}
        onClose={() => setIsReceiveShipmentDialogOpen(false)}
      />
    </div>
  );
};

export default Orders;