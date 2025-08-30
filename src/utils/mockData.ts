import { InventoryItem } from "@/context/InventoryContext";
import { Category } from "@/context/CategoryContext";
import { Vendor } from "@/context/VendorContext";
import { OrderItem, POItem } from "@/context/OrdersContext";
import { ReplenishmentTask } from "@/context/ReplenishmentContext";

// --- Mock Categories ---
export const mockCategories: Category[] = [];

// --- Mock Vendors ---
export const mockVendors: Vendor[] = [];

// --- Mock Inventory Items ---
export const mockInventoryItems: InventoryItem[] = [];

// --- Mock Orders ---
export const mockOrders: OrderItem[] = [];

// --- Mock Locations (for OnboardingContext) ---
export const mockLocations: string[] = [];

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
export const mockAllProfiles = [];

// --- Mock Replenishment Tasks (NEW) ---
export const mockReplenishmentTasks: ReplenishmentTask[] = [];