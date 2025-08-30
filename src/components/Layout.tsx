import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { MadeWithDyad } from "./made-with-dyad";
import AnnouncementBar from "./AnnouncementBar";
// import Sidebar from "./Sidebar"; // Temporarily removed
import { useIsMobile } from "@/hooks/use-mobile";
import * as ResizableComponents from "react-resizable-panels";

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
        <ResizableComponents.ResizablePanelGroup direction="horizontal">
          {/* <Sidebar /> */}
          <ResizableComponents.ResizablePanel defaultSize={18} minSize={4} maxSize={20} className="flex flex-col bg-card border-r border-border transition-all duration-200">
            <div className="p-4 text-center text-muted-foreground">
              Placeholder Sidebar
            </div>
          </ResizableComponents.ResizablePanel>
          <ResizableComponents.ResizableHandle withHandle />
          <ResizableComponents.ResizablePanel defaultSize={82}>
            <div className="flex flex-col h-full">
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
          </ResizableComponents.ResizablePanel>
        </ResizableComponents.ResizablePanelGroup>
      )}
      <div className="mt-auto">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Layout;