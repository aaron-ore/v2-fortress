"use client";

import * as React from "react";
import { Fragment, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Menu, // Changed to Menu for hamburger
  ChevronLeft, // For expanded state
  LogOut, // Still needed for logout in user dropdown
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { useProfile, UserProfile } from "@/context/ProfileContext";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess } from "@/utils/toast";
import { mainNavItems, NavItem } from "@/lib/navigation"; // Removed userAndSettingsNavItems, supportAndResourcesNavItems
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  isCollapsed: boolean; // Receive isCollapsed prop
}

interface SidebarNavItemProps {
  item: NavItem;
  isCollapsed: boolean;
  isActive: (href: string) => boolean;
  profile: UserProfile | null;
  unreadCount: number;
  navigate: ReturnType<typeof useNavigate>;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  item,
  isCollapsed,
  isActive,
  profile,
  unreadCount,
  navigate,
}) => {
  const currentIsActive = isActive(item.href);

  if (item.adminOnly && profile?.role !== 'admin') {
    return null;
  }

  // Base classes for the button, without horizontal padding
  const baseButtonClass = "h-10 w-full justify-start rounded-md py-2 text-sm font-medium transition-colors";
  const activeClass = "bg-primary text-primary-foreground hover:bg-primary/90";
  const inactiveClass = "text-muted-foreground hover:bg-muted/20 hover:text-foreground";

  if (item.isParent && item.children) {
    return (
      <Accordion type="single" collapsible key={item.title} className="w-full">
        <AccordionItem value={item.title} className="border-none">
          <AccordionTrigger className={cn(
            baseButtonClass,
            "py-2", // Ensure vertical padding
            isCollapsed ? "justify-center px-0 [&>svg]:hidden" : "justify-start px-3", // Hide chevron when collapsed
            currentIsActive ? activeClass : inactiveClass,
            "hover:no-underline"
          )}>
            <div className="flex items-center">
              <item.icon className={cn("h-6 w-6", !isCollapsed && "mr-3")} /> {/* Increased icon size */}
              {!isCollapsed && (
                <span className="truncate">{item.title}</span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-1">
            {item.children.map(child => (
              <SidebarNavItem
                key={child.title}
                item={child}
                isCollapsed={isCollapsed}
                isActive={isActive}
                profile={profile}
                unreadCount={unreadCount}
                navigate={navigate}
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <TooltipProvider key={item.title} delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              baseButtonClass,
              isCollapsed ? "justify-center px-0" : "justify-start px-3", // Adjust horizontal padding based on collapsed state
              currentIsActive ? activeClass : inactiveClass,
            )}
            onClick={() => {
              if (item.action) {
                item.action();
              } else {
                navigate(item.href);
              }
            }}
          >
            <item.icon className={cn("h-6 w-6", !isCollapsed && "mr-3")} /> {/* Increased icon size */}
            {!isCollapsed && (
              <span className="truncate">{item.title}</span>
            )}
            {item.title === "Notifications" && unreadCount > 0 && !isCollapsed && (
              <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        {isCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
};


const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => { // Receive isCollapsed
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { profile } = useProfile();

  // Determine if a given href is active or part of an active parent
  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-card border-r border-border transition-all duration-200 flex-shrink-0",
        isCollapsed ? "w-[60px]" : "w-[250px]",
      )}
    >
      {/* Top Section: Logo */}
      <div className="flex items-center justify-center p-4 h-[60px] flex-shrink-0">
        {isCollapsed ? (
          // Collapsed: Only triangle logo, centered
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <path
              d="M12 2L2 12L12 22L22 12L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M12 2L2 12L12 22L22 12L12 2Z"
              fill="currentColor"
              fillOpacity="0.2"
            />
          </svg>
        ) : (
          // Expanded: Full logo (triangle + text)
          <div className="flex items-center space-x-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary"
            >
              <path
                d="M12 2L2 12L12 22L22 12L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M12 2L2 12L12 22L22 12L12 2Z"
                fill="currentColor"
                fillOpacity="0.2"
              />
            </svg>
            <span className="text-xl font-semibold text-foreground">Fortress</span>
          </div>
        )}
      </div>

      {/* Main Navigation Area */}
      <ScrollArea className="flex-grow px-2 py-4">
        <div className="space-y-4">
          {mainNavItems.map(item => (
            <SidebarNavItem
              key={item.title}
              item={item}
              isCollapsed={isCollapsed}
              isActive={isActive}
              profile={profile}
              unreadCount={unreadCount}
              navigate={navigate}
            />
          ))}

          {/* Removed User & Account and Support & Resources sections from sidebar */}
        </div>
      </ScrollArea>

      {/* Removed entire bottom section (Global Search, Notifications, User Dropdown, old Collapse Button) */}
    </div>
  );
};

export default Sidebar;