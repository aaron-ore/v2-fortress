import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, Archive, Printer } from "lucide-react"; // Removed Eye icon
import { showSuccess, showError } from "@/utils/toast";
import { useOrders, OrderItem, POItem } from "@/context/OrdersContext"; // Import POItem
import ConfirmDialog from "@/components/ConfirmDialog"; // Import ConfirmDialog
import PurchaseOrderPdfContent from "@/components/PurchaseOrderPdfContent"; // Corrected import path
import { useOnboarding } from "@/context/OnboardingContext"; // Import useOnboarding for company profile
import { usePrint } from "@/context/PrintContext"; // Import usePrint

const EditPurchaseOrder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, updateOrder, archiveOrder } = useOrders();
  const { companyProfile } = useOnboarding(); // Get company profile
  const { initiatePrint } = usePrint(); // Use initiatePrint from context
  const [order, setOrder] = useState<OrderItem | null>(null);

  const [poNumber, setPoNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [supplierEmail, setSupplierEmail] = useState(""); // Added for PDF
  const [supplierAddress, setSupplierAddress] = useState(""); // Added for PDF
  const [supplierContact, setSupplierContact] = useState(""); // Added for PDF
  const [poDate, setPoDate] = useState("");
  const [status, setStatus] = useState<OrderItem['status']>("New Order"); // Now a dropdown
  const [terms, setTerms] = useState("Net 30"); // Added for PDF
  const [dueDate, setDueDate] = useState(""); // New field
  const [orderType, setOrderType] = useState<OrderItem['orderType']>("Wholesale"); // New field
  const [shippingMethod, setShippingMethod] = useState<OrderItem['shippingMethod']>("Standard"); // New field
  const [notes, setNotes] = useState(""); // New field
  const [items, setItems] = useState<POItem[]>([]); // Now managing items

  const [isConfirmArchiveDialogOpen, setIsConfirmArchiveDialogOpen] = useState(false); // New state for archive confirmation

  const taxRate = 0.05; // Example tax rate (5%)

  useEffect(() => {
    if (id) {
      const foundOrder = orders.find((ord) => ord.id === id);
      if (foundOrder) {
        setOrder(foundOrder);
        setPoNumber(foundOrder.id);
        setSupplier(foundOrder.customerSupplier);
        setPoDate(foundOrder.date);
        setStatus(foundOrder.status);
        setDueDate(foundOrder.dueDate); // Set new field
        setOrderType(foundOrder.orderType); // Set new field
        setShippingMethod(foundOrder.shippingMethod); // Set new field
        setNotes(foundOrder.notes); // Set new field
        setItems(foundOrder.items || []); // Load items from the found order
        // For PDF content, we need more supplier details, which are not in OrderItem directly.
        // In a real app, you'd fetch these from a dedicated supplier context/DB.
        // For now, we'll use placeholders or derive from customerSupplier if possible.
        // For this demo, we'll leave them as empty strings for existing orders unless explicitly added.
        setSupplierEmail("");
        setSupplierAddress("");
        setSupplierContact("");
        setTerms(foundOrder.terms || "Net 30"); // Load terms
      } else {
        showError("Purchase Order not found.");
        navigate("/orders"); // Redirect if order not found
      }
    }
  }, [id, orders, navigate]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1, itemName: "", quantity: 0, unitPrice: 0 },
    ]);
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (
    id: number,
    field: keyof POItem,
    value: string | number,
  ) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const calculateTotalAmount = () => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    return subtotal * (1 + taxRate);
  };

  const handleSubmit = () => {
    if (!poNumber || !supplier || !poDate || !status || !dueDate || !orderType || !shippingMethod || items.some(item => !item.itemName || item.quantity <= 0 || item.unitPrice <= 0)) {
      showError("Please fill in all required fields and ensure all items have valid names, quantities, and prices.");
      return;
    }

    const updatedOrder: OrderItem = {
      ...order!, // Use non-null assertion as we check for order existence above
      id: poNumber,
      customerSupplier: supplier,
      date: poDate,
      status: status,
      dueDate: dueDate,
      orderType: orderType,
      shippingMethod: shippingMethod,
      notes: notes,
      totalAmount: calculateTotalAmount(), // Recalculate based on current items
      itemCount: items.length, // Update item count
      items: items, // Save the updated items
      terms: terms, // Save terms
    };
    updateOrder(updatedOrder);
    showSuccess(`Updated Purchase Order ${poNumber}!`);
    navigate("/orders");
  };

  const handleArchiveClick = () => {
    setIsConfirmArchiveDialogOpen(true);
  };

  const confirmArchiveOrder = () => {
    if (order) {
      archiveOrder(order.id);
      showSuccess(`Order ${order.id} has been archived.`);
      navigate("/orders");
    }
    setIsConfirmArchiveDialogOpen(false);
  };

  const handlePrintPdf = () => {
    if (!poNumber || !supplier || items.some(item => !item.itemName || item.quantity <= 0 || item.unitPrice <= 0)) {
      showError("Please fill in all required PO details before generating the PDF.");
      return;
    }
    if (!companyProfile) {
      showError("Company profile not set up. Please complete onboarding or set company details in settings.");
      return;
    }

    const pdfProps = {
      poNumber,
      poDate,
      supplierName: supplier, // Use the 'supplier' state from EditPurchaseOrder
      supplierEmail: supplierEmail, // Use the state variable
      supplierAddress: supplierAddress, // Use the state variable
      supplierContact: supplierContact, // Use the state variable
      recipientName: companyProfile.name,
      recipientAddress: companyProfile.address,
      recipientContact: companyProfile.currency, // Assuming currency is used as a generic contact for company
      terms, // Use the terms state
      dueDate,
      items,
      notes,
      taxRate,
      companyLogoUrl: localStorage.getItem("companyLogo") || undefined,
    };

    initiatePrint({ type: "purchase-order", props: pdfProps }); // Use initiatePrint
  };

  if (!order) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Loading order details...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Purchase Order: {order.id}</h1>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2"> {/* Adjusted for mobile stacking */}
        <Button variant="outline" onClick={() => navigate("/orders")}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Save Changes</Button>
        <Button variant="secondary" onClick={handlePrintPdf}>
          <Printer className="h-4 w-4 mr-2" /> Print/PDF
        </Button>
        {order.status !== "Archived" && (
          <Button variant="secondary" onClick={handleArchiveClick}>
            <Archive className="h-4 w-4 mr-2" /> Archive Order
          </Button>
        )}
      </div>

      {/* Main content of the page */}
      <div className="main-page-content">
        <div className="space-y-6 p-6 bg-background rounded-lg">
          <Card className="bg-card border-border rounded-lg shadow-sm p-6">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="poNumber">Order ID</Label>
                <Input
                  id="poNumber"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  disabled // Order ID usually not editable
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Customer/Supplier</Label>
                <Input
                  id="supplier"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poDate">Order Date</Label>
                <Input
                  id="poDate"
                  type="date"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as OrderItem['status'])}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New Order">New Order</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Packed">Packed</SelectItem>
                    <SelectItem value="Shipped">Shipped</SelectItem>
                    <SelectItem value="On Hold / Problem">On Hold / Problem</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem> {/* New status option */}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderType">Order Type</Label>
                <Select value={orderType} onValueChange={(value) => setOrderType(value as OrderItem['orderType'])}>
                  <SelectTrigger id="orderType">
                    <SelectValue placeholder="Select order type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Wholesale">Wholesale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingMethod">Shipping Method</Label>
                <Select value={shippingMethod} onValueChange={(value) => setShippingMethod(value as OrderItem['shippingMethod'])}>
                  <SelectTrigger id="shippingMethod">
                    <SelectValue placeholder="Select shipping method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Express">Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms">Terms</Label>
                <Input
                  id="terms"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="e.g., Net 30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  value={calculateTotalAmount().toFixed(2)}
                  disabled // Derived from items
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any special instructions or notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-lg shadow-sm p-6">
            <CardHeader className="pb-4 flex flex-row items-center justify-between flex-wrap gap-2"> {/* Added flex-wrap and gap */}
              <CardTitle className="text-xl font-semibold">Items</CardTitle>
              <Button variant="outline" size="sm" onClick={handleAddItem}> {/* Added size="sm" */}
                <PlusCircle className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto"> {/* Added overflow-x-auto for table */}
                <Table className="min-w-[600px]"> {/* Added min-w to ensure horizontal scroll */}
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[20px]"></TableHead>
                      <TableHead>Item Name</TableHead> {/* Removed fixed width */}
                      <TableHead className="w-[100px] text-right">Quantity</TableHead>
                      <TableHead className="w-[120px] text-right">Unit Price</TableHead>
                      <TableHead className="w-[120px] text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="w-[20px]"></TableCell>
                        <TableCell>
                          <Input
                            value={item.itemName}
                            onChange={(e) =>
                              handleItemChange(item.id, "itemName", e.target.value)
                            }
                            placeholder="Product Name"
                            className="min-w-[120px]"
                          />
                        </TableCell>
                        <TableCell className="text-right w-[100px]">
                          <Input
                            type="number"
                            value={item.quantity === 0 ? "" : item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "quantity",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            min="0"
                            className="min-w-[60px]"
                          />
                        </TableCell>
                        <TableCell className="text-right w-[120px]">
                          <Input
                            type="number"
                            value={item.unitPrice === 0 ? "" : item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "unitPrice",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            step="0.01"
                            min="0"
                            className="min-w-[80px]"
                          />
                        </TableCell>
                        <TableCell className="text-right font-semibold w-[120px]">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </TableCell>
                        <TableCell className="w-[50px]">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end items-center mt-4 text-lg font-bold">
                Total Amount: ${calculateTotalAmount().toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {order && (
        <ConfirmDialog
          isOpen={isConfirmArchiveDialogOpen}
          onClose={() => setIsConfirmArchiveDialogOpen(false)}
          onConfirm={confirmArchiveOrder}
          title="Confirm Archive Order"
          description={`Are you sure you want to archive Order ${order.id}? It will no longer appear in active views but can be found using the 'Archived' filter.`}
          confirmText="Archive"
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default EditPurchaseOrder;