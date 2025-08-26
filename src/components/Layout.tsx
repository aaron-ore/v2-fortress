import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { MadeWithDyad } from "./made-with-dyad";
import AnnouncementBar from "./AnnouncementBar"; // Import AnnouncementBar

const Layout: React.FC = () => {
  return (
    <div className="app-main-layout min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <AnnouncementBar
        message="Welcome to Fortress. Let's Get You Set Up."
        linkTo="/setup-instructions"
        linkText="Click here"
      />
      <main className="flex-grow p-6 container mx-auto">
        <Outlet />
      </main>
      <div className="mt-auto">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Layout;