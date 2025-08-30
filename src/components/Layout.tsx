import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { MadeWithDyad } from "./made-with-dyad";
import AnnouncementBar from "./AnnouncementBar";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import NotificationSheet from "./NotificationSheet"; // Import NotificationSheet
import GlobalSearchDialog from "./GlobalSearchDialog"; // Import GlobalSearchDialog

const Layout: React.FC = () => {
  const isMobile = useIsMobile();
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [isGlobalSearchDialogOpen, setIsGlobalSearchDialogOpen] = useState(false);

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
          <Sidebar />
          <div className="flex-grow flex flex-col overflow-y-auto"> {/* Added overflow-y-auto here */}
            <Header
              setIsNotificationSheetOpen={setIsNotificationSheetOpen}
              setIsGlobalSearchDialogOpen={setIsGlobalSearchDialogOpen}
            />
            <AnnouncementBar
              message="Welcome to Fortress. Let's Get You Set Up."
              linkTo="/setup-instructions"
              linkText="Click here"
            />
            <main className="flex-grow p-6 container mx-auto"> {/* Removed overflow-y-auto here */}
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