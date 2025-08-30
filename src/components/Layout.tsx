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

  return (
    <div className="app-main-layout min-h-screen flex flex-col bg-background text-foreground">
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
        <div className="flex h-full">
          <Sidebar isCollapsed={isCollapsed} />
          {/* Toggle button positioned absolutely relative to the main content area */}
          <div className={cn("flex-grow flex flex-col overflow-y-auto relative")}>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute top-4 z-20 transition-all duration-200",
                isCollapsed ? "left-0 -translate-x-1/2" : "left-0 -translate-x-1/2", // Always left-0, centered on the border
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
          </div>
        </div>
      )}
      <div className="mt-auto">
        <MadeWithDyad />
      </div>

      {/* Global Dialogs - rendered here so they are always available */}
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