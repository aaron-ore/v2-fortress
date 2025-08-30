import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { MadeWithDyad } from "./made-with-dyad";
import AnnouncementBar from "./AnnouncementBar";
import { useIsMobile } from "@/hooks/use-mobile";
import NotificationSheet from "./NotificationSheet";
import GlobalSearchDialog from "./GlobalSearchDialog";

const Layout: React.FC = () => {
  const isMobile = useIsMobile();
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [isGlobalSearchDialogOpen, setIsGlobalSearchDialogOpen] = useState(false);

  return (
    <div className="app-main-layout min-h-screen flex flex-col bg-background text-foreground">
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