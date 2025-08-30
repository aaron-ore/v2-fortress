import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Search, Bell, User, LogOut, MoreVertical, Menu } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import CurrentDateTime from "./CurrentDateTime";
import { useNotifications } from "@/context/NotificationContext";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/lib/supabaseClient";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNav from "./mobile/MobileNav"; // Keep MobileNav for the sheet trigger
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { userAndSettingsNavItems, supportAndResourcesNavItems, NavItem } from "@/lib/navigation";

interface HeaderProps {
  setIsNotificationSheetOpen: (isOpen: boolean) => void;
  setIsGlobalSearchDialogOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setIsNotificationSheetOpen, setIsGlobalSearchDialogOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { profile } = useProfile();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    const { data: { session } = { session: null } } = await supabase.auth.getSession();
    if (!session) {
      showSuccess("You are already logged out.");
      navigate("/auth");
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Failed to log out: " + error.message);
    } else {
      showSuccess("Logged out successfully!");
    }
  };

  const renderDropdownItems = (items: NavItem[]) => (
    <>
      {items.map((item) => {
        if (item.adminOnly && profile?.role !== 'admin') {
          return null;
        }
        return (
          <DropdownMenuItem key={item.title} onClick={() => navigate(item.href)}>
            {item.icon && <item.icon className="h-4 w-4 mr-2" />}
            {item.title}
            {item.title === "Notifications" && unreadCount > 0 && (
              <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </DropdownMenuItem>
        );
      })}
    </>
  );

  return (
    <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between h-[60px] flex-shrink-0">
      <div className="flex items-center space-x-4">
        {/* Hamburger icon and Fortress logo */}
        <MobileNav /> {/* This component now handles the SheetTrigger (hamburger + logo) */}
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
      </div>

      {/* Right-side Icons and Date/Time */}
      <div className="flex items-center space-x-2">
        <CurrentDateTime /> {/* Date/Time always in header */}
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

        {/* User Profile Dropdown (Desktop only) */}
        {!isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 w-auto justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted/20 hover:text-foreground"
              >
                <User className="h-5 w-5 mr-3" />
                <span className="truncate">{profile?.fullName || "My Profile"}</span>
                <MoreVertical className="ml-auto h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>User & Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {renderDropdownItems(userAndSettingsNavItems)}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Support & Resources</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {renderDropdownItems(supportAndResourcesNavItems)}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10">
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};

export default Header;