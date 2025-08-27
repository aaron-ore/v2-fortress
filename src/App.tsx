import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import CreatePurchaseOrder from "./pages/CreatePurchaseOrder";
import EditInventoryItem from "./pages/EditInventoryItem";
import EditPurchaseOrder from "./pages/EditPurchaseOrder";
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
import FeaturesPage from "./pages/FeaturesPage"; // NEW: Import FeaturesPage
import ResetPassword from "./pages/ResetPassword";
import { ThemeProvider } from "./components/ThemeProvider";
import { InventoryProvider } from "./context/InventoryContext";
import { OrdersProvider } from "./context/OrdersContext";
import { OnboardingProvider, useOnboarding } from "./context/OnboardingContext";
import { CategoryProvider } from "./context/CategoryContext";
import { NotificationProvider } from "./context/NotificationContext";
import { VendorProvider } from "./context/VendorContext";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { StockMovementProvider } from "./context/StockMovementContext";
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
import AdvancedDemandForecastPdfContent from "./components/AdvancedDemandForecastPdfContent"; // NEW: Import AdvancedDemandForecastPdfContent

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  return (
    <CategoryProvider>
      <InventoryProvider>
        <OrdersProvider>
          <NotificationProvider>
            <VendorProvider>
              <StockMovementProvider>
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
                    <Route path="users" element={<Users />} />
                    <Route path="setup-instructions" element={<SetupInstructions />} />
                    <Route path="warehouse-operations" element={<WarehouseOperationsPage />} />
                    <Route path="features" element={<FeaturesPage />} /> {/* NEW: Route for FeaturesPage */}
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </StockMovementProvider>
            </VendorProvider>
          </NotificationProvider>
        </OrdersProvider>
      </InventoryProvider>
    </CategoryProvider>
  );
};

const AppContent = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();
  const { isLoadingProfile } = useProfile();
  const { isPrinting, printContentData, resetPrintState } = usePrint();

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
        <ProfileProvider> {/* ProfileProvider now wraps OnboardingProvider */}
          <OnboardingProvider>
            <PrintProvider>
              <AppContent />
            </PrintProvider>
          </OnboardingProvider>
        </ProfileProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;