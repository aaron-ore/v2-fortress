import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Search, Bell, Menu } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import NotificationSheet from "./NotificationSheet";
import GlobalSearchDialog from "./GlobalSearchDialog";
import CurrentDateTime from "./CurrentDateTime";
import { useNotifications } from "@/context/NotificationContext";
import { useProfile } from "@/context/ProfileContext";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNav from "./mobile/MobileNav";

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { profile } = useProfile();
  const isMobile = useIsMobile();

  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [isGlobalSearchDialogOpen, setIsGlobalSearchDialogOpen] = useState(false);

  return (
    <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between h-[60px] flex-shrink-0">
      <div className="flex items-center space-x-4">
        {isMobile && <MobileNav />}
        {/* Logo and text only visible on mobile */}
        {isMobile && (
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
        )}
      </div>

      {/* Right-side Icons and Date/Time (Mobile Only) */}
      {isMobile && (
        <div className="flex items-center space-x-2">
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
        </div>
      )}

      <NotificationSheet
        isOpen={isNotificationSheetOpen}
        onOpenChange={setIsNotificationSheetOpen}
      />
      <GlobalSearchDialog
        isOpen={isGlobalSearchDialogOpen}
        onClose={() => setIsGlobalSearchDialogOpen(false)}
      />
    </header>
  );
};

export default Header;