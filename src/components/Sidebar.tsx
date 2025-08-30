"use client";

import React from "react";
import { cn } from "@/lib/utils"; // Keep cn for basic class joining

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  return (
    <div className={cn("fixed top-0 left-0 h-screen bg-blue-500 text-white p-4", isCollapsed ? "w-[80px]" : "w-[280px]")}>
      <h1>Sidebar Test</h1>
      <p>Status: {isCollapsed ? "Collapsed" : "Expanded"}</p>
      <button onClick={onToggleCollapse} className="mt-4 p-2 bg-blue-700 rounded">Toggle Sidebar</button>
    </div>
  );
};

export default Sidebar;