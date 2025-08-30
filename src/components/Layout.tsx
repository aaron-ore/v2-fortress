import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { MadeWithDyad } from "./made-with-dyad";
import AnnouncementBar from "./AnnouncementBar";
import Sidebar from "./Sidebar"; // Import the new Sidebar
import { useIsMobile } from "@/hooks/use-mobile";
import NotificationSheet from "./NotificationSheet";
import GlobalSearchDialog from "./GlobalSearchDialog";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react"; // Only ChevronRight for desktop toggle
import { cn } from "@/lib/utils";

const Layout: React.FC = () => {
  const isMobile = useIsMobile();
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [isGlobalSearchDialogOpen, setIsGlobalSearchDialogOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // State for sidebar collapse

  const sidebarWidthCollapsed = 80; // Matches Sidebar.tsx collapsed width
  const sidebarWidthExpanded = 280; // Matches Sidebar.tsx expanded width

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="app-main-layout min-h-screen flex bg-background text-foreground">
      {isMobile ? (
        <div className="flex flex-col w-full">
          <Header
            setIsNotificationSheetOpen={setIsNotificationSheetOpen}
            setIsGlobalSearchDialogOpen={setIsGlobalSearchDialogOpen}
          />
          <AnnouncementBar
            message="Welcome to Fortress. Let's Get You Set Up."
            linkTo="/setup-instructions"
            linkText="Click here"
          />
          <main className="flex-grow p-4 container mx-auto">
            <Outlet />
          </main>
          <div className="mt-auto">
            <MadeWithDyad />
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Sidebar */}
          <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={handleToggleSidebar} />

          {/* Sidebar Toggle Button (fixed, outside sidebar) */}
          {/* This button is now only visible when the sidebar is expanded, as the collapsed state has its own toggle */}
          {!isSidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "fixed top-6 z-40 transition-all duration-200",
                `left-[${sidebarWidthExpanded}px] -translate-x-1/2`, // Position when expanded
                "h-9 w-9 rounded-full bg-sidebar-toggle-background text-sidebar-foreground hover:bg-sidebar-toggle-background/80 shadow-md"
              )}
              onClick={handleToggleSidebar}
            >
              <ChevronRight className="h-5 w-5 rotate-180" /> {/* Always rotate 180 when visible (sidebar expanded) */}
            </Button>
          )}

          {/* Main Content Area */}
          <div
            className={cn(
              "flex-grow flex flex-col h-screen overflow-y-auto p-6 transition-all duration-200",
              isSidebarCollapsed ? `ml-[${sidebarWidthCollapsed}px]` : `ml-[${sidebarWidthExpanded}px]`,
              "space-y-6" // Spacing between floating header, announcement, and main content
            )}
          >
            <Header
              setIsNotificationSheetOpen={setIsNotificationSheetOpen}
              setIsGlobalSearchDialogOpen={setIsGlobalSearchDialogOpen}
            />
            <AnnouncementBar
              message="Welcome to Fortress. Let's Get You Set Up."
              linkTo="/setup-instructions"
              linkText="Click here"
            />
            <main className="flex-grow bg-card rounded-lg shadow-sm p-6"> {/* Main content as a floating card */}
              <Outlet />
            </main>
            <div className="mt-auto">
              <MadeWithDyad />
            </div>
          </div>
        </>
      )}

      {/* Global Dialogs - always rendered */}
      <NotificationSheet
        isOpen={isNotificationSheetOpen}
        onOpenChange={setIsNotificationSheetOpen}
      />
      <GlobalSearchDialog
        isOpen={isGlobalSearchDialogOpen}
        onClose={() => setIsGlobalSearchDialogOpen(false)}
      />
    </div>
  );
};

export default Layout;