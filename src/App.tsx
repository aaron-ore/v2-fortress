// src/App.tsx
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import CreatePurchaseOrder from "./pages/CreatePurchaseOrder";
import EditInventoryItem from "./pages/EditInventoryItem";
import EditPurchaseOrder from "./pages/EditPurchaseOrder"; // Corrected import path
import Auth from "./pages/Auth";
import MyProfile from "./pages/MyProfile";
import AccountSettings from "./pages/AccountSettings";
import NotificationsPage from "./pages/NotificationsPage";
import BillingSubscriptions from "./pages/BillingSubscriptions";
import HelpCenter from "./pages/HelpCenter";
import WhatsNew from "./pages/WhatsNew";
import Vendors from "./pages/Vendors";
import Users from "./pages/Users";
import CreateInvoice from "./pages/CreateInvoice";
import SetupInstructions from "./pages/SetupInstructions";
import WarehouseOperationsPage from "./pages/WarehouseOperationsPage";
import ResetPassword from "./pages/ResetPassword";
import Locations from "./pages/Locations";
import Customers from "./pages/Customers";
import Integrations from "./pages/Integrations"; // NEW: Import Integrations page
import FloorPlanPage from "./pages/FloorPlanPage"; // NEW: Import FloorPlanPage
import { ThemeProvider } from "./components/ThemeProvider";
import { InventoryProvider } from "./context/InventoryContext";
import { OrdersProvider } from "./context/OrdersContext";
import { OnboardingProvider, useOnboarding } from "./context/OnboardingContext";
import { CategoryProvider } from "./context/CategoryContext";
import { NotificationProvider } from "./context/NotificationContext";
import { VendorProvider } from "./context/VendorContext";
import { CustomerProvider } from "./context/CustomerContext";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { StockMovementProvider } from "./context/StockMovementContext";
import { ReplenishmentProvider } from "./context/ReplenishmentContext";
import { FloorPlanProvider } from "./context/FloorPlanContext"; // NEW: Import FloorPlanProvider
import OnboardingWizard from "./components/onboarding/OnboardingWizard";
import { supabase } from "./lib/supabaseClient";
import React, { useState, useEffect, useRef } from "react";
import AnnouncementBar from "./components/AnnouncementBar";
import ErrorBoundary from "./components/ErrorBoundary";
import { PrintProvider, usePrint } from "./context/PrintContext";
import PrintWrapper from "./components/PrintWrapper";
import DashboardSummaryPdfContent from "./components/DashboardSummaryPdfContent";
import PurchaseOrderPdfContent from "./components/PurchaseOrderPdfContent";
import InvoicePdfContent from "./components/InvoicePdfContent";
import AdvancedDemandForecastPdfContent from "./components/AdvancedDemandForecastPdfContent";
import PutawayLabelPdfContent from "./components/PutawayLabelPdfContent";
import LocationLabelPdfContent from "./components/LocationLabelPdfContent";
import PickingWavePdfContent from "./components/PickingWavePdfContent";
import { SidebarProvider } from "./context/SidebarContext";
import { showSuccess, showError } from "./utils/toast";

// NEW: Import all new PDF content components
import InventoryValuationPdfContent from "./components/reports/pdf/InventoryValuationPdfContent";
import LowStockPdfContent from "./components/reports/pdf/LowStockPdfContent";
import InventoryMovementPdfContent from "./components/reports/pdf/InventoryMovementPdfContent";
import SalesByCustomerPdfContent from "./components/reports/pdf/SalesByCustomerPdfContent";
import SalesByProductPdfContent from "./components/reports/pdf/SalesByProductPdfContent";
import PurchaseOrderStatusPdfContent from "./components/reports/pdf/PurchaseOrderStatusPdfContent";
import ProfitabilityPdfContent from "./components/reports/pdf/ProfitabilityPdfContent";
import DiscrepancyPdfContent from "./components/reports/pdf/DiscrepancyPdfContent";


const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  return (
    <SidebarProvider>
      <OrdersProvider>
        <VendorProvider>
          <CustomerProvider>
            <CategoryProvider>
              <NotificationProvider>
                <StockMovementProvider>
                  <ReplenishmentProvider>
                    <InventoryProvider>
                      <FloorPlanProvider> {/* NEW: Wrap with FloorPlanProvider */}
                        <Routes>
                          <Route path="/" element={<Layout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="inventory" element={<Inventory />} />
                            <Route path="inventory/:id" element={<EditInventoryItem />} />
                            <Route path="orders" element={<Orders />} />
                            <Route path="orders/:id" element={<EditPurchaseOrder />} />
                            <Route path="reports" element={<Reports />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="create-po" element={<CreatePurchaseOrder />} />
                            <Route path="create-invoice" element={<CreateInvoice />} />
                            <Route path="profile" element={<MyProfile />} />
                            <Route path="account-settings" element={<AccountSettings />} />
                            <Route path="notifications-page" element={<NotificationsPage />} />
                            <Route path="billing" element={<BillingSubscriptions />} />
                            <Route path="help" element={<HelpCenter />} />
                            <Route path="whats-new" element={<WhatsNew />} />
                            <Route path="vendors" element={<Vendors />} />
                            <Route path="customers" element={<Customers />} />
                            <Route path="users" element={<Users />} />
                            <Route path="setup-instructions" element={<SetupInstructions />} />
                            <Route path="warehouse-operations" element={<WarehouseOperationsPage />} />
                            <Route path="locations" element={<Locations />} />
                            <Route path="floor-plan" element={<FloorPlanPage />} /> {/* NEW: Add FloorPlanPage route */}
                            <Route path="integrations" element={<Integrations />} />
                            <Route path="*" element={<NotFound />} />
                          </Route>
                        </Routes>
                      </FloorPlanProvider>
                    </InventoryProvider>
                  </ReplenishmentProvider>
                </StockMovementProvider>
              </NotificationProvider>
            </CategoryProvider>
          </CustomerProvider>
        </VendorProvider>
      </OrdersProvider>
    </SidebarProvider>
  );
};

const AppContent = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoadingProfile, fetchProfile } = useProfile(); // Get fetchProfile from context
  const { isPrinting, printContentData, resetPrintState } = usePrint();

  // Ref to track if QuickBooks callback has been processed in this render cycle
  const qbCallbackProcessedRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingAuth(false);
      // Redirect logic:
      // If no session and not on auth or reset-password page, go to auth
      if (!session && !["/auth", "/reset-password"].includes(window.location.pathname)) {
        navigate("/auth");
      }
      // If session exists and on auth or reset-password page, go to home
      else if (session && ["/auth", "/reset-password"].includes(window.location.pathname)) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Handle QuickBooks OAuth callback messages and navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const quickbooksSuccess = params.get('quickbooks_success');
    const quickbooksError = params.get('quickbooks_error');
    const realmIdPresent = params.get('realmId_present');

    // NEW LOG: Log realmIdPresent value from URL
    console.log('App.tsx: realmId_present from URL parameters:', realmIdPresent);

    // Only process if there are QuickBooks params and it hasn't been processed yet
    if ((quickbooksSuccess || quickbooksError) && !qbCallbackProcessedRef.current) {
      if (quickbooksSuccess) {
        showSuccess("QuickBooks connected successfully!");
        // Explicitly refresh the session and then the profile
        supabase.auth.refreshSession().then(() => {
          fetchProfile(); // Fetch the profile to get the updated QuickBooks tokens
        });
      } else if (quickbooksError) {
        showError(`QuickBooks connection failed: ${quickbooksError}`);
      }

      // Mark as processed to prevent re-triggering on subsequent renders
      qbCallbackProcessedRef.current = true;

      // Navigate away from the callback URL to /settings
      navigate('/integrations', { replace: true }); // NEW: Redirect to Integrations page
    }
  }, [location.search, navigate, fetchProfile]);


  if (loadingAuth || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Loading application...
      </div>
    );
  }

  const mainAppRoutes = session ? (
    <ErrorBoundary>
      <Routes>
        <Route path="/*" element={<AuthenticatedApp />} />
      </Routes>
    </ErrorBoundary>
  ) : (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* The /quickbooks-oauth-callback route is now handled directly by AppContent's useEffect */}
      {!session && <Route path="*" element={<Auth />} />}
    </Routes>
  );

  return (
    <>
      {/* Main application content - always mounted, but hidden when printing */}
      <div className={isPrinting ? "hidden" : ""}>
        {mainAppRoutes}
      </div>

      {/* Print content - only renders its children when data is present */}
      {printContentData && (
        <PrintWrapper contentData={printContentData} onPrintComplete={resetPrintState}>
          {printContentData.type === "purchase-order" && (
            <PurchaseOrderPdfContent {...printContentData.props} />
          )}
          {printContentData.type === "invoice" && (
            <InvoicePdfContent {...printContentData.props} />
          )}
          {printContentData.type === "dashboard-summary" && (
            <DashboardSummaryPdfContent {...printContentData.props} />
          )}
          {printContentData.type === "advanced-demand-forecast" && (
            <AdvancedDemandForecastPdfContent {...printContentData.props} />
          )}
          {printContentData.type === "putaway-label" && (
            <PutawayLabelPdfContent {...printContentData.props} />
          )}
          {printContentData.type === "location-label" && (
            <LocationLabelPdfContent {...printContentData.props} />
          )}
          {printContentData.type === "picking-wave" && (
            <PickingWavePdfContent {...printContentData.props} />
          )}
          {/* NEW: Add new report PDF content components */}
          {printContentData.type === "inventory-valuation-report" && (
            <InventoryValuationPdfContent {...printContentData.props} />
          )}
          {printContentData.type === "low-stock-report" && (
            <LowStockPdfContent {...printContentData.props} />
          )}
          {printContentData.type === "inventory-movement-report" && (
            <InventoryMovementPdfContent {...printContentData.props} />
          )}
          {printContentData.type === "sales-by-customer-report" && (
            <SalesByCustomerPdfContent {...printContentData.props} />
          )}
          {printContentData.type === "sales-by-product-report" && (
            <SalesByProductPdfContent {...printContentData.props} />
          )}
          {printContentData.type === "purchase-order-status-report" && (
            <PurchaseOrderStatusPdfContent {...printContentData.props} />
          )}
          {printContentData.type === "profitability-report" && (
            <ProfitabilityPdfContent {...printContentData.props} />
          )}
          {printContentData.type === "discrepancy-report" && (
            <DiscrepancyPdfContent {...printContentData.props} />
          )}
        </PrintWrapper>
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <SonnerToaster
        richColors
        position="top-right"
        duration={3000}
        closeButton
        toastOptions={{
          style: {
            minWidth: '250px',
            maxWidth: '350px',
          },
        }}
      />
      <BrowserRouter>
        <ProfileProvider>
            <OnboardingProvider>
              <PrintProvider>
                <TooltipProvider>
                  <AppContent />
                </TooltipProvider>
              </PrintProvider>
            </OnboardingProvider>
        </ProfileProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;