import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { MadeWithDyad } from "./made-with-dyad";
import AnnouncementBar from "./AnnouncementBar";
import Sidebar from "./Sidebar"; // Import the new Sidebar
import { useIsMobile } from "@/hooks/use-mobile";
import NotificationSheet from "./NotificationSheet";
import GlobalSearchDialog from "./GlobalSearchDialog";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/SidebarContext"; // NEW: Import useSidebar

const Layout: React.FC = () => {
  const isMobile = useIsMobile();
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [isGlobalSearchDialogOpen, setIsGlobalSearchDialogOpen] = useState(false);
  const { isCollapsed, onToggleCollapse } = useSidebar(); // NEW: Use SidebarContext

  const sidebarWidthCollapsed = 80; // Matches Sidebar.tsx collapsed width
  const sidebarWidthExpanded = 280; // Matches Sidebar.tsx expanded width

  return (
    <div className="app-main-layout min-h-screen flex bg-background text-foreground "> {/* Added a space at the end of className */}
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
          <Sidebar isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} /> {/* NEW: Pass from context */}

          {/* Main Content Area */}
          <div
            className={cn(
              "flex-grow flex flex-col h-screen overflow-y-auto p-6 transition-all duration-200",
              "space-y-6"
            )}
            style={{ marginLeft: isCollapsed ? `${sidebarWidthCollapsed}px` : `${sidebarWidthExpanded}px` }} {/* NEW: Use isCollapsed from context */}
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