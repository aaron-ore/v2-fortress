"use client";

import React, { Fragment, useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon, // Renamed to avoid conflict with profile.User
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { useProfile, UserProfile } from "@/context/ProfileContext";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess } from "@/utils/toast";
import { mainNavItems, userAndSettingsNavItems, supportAndResourcesNavItems, NavItem } from "@/lib/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
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

  const baseButtonClass = "h-10 w-full justify-start rounded-full py-2 text-sm font-medium transition-colors";
  const activeClass = "bg-sidebar-active-background text-sidebar-active-foreground hover:bg-sidebar-active-background/80";
  const inactiveClass = "text-sidebar-foreground hover:bg-sidebar-active-background/20 hover:text-sidebar-foreground";

  if (item.isParent && item.children) {
    return (
      <Accordion type="single" collapsible key={item.title} className="w-full">
        <AccordionItem value={item.title} className="border-none">
          <AccordionTrigger className={cn(
            baseButtonClass,
            "py-2",
            isCollapsed ? "justify-center px-0 [&>svg]:hidden" : "justify-start px-3",
            currentIsActive ? activeClass : inactiveClass,
            "hover:no-underline"
          )}>
            <div className="flex items-center">
              <item.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
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
              isCollapsed ? "justify-center px-0" : "justify-start px-3",
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
            <item.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
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

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { profile } = useProfile();

  const handleLogout = async () => {
    const { data: { session } = { session: null } } = await supabase.auth.getSession();
    if (!session) {
      showSuccess("You are already logged out.");
      navigate("/auth");
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Failed to log out: " + error.message);
    } else {
      showSuccess("Logged out successfully!");
    }
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div
      className={cn(
        "fixed top-0 left-0 h-screen flex flex-col bg-sidebar-background text-sidebar-foreground transition-all duration-200 z-30",
        isCollapsed ? "w-[80px]" : "w-[280px]", // Adjusted widths for better spacing
        "p-4" // Padding around the sidebar content
      )}
    >
      {/* Top Section: Logo and Toggle Button */}
      <div className="flex items-center justify-between h-[60px] flex-shrink-0 mb-4">
        <div className={cn("flex items-center space-x-2", isCollapsed ? "justify-center w-full" : "justify-start")}>
          <svg
            width="32" // Larger icon
            height="32"
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
          {!isCollapsed && (
            <span className="text-2xl font-bold text-sidebar-foreground">Fortress</span> {/* Larger text */}
          )}
        </div>
        {!isCollapsed && ( // Toggle button only visible when expanded
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-toggle-background"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Main Navigation Area */}
      <ScrollArea className="flex-grow pr-2"> {/* Added pr-2 for scrollbar space */}
        <nav className="space-y-2">
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

          <div className={cn("px-3 py-2 text-xs font-semibold uppercase", isCollapsed ? "text-center" : "text-left")}>
            {!isCollapsed && "User & Account"}
          </div>
          {userAndSettingsNavItems.map(item => (
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

          <div className={cn("px-3 py-2 text-xs font-semibold uppercase", isCollapsed ? "text-center" : "text-left")}>
            {!isCollapsed && "Support & Resources"}
          </div>
          {supportAndResourcesNavItems.map(item => (
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
        </nav>
      </ScrollArea>

      {/* Bottom Section: User Profile and Logout */}
      <div className={cn("mt-auto pt-4 border-t border-sidebar-border", isCollapsed ? "px-0" : "px-3")}>
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
          <div className={cn("flex items-center space-x-2", isCollapsed ? "w-full justify-center" : "")}>
            <Avatar className={cn("h-8 w-8", isCollapsed && "mx-auto")}>
              <AvatarImage src={profile?.avatarUrl} alt={profile?.fullName} />
              <AvatarFallback>{profile?.fullName?.split(' ').map(n => n[0]).join('') || <UserIcon className="h-4 w-4" />}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-sidebar-foreground truncate">{profile?.fullName || "Guest"}</span>
                <span className="text-xs text-sidebar-foreground/70 truncate">{profile?.role || "Viewer"}</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-toggle-background"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;