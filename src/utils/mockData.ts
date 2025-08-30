import { InventoryItem } from "@/context/InventoryContext";
import { OrderItem, POItem } from "@/context/OrdersContext";
import { Vendor } from "@/context/VendorContext";
import { Category } from "@/context/CategoryContext";
import { ReplenishmentTask } from "@/context/ReplenishmentContext"; // NEW: Import ReplenishmentTask

// --- Mock Categories ---
export const mockCategories: Category[] = [
  { id: "cat-1", name: "Electronics", organizationId: "mock-org-1" },
  { id: "cat-2", name: "Office Supplies", organizationId: "mock-org-1" },
  { id: "cat-3", name: "Perishables", organizationId: "mock-org-1" },
  { id: "cat-4", name: "Tools", organizationId: "mock-org-1" },
  { id: "cat-5", name: "Apparel", organizationId: "mock-org-1" },
  { id: "cat-6", name: "Books", organizationId: "mock-org-1" }, // Added
  { id: "cat-7", name: "Home Goods", organizationId: "mock-org-1" }, // Added
];

// --- Mock Vendors ---
export const mockVendors: Vendor[] = [
  {
    id: "vendor-1",
    name: "Global Tech Inc.",
    contactPerson: "Alice Smith",
    email: "alice@globaltech.com",
    phone: "555-111-2222",
    address: "100 Tech Way, Silicon Valley, CA 94025",
    notes: "Primary supplier for electronics.",
    organizationId: "mock-org-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "vendor-2",
    name: "Office Essentials Co.",
    contactPerson: "Bob Johnson",
    email: "bob@officeessentials.com",
    phone: "555-333-4444",
    address: "200 Supply Rd, Business City, NY 10001",
    notes: "Reliable supplier for office goods.",
    organizationId: "mock-org-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "vendor-3", // Added
    name: "Bookworm Distributors",
    contactPerson: "Charlie Brown",
    email: "charlie@bookworm.com",
    phone: "555-555-6666",
    address: "300 Literary Lane, Storyville, MA 02138",
    notes: "Supplier for all book categories.",
    organizationId: "mock-org-1",
    createdAt: new Date().toISOString(),
  },
];

// --- Mock Inventory Items ---
export const mockInventoryItems: InventoryItem[] = [
  {
    id: "item-1",
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with long battery life.",
    sku: "WM-001",
    category: "Electronics",
    pickingBinQuantity: 10, // NEW
    overstockQuantity: 5, // NEW
    quantity: 15, // Derived
    reorderLevel: 20,
    pickingReorderLevel: 15, // NEW
    committedStock: 5,
    incomingStock: 0,
    unitCost: 15.00,
    retailPrice: 29.99,
    location: "Main Warehouse",
    pickingBinLocation: "MW-A-01-1-A", // NEW
    status: "Low Stock",
    lastUpdated: "2024-08-01",
    imageUrl: "https://via.placeholder.com/150/0000FF/FFFFFF?text=Mouse",
    vendorId: "vendor-1",
    barcodeUrl: "<svg xmlns='http://www.w3.org/2000/svg' width='150' height='50'><rect x='0' y='0' width='150' height='50' fill='white'/><text x='75' y='25' font-family='monospace' font-size='16' text-anchor='middle' fill='black'>WM-001</text></svg>",
    organizationId: "mock-org-1",
    autoReorderEnabled: false,
    autoReorderQuantity: 0,
  },
  {
    id: "item-2",
    name: "Mechanical Keyboard",
    description: "RGB mechanical keyboard with tactile switches.",
    sku: "MK-002",
    category: "Electronics",
    pickingBinQuantity: 3, // NEW
    overstockQuantity: 2, // NEW
    quantity: 5, // Derived
    reorderLevel: 10,
    pickingReorderLevel: 5, // NEW
    committedStock: 0,
    incomingStock: 20,
    unitCost: 60.00,
    retailPrice: 119.99,
    location: "Main Warehouse",
    pickingBinLocation: "MW-A-02-1-B", // NEW
    status: "Low Stock",
    lastUpdated: "2024-08-05",
    imageUrl: "https://via.placeholder.com/150/FF0000/FFFFFF?text=Keyboard",
    vendorId: "vendor-1",
    barcodeUrl: "<svg xmlns='http://www.w3.org/2000/svg' width='150' height='50'><rect x='0' y='0' width='150' height='50' fill='white'/><text x='75' y='25' font-family='monospace' font-size='16' text-anchor='middle' fill='black'>MK-002</text></svg>",
    organizationId: "mock-org-1",
    autoReorderEnabled: true,
    autoReorderQuantity: 10,
  },
  {
    id: "item-3",
    name: "Notebook (A4)",
    description: "Premium A4 notebook, 100 pages.",
    sku: "NB-003",
    category: "Office Supplies",
    pickingBinQuantity: 100, // NEW
    overstockQuantity: 20, // NEW
    quantity: 120, // Derived
    reorderLevel: 50,
    pickingReorderLevel: 80, // NEW
    committedStock: 10,
    incomingStock: 0,
    unitCost: 2.50,
    retailPrice: 4.99,
    location: "Store Front",
    pickingBinLocation: "SF-B-01-2-C", // NEW
    status: "In Stock",
    lastUpdated: "2024-07-20",
    imageUrl: "https://via.placeholder.com/150/00FF00/FFFFFF?text=Notebook",
    vendorId: "vendor-2",
    barcodeUrl: "<svg xmlns='http://www.w3.org/2000/svg' width='150' height='50'><rect x='0' y='0' width='150' height='50' fill='white'/><text x='75' y='25' font-family='monospace' font-size='16' text-anchor='middle' fill='black'>NB-003</text></svg>",
    organizationId: "mock-org-1",
    autoReorderEnabled: false,
    autoReorderQuantity: 0,
  },
  {
    id: "item-4",
    name: "Gel Pen (Blue)",
    description: "Smooth writing blue gel pen.",
    sku: "GP-004",
    category: "Office Supplies",
    pickingBinQuantity: 0, // NEW
    overstockQuantity: 0, // NEW
    quantity: 0, // Derived
    reorderLevel: 30,
    pickingReorderLevel: 20, // NEW
    committedStock: 0,
    incomingStock: 0,
    unitCost: 0.75,
    retailPrice: 1.50,
    location: "Store Front",
    pickingBinLocation: "SF-B-02-1-A", // NEW
    status: "Out of Stock",
    lastUpdated: "2024-08-10",
    imageUrl: "https://via.placeholder.com/150/FFFF00/000000?text=Pen",
    vendorId: "vendor-2",
    barcodeUrl: "<svg xmlns='http://www.w3.org/2000/svg' width='150' height='50'><rect x='0' y='0' width='150' height='50' fill='white'/><text x='75' y='25' font-family='monospace' font-size='16' text-anchor='middle' fill='black'>GP-004</text></svg>",
    organizationId: "mock-org-1",
    autoReorderEnabled: true,
    autoReorderQuantity: 50,
  },
  {
    id: "item-5",
    name: "Adjustable Wrench",
    description: "Heavy-duty adjustable wrench, 10-inch.",
    sku: "AW-005",
    category: "Tools",
    pickingBinQuantity: 25, // NEW
    overstockQuantity: 5, // NEW
    quantity: 30, // Derived
    reorderLevel: 10,
    pickingReorderLevel: 10, // NEW
    committedStock: 0,
    incomingStock: 0,
    unitCost: 12.00,
    retailPrice: 24.00,
    location: "Tool Shed",
    pickingBinLocation: "TS-C-01-1-A", // NEW
    status: "In Stock",
    lastUpdated: "2024-07-15",
    imageUrl: "https://via.placeholder.com/150/FF00FF/FFFFFF?text=Wrench",
    vendorId: "vendor-1",
    barcodeUrl: "<svg xmlns='http://www.w3.org/2000/svg' width='150' height='50'><rect x='0' y='0' width='150' height='50' fill='white'/><text x='75' y='25' font-family='monospace' font-size='16' text-anchor='middle' fill='black'>AW-005</text></svg>",
    organizationId: "mock-org-1",
    autoReorderEnabled: false,
    autoReorderQuantity: 0,
  },
  {
    id: "item-6",
    name: "T-Shirt (Large, Blue)",
    description: "Comfortable cotton t-shirt, large size, blue color.",
    sku: "TS-LB-006",
    category: "Apparel",
    pickingBinQuantity: 5, // NEW
    overstockQuantity: 3, // NEW
    quantity: 8, // Derived
    reorderLevel: 15,
    pickingReorderLevel: 10, // NEW
    committedStock: 2,
    incomingStock: 0,
    unitCost: 8.00,
    retailPrice: 18.00,
    location: "Main Warehouse",
    pickingBinLocation: "MW-B-03-2-D", // NEW
    status: "Low Stock",
    lastUpdated: "2024-08-03",
    imageUrl: "https://via.placeholder.com/150/00FFFF/000000?text=T-Shirt",
    organizationId: "mock-org-1",
    autoReorderEnabled: true,
    autoReorderQuantity: 20,
  },
  { // Added item
    id: "item-7",
    name: "The Great Novel",
    description: "A captivating fiction novel.",
    sku: "BOOK-001",
    category: "Books",
    pickingBinQuantity: 20,
    overstockQuantity: 10,
    quantity: 30,
    reorderLevel: 10,
    pickingReorderLevel: 15,
    committedStock: 0,
    incomingStock: 0,
    unitCost: 10.00,
    retailPrice: 19.99,
    location: "Book Storage",
    pickingBinLocation: "BS-A-01-1-A",
    status: "In Stock",
    lastUpdated: "2024-08-12",
    imageUrl: "https://via.placeholder.com/150/FFD700/000000?text=Book",
    vendorId: "vendor-3",
    barcodeUrl: "<svg xmlns='http://www.w3.org/2000/svg' width='150' height='50'><rect x='0' y='0' width='150' height='50' fill='white'/><text x='75' y='25' font-family='monospace' font-size='16' text-anchor='middle' fill='black'>BOOK-001</text></svg>",
    organizationId: "mock-org-1",
    autoReorderEnabled: false,
    autoReorderQuantity: 0,
  },
  { // Added item
    id: "item-8",
    name: "Ceramic Mug",
    description: "Stylish ceramic mug for coffee or tea.",
    sku: "MUG-001",
    category: "Home Goods",
    pickingBinQuantity: 15,
    overstockQuantity: 5,
    quantity: 20,
    reorderLevel: 10,
    pickingReorderLevel: 10,
    committedStock: 0,
    incomingStock: 0,
    unitCost: 5.00,
    retailPrice: 9.99,
    location: "Main Warehouse",
    pickingBinLocation: "MW-C-05-1-B",
    status: "In Stock",
    lastUpdated: "2024-08-14",
    imageUrl: "https://via.placeholder.com/150/808080/FFFFFF?text=Mug",
    organizationId: "mock-org-1",
    autoReorderEnabled: false,
    autoReorderQuantity: 0,
  },
].map(item => ({
  ...item,
  quantity: item.pickingBinQuantity + item.overstockQuantity, // Ensure consistency
}));

// --- Mock Orders ---
export const mockOrders: OrderItem[] = [
  {
    id: "SO-20240815001",
    type: "Sales",
    customerSupplier: "Customer A",
    date: "2024-08-15",
    status: "New Order",
    totalAmount: 149.95,
    dueDate: "2024-08-20",
    itemCount: 3,
    notes: "Customer requested express shipping.",
    orderType: "Retail",
    shippingMethod: "Express",
    deliveryRoute: "Route 1", // NEW
    items: [
      { id: 1, itemName: "Wireless Mouse", quantity: 3, unitPrice: 29.99, inventoryItemId: "item-1" },
      { id: 2, itemName: "Notebook (A4)", quantity: 10, unitPrice: 4.99, inventoryItemId: "item-3" },
    ],
    organizationId: "mock-org-1",
    terms: "Due on Receipt",
  },
  {
    id: "PO-20240814001",
    type: "Purchase",
    customerSupplier: "Global Tech Inc.",
    date: "2024-08-14",
    status: "Processing",
    totalAmount: 1200.00,
    dueDate: "2024-08-25",
    itemCount: 2,
    notes: "Urgent restock for keyboards.",
    orderType: "Wholesale",
    shippingMethod: "Standard",
    deliveryRoute: "N/A", // NEW
    items: [
      { id: 1, itemName: "Mechanical Keyboard", quantity: 20, unitPrice: 60.00, inventoryItemId: "item-2" },
    ],
    organizationId: "mock-org-1",
    terms: "Net 30",
  },
  {
    id: "SO-20240810002",
    type: "Sales",
    customerSupplier: "Customer B",
    date: "2024-08-10",
    status: "Packed",
    totalAmount: 59.98,
    dueDate: "2024-08-12",
    itemCount: 2,
    notes: "Standard delivery.",
    orderType: "Retail",
    shippingMethod: "Standard",
    deliveryRoute: "Route 2", // NEW
    items: [
      { id: 1, itemName: "Wireless Mouse", quantity: 2, unitPrice: 29.99, inventoryItemId: "item-1" },
    ],
    organizationId: "mock-org-1",
    terms: "Due on Receipt",
  },
  {
    id: "PO-20240805002",
    type: "Purchase",
    customerSupplier: "Office Essentials Co.",
    date: "2024-08-05",
    status: "Shipped",
    totalAmount: 75.00,
    dueDate: "2024-08-08",
    itemCount: 1,
    notes: "Received 100 gel pens.",
    orderType: "Wholesale",
    shippingMethod: "Standard",
    deliveryRoute: "N/A", // NEW
    items: [
      { id: 1, itemName: "Gel Pen (Blue)", quantity: 100, unitPrice: 0.75, inventoryItemId: "item-4" },
    ],
    organizationId: "mock-org-1",
    terms: "Net 30",
  },
  {
    id: "SO-20240728003",
    type: "Sales",
    customerSupplier: "Customer C",
    date: "2024-07-28",
    status: "Shipped",
    totalAmount: 18.00,
    dueDate: "2024-08-01",
    itemCount: 1,
    notes: "Delivered.",
    orderType: "Retail",
    shippingMethod: "Standard",
    deliveryRoute: "Route 1", // NEW
    items: [
      { id: 1, itemName: "T-Shirt (Large, Blue)", quantity: 1, unitPrice: 18.00, inventoryItemId: "item-6" },
    ],
    organizationId: "mock-org-1",
    terms: "Due on Receipt",
  },
  {
    id: "PO-20240720003",
    type: "Purchase",
    customerSupplier: "Global Tech Inc.",
    date: "2024-07-20",
    status: "Shipped",
    totalAmount: 360.00,
    dueDate: "2024-07-25",
    itemCount: 1,
    notes: "Received 30 wrenches.",
    orderType: "Wholesale",
    shippingMethod: "Standard",
    deliveryRoute: "N/A", // NEW
    items: [
      { id: 1, itemName: "Adjustable Wrench", quantity: 30, unitPrice: 12.00, inventoryItemId: "item-5" },
    ],
    organizationId: "mock-org-1",
    terms: "Net 30",
  },
  {
    id: "SO-20240816004",
    type: "Sales",
    customerSupplier: "Customer D",
    date: "2024-08-16",
    status: "On Hold / Problem",
    totalAmount: 36.00,
    dueDate: "2024-08-22",
    itemCount: 2,
    notes: "Payment issue.",
    orderType: "Retail",
    shippingMethod: "Standard",
    deliveryRoute: "Route 3", // NEW
    items: [
      { id: 1, itemName: "T-Shirt (Large, Blue)", quantity: 2, unitPrice: 18.00, inventoryItemId: "item-6" },
    ],
    organizationId: "mock-org-1",
    terms: "Due on Receipt",
  },
  { // Added order
    id: "SO-20240817005",
    type: "Sales",
    customerSupplier: "Book Nook Store",
    date: "2024-08-17",
    status: "New Order",
    totalAmount: 199.90,
    dueDate: "2024-08-24",
    itemCount: 10,
    notes: "Bulk order for new release.",
    orderType: "Wholesale",
    shippingMethod: "Standard",
    deliveryRoute: "Route 4",
    items: [
      { id: 1, itemName: "The Great Novel", quantity: 10, unitPrice: 19.99, inventoryItemId: "item-7" },
    ],
    organizationId: "mock-org-1",
    terms: "Net 30",
  },
  { // Added order
    id: "PO-20240818004",
    type: "Purchase",
    customerSupplier: "Home Goods Supplier",
    date: "2024-08-18",
    status: "New Order",
    totalAmount: 250.00,
    dueDate: "2024-09-01",
    itemCount: 50,
    notes: "Monthly restock of ceramic mugs.",
    orderType: "Wholesale",
    shippingMethod: "Standard",
    deliveryRoute: "N/A",
    items: [
      { id: 1, itemName: "Ceramic Mug", quantity: 50, unitPrice: 5.00, inventoryItemId: "item-8" },
    ],
    organizationId: "mock-org-1",
    terms: "Net 30",
  },
];

// --- Mock Locations (for OnboardingContext) ---
export const mockLocations: string[] = [
  "Main Warehouse",
  "Store Front",
  "Tool Shed",
  "Returns Area", // NEW
  "Cold Storage",
  "Book Storage", // Added
];

// --- Mock Company Profile (for OnboardingContext) ---
export const mockCompanyProfile = {
  name: "Fortress Inventory Solutions",
  currency: "USD",
  address: "789 Fortress Ave, Suite 200, Inventory City, IC 12345",
};

// --- Mock User Profile (for ProfileContext) ---
export const mockUserProfile = {
  id: "mock-user-id-123",
  fullName: "Admin User",
  email: "admin@example.com",
  phone: "555-000-1111",
  address: "123 Admin St, Admin City, AD 12345",
  avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=AdminUser",
  role: "admin",
  organizationId: "mock-org-1",
  createdAt: new Date().toISOString(),
};

// --- Mock All Profiles (for ProfileContext) ---
export const mockAllProfiles = [
  mockUserProfile,
  {
    id: "mock-user-id-456",
    fullName: "Inventory Manager",
    email: "manager@example.com",
    phone: "555-222-3333",
    address: "456 Manager Rd, Manager Town, MT 67890",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=InventoryManager",
    role: "inventory_manager",
    organizationId: "mock-org-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-user-id-789",
    fullName: "Warehouse Viewer",
    email: "viewer@example.com",
    phone: "555-444-5555",
    address: "789 Viewer Ln, Viewer Village, VV 10111",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=WarehouseViewer",
    role: "viewer",
    organizationId: "mock-org-1",
    createdAt: new Date().toISOString(),
  },
];

// --- Mock Replenishment Tasks (NEW) ---
export const mockReplenishmentTasks: ReplenishmentTask[] = [
  {
    id: "REPL-001",
    itemId: "item-1",
    itemName: "Wireless Mouse",
    fromLocation: "Main Warehouse",
    toLocation: "MW-A-01-1-A",
    quantity: 10,
    status: "Pending",
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    organizationId: "mock-org-1",
  },
  {
    id: "REPL-002",
    itemId: "item-2",
    itemName: "Mechanical Keyboard",
    fromLocation: "Main Warehouse",
    toLocation: "MW-A-02-1-B",
    quantity: 5,
    status: "Assigned",
    assignedTo: "mock-user-id-456",
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    organizationId: "mock-org-1",
  },
  { // Added task
    id: "REPL-003",
    itemId: "item-3",
    itemName: "Notebook (A4)",
    fromLocation: "Main Warehouse",
    toLocation: "SF-B-01-2-C",
    quantity: 30,
    status: "Pending",
    createdAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    organizationId: "mock-org-1",
  },
];