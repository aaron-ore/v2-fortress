import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Search,
  Bell,
  User,
  LogOut,
  Users as UsersIcon,
  Settings as SettingsIcon,
  PackagePlus,
  ChevronDown,
  HelpCircle,
  DollarSign,
  Sparkles,
  BookOpen,
  Warehouse,
  History,
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import NotificationSheet from "@/components/NotificationSheet";
import GlobalSearchDialog from "@/components/GlobalSearchDialog";
import CurrentDateTime from "@/components/CurrentDateTime";
import { useNotifications } from "@/context/NotificationContext";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/lib/supabaseClient";
import { useActivityLogs } from "@/context/ActivityLogContext";

const navLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/inventory", label: "Inventory" },
  { to: "/orders", label: "Orders" },
  { to: "/vendors", label: "Vendors" },
  { to: "/reports", label: "Reports" },
  { to: "/warehouse-operations", label: "Warehouse Ops" },
  { to: "/features", label: "Features" },
];

const MobileNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { profile } = useProfile();
  const { addActivity } = useActivityLogs();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [isGlobalSearchDialogOpen, setIsGlobalSearchDialogOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Failed to log out: " + error.message);
      addActivity("Logout Failed", `User ${profile?.email || 'Unknown'} failed to log out.`, { error: error.message });
    } else {
      showSuccess("Logged out successfully!");
      addActivity("Logout", `User ${profile?.email || 'Unknown'} logged out.`, {});
      setIsSheetOpen(false);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsSheetOpen(false);
  };

  const handleOpenNotificationSheet = () => {
    setIsNotificationSheetOpen(true);
    setIsSheetOpen(false);
  };

  const handleOpenGlobalSearchDialog = () => {
    setIsGlobalSearchDialogOpen(true);
    setIsSheetOpen(false);
  };

  const baseButtonClass = "justify-start text-base font-medium transition-colors hover:text-primary w-full";
  const activeLinkClass = "text-primary bg-muted";
  const inactiveLinkClass = "text-muted-foreground";

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] flex flex-col">
          <SheetHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
            <SheetTitle className="flex items-center space-x-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <path
                  d="M12 2L2 12L12 22L22 12L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 2L2 12L12 22L22 12L12 2Z"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
              </svg>
              <span className="text-xl font-semibold text-foreground">Fortress</span>
            </SheetTitle>
            <CurrentDateTime />
          </SheetHeader>

          <nav className="flex flex-col flex-grow space-y-2 py-4 overflow-y-auto">
            {navLinks.map((link) => (
              <Button
                key={link.to}
                variant="ghost"
                className={cn(
                  baseButtonClass,
                  location.pathname.startsWith(link.to) && link.to !== "/"
                    ? activeLinkClass
                    : location.pathname === "/" && link.to === "/"
                    ? activeLinkClass
                    : inactiveLinkClass,
                )}
                onClick={() => handleNavigation(link.to)}
              >
                {link.label}
              </Button>
            ))}

            <DropdownMenuSeparator />
            <p className="px-4 py-2 text-sm font-semibold text-muted-foreground">User & Account</p>
            <Button
              variant="ghost"
              className={cn(baseButtonClass, location.pathname === "/profile" ? activeLinkClass : inactiveLinkClass)}
              onClick={() => handleNavigation("/profile")}
            >
              <User className="h-4 w-4 mr-2" /> My Profile
            </Button>
            <Button
              variant="ghost"
              className={cn(baseButtonClass, location.pathname === "/account-settings" ? activeLinkClass : inactiveLinkClass)}
              onClick={() => handleNavigation("/account-settings")}
            >
              <SettingsIcon className="h-4 w-4 mr-2" /> Account Settings
            </Button>
            <Button
              variant="ghost"
              className={cn(baseButtonClass, inactiveLinkClass, "relative")}
              onClick={handleOpenNotificationSheet}
            >
              <Bell className="h-4 w-4 mr-2" /> Notifications
              {unreadCount > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              className={cn(baseButtonClass, location.pathname === "/billing" ? activeLinkClass : inactiveLinkClass)}
              onClick={() => handleNavigation("/billing")}
            >
              <DollarSign className="h-4 w-4 mr-2" /> Billing & Subscriptions
            </Button>
            {profile?.role === 'admin' && (
              <Button
                variant="ghost"
                className={cn(baseButtonClass, location.pathname === "/users" ? activeLinkClass : inactiveLinkClass)}
                onClick={() => handleNavigation("/users")}
              >
                <UsersIcon className="h-4 w-4 mr-2" /> Users
              </Button>
            )}
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              className={cn(baseButtonClass, location.pathname === "/settings" ? activeLinkClass : inactiveLinkClass)}
              onClick={() => handleNavigation("/settings")}
            >
              <SettingsIcon className="h-4 w-4 mr-2" /> Settings
            </Button>
            {/* NEW: Link to LogsPage */}
            <Button
              variant="ghost"
              className={cn(baseButtonClass, location.pathname === "/logs" ? activeLinkClass : inactiveLinkClass)}
              onClick={() => handleNavigation("/logs")}
            >
              <History className="h-4 w-4 mr-2" /> Activity Logs
            </Button>
            <DropdownMenuSeparator />
            <p className="px-4 py-2 text-sm font-semibold text-muted-foreground">Support & Resources</p>
            <Button
              variant="ghost"
              className={cn(baseButtonClass, location.pathname === "/help" ? activeLinkClass : inactiveLinkClass)}
              onClick={() => handleNavigation("/help")}
            >
              <HelpCircle className="h-4 w-4 mr-2" /> Help Center / Knowledge Base
            </Button>
            <Button
              variant="ghost"
              className={cn(baseButtonClass, inactiveLinkClass)}
              onClick={() => { showSuccess("Opening Contact Support / Live Chat."); setIsSheetOpen(false); }}
            >
              <HelpCircle className="h-4 w-4 mr-2" /> Contact Support
            </Button>
            <Button
              variant="ghost"
              className={cn(baseButtonClass, location.pathname === "/whats-new" ? activeLinkClass : inactiveLinkClass)}
              onClick={() => handleNavigation("/whats-new")}
            >
              <Sparkles className="h-4 w-4 mr-2" /> What’s New?
            </Button>
            <Button
              variant="ghost"
              className={cn(baseButtonClass, location.pathname === "/setup-instructions" ? activeLinkClass : inactiveLinkClass)}
              onClick={() => handleNavigation("/setup-instructions")}
            >
              <BookOpen className="h-4 w-4 mr-2" /> Setup Instructions
            </Button>
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              className={cn(baseButtonClass, "text-destructive focus:bg-destructive/10")}
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </nav>
        </SheetContent>
      </Sheet>

      <NotificationSheet
        isOpen={isNotificationSheetOpen}
        onOpenChange={setIsNotificationSheetOpen}
      />
      <GlobalSearchDialog
        isOpen={isGlobalSearchDialogOpen}
        onClose={() => setIsGlobalSearchDialogOpen(false)}
      />
    </>
  );
};

export default MobileNav;