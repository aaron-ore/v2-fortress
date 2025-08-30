import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { MadeWithDyad } from "./made-with-dyad";
import AnnouncementBar from "./AnnouncementBar";
import Sidebar from "./Sidebar"; // Import the new Sidebar component
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "react-resizable-panels"; // Reverted to named imports

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
        <ResizablePanelGroup direction="horizontal">
          <Sidebar />
          <ResizablePanel defaultSize={82}> {/* Main content panel */}
            <div className="flex flex-col h-full">
              <Header /> {/* Header for desktop (now only contains global actions) */}
              <AnnouncementBar
                message="Welcome to Fortress. Let's Get You Set Up."
                linkTo="/setup-instructions"
                linkText="Click here"
              />
              <main className="flex-grow p-6 container mx-auto overflow-y-auto">
                <Outlet />
              </main>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
      <div className="mt-auto">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Layout;