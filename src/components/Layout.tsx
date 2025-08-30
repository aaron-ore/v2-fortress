import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { MadeWithDyad } from "./made-with-dyad";
import AnnouncementBar from "./AnnouncementBar";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
// Removed: import * as ResizableComponents from "react-resizable-panels";

const Layout: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div className="app-main-layout min-h-screen flex flex-col bg-background text-foreground">
      {isMobile ? (
        <>
          <Header />
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
        // Fixed desktop layout without ResizableComponents
        <div className="flex h-full">
          <Sidebar /> {/* Sidebar is now directly rendered */}
          <div className="flex-grow flex flex-col">
            <Header />
            <AnnouncementBar
              message="Welcome to Fortress. Let's Get You Set Up."
              linkTo="/setup-instructions"
              linkText="Click here"
            />
            <main className="flex-grow p-6 container mx-auto overflow-y-auto">
              <Outlet />
            </main>
          </div>
        </div>
      )}
      <div className="mt-auto">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Layout;