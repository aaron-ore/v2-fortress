import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Search, Bell, User, LogOut, Users as UsersIcon, Settings as SettingsIcon, PackagePlus, ChevronDown, Warehouse, Sparkles } from "lucide-react"; // Added Sparkles icon
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showSuccess, showError } from "@/utils/toast";
import NotificationSheet from "./NotificationSheet";
import GlobalSearchDialog from "./GlobalSearchDialog";
import CurrentDateTime from "./CurrentDateTime";
import { useNotifications } from "@/context/NotificationContext";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/lib/supabaseClient";
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile
import MobileNav from "./mobile/MobileNav"; // Import MobileNav

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { profile } = useProfile();
  const isMobile = useIsMobile(); // Use the hook

  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [isGlobalSearchDialogOpen, setIsGlobalSearchDialogOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Dashboard" },
    { to: "/inventory", label: "Inventory" },
    { to: "/orders", label: "Orders" },
    { to: "/vendors", label: "Vendors" },
    { to: "/reports", label: "Reports" },
    { to: "/warehouse-operations", label: "Warehouse Ops" },
    { to: "/features", label: "Features" }, // NEW: Added Features tab
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Failed to log out: " + error.message);
    } else {
      showSuccess("Logged out successfully!");
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {isMobile && <MobileNav />} {/* Render MobileNav on mobile */}
        {/* Logo */}
        <div className="flex items-center space-x-2">
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
        </div>

        {/* Desktop Navigation Links */}
        {!isMobile && (
          <nav className="flex space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname.startsWith(link.to) && link.to !== "/"
                    ? "text-primary border-b-2 border-primary pb-1"
                    : location.pathname === "/" && link.to === "/"
                    ? "text-primary border-b-2 border-primary pb-1"
                    : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* Right-side Icons and Date/Time (Desktop Only) */}
      {!isMobile && (
        <div className="flex items-center space-x-4">
          <CurrentDateTime />
          <Button variant="ghost" size="icon" onClick={() => setIsGlobalSearchDialogOpen(true)}>
            <Search className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setIsNotificationSheetOpen(true)}
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            )}
          </Button>
          <NotificationSheet
            isOpen={isNotificationSheetOpen}
            onOpenChange={setIsNotificationSheetOpen}
          />
          <GlobalSearchDialog
            isOpen={isGlobalSearchDialogOpen}
            onClose={() => setIsGlobalSearchDialogOpen(false)}
          />

          {/* Profile Dropdown Menu for Desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>User & Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate("/profile"); }}>My Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate("/account-settings"); }}>Account Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate("/notifications-page"); }}>Notifications</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate("/billing"); }}>Billing & Subscriptions</DropdownMenuItem>
              {profile?.role === 'admin' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate("/users"); }}>
                  <UsersIcon className="h-4 w-4 mr-2" /> Users
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate("/settings"); }}>
                <SettingsIcon className="h-4 w-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Support & Resources</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate("/help"); }}>Help Center / Knowledge Base</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); showSuccess("Opening Contact Support / Live Chat."); }}>Contact Support or Live Chat</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate("/whats-new"); }}>What’s New? / Release notes</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="text-destructive focus:bg-destructive/10">
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
};

export default Header;