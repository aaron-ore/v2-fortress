import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { MadeWithDyad } from "./made-with-dyad";
import AnnouncementBar from "./AnnouncementBar";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import NotificationSheet from "./NotificationSheet"; // Import NotificationSheet
import GlobalSearchDialog from "./GlobalSearchDialog"; // Import GlobalSearchDialog
import { Button } from "@/components/ui/button"; // Import Button
import { Menu, ChevronLeft } from "lucide-react"; // Import icons
import { cn } from "@/lib/utils"; // Import cn

const Layout: React.FC = () => {
  const isMobile = useIsMobile();
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [isGlobalSearchDialogOpen, setIsGlobalSearchDialogOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Default collapsed

  const sidebarWidth = isCollapsed ? 60 : 250; // Define sidebar widths

  return (
    <div className="app-main-layout min-h-screen flex bg-background text-foreground">
      {isMobile ? (
        <>
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
        </>
      ) : (
        <>
          <Sidebar isCollapsed={isCollapsed} />
          {/* Toggle button fixed to the screen, positioned at the edge of the sidebar */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "fixed top-4 z-20 transition-all duration-200", // Fixed position
              `left-[${sidebarWidth}px] -translate-x-1/2`, // Dynamic left based on sidebarWidth
              "h-9 w-9 text-muted-foreground hover:bg-muted/20 hover:text-foreground"
            )}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>

          {/* Main content area, with dynamic left margin and its own scroll */}
          <div
            className={cn(
              "flex-grow flex flex-col h-screen overflow-y-auto", // Added h-screen and overflow-y-auto
              isCollapsed ? "ml-[60px]" : "ml-[250px]", // Dynamic margin-left
              "transition-all duration-200"
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
            <main className="flex-grow p-6 container mx-auto">
              <Outlet />
            </main>
            <div className="mt-auto"> {/* MadeWithDyad should be inside the scrollable area */}
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