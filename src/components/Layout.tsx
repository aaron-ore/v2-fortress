import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { MadeWithDyad } from "./made-with-dyad";
import AnnouncementBar from "./AnnouncementBar";
// import Sidebar from "./Sidebar"; // Temporarily removed
import { useIsMobile } from "@/hooks/use-mobile";
// import * as ResizableComponents from "react-resizable-panels"; // Temporarily removed

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
        // Temporarily replaced ResizableComponents with a basic div structure
        <div className="flex h-full">
          <div className="w-[250px] flex-shrink-0 flex flex-col bg-card border-r border-border">
            <div className="p-4 text-center text-muted-foreground">
              Placeholder Sidebar
            </div>
          </div>
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