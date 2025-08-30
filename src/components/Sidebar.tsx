"use client";

import * as React from "react";
import { Fragment, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as ResizableComponents from "react-resizable-panels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Package,
  Receipt,
  Truck,
  BarChart,
  Warehouse,
  Search,
  Bell,
  User,
  LogOut,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { useProfile, UserProfile } from "@/context/ProfileContext"; // Import UserProfile
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess } from "@/utils/toast";
import NotificationSheet from "./NotificationSheet";
import GlobalSearchDialog from "./GlobalSearchDialog";
import { mainNavItems, userAndSettingsNavItems, supportAndResourcesNavItems, NavItem } from "@/lib/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
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

  const baseButtonClass = "h-10 w-full justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors";
  const activeClass = "bg-primary text-primary-foreground hover:bg-primary/90";
  const inactiveClass = "text-muted-foreground hover:bg-muted/20 hover:text-foreground";

  if (item.isParent && item.children) {
    return (
      <Accordion type="single" collapsible key={item.title} className="w-full">
        <AccordionItem value={item.title} className="border-none">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <AccordionTrigger className={cn(
                  baseButtonClass,
                  isCollapsed ? "justify-center" : "justify-start",
                  currentIsActive ? activeClass : inactiveClass,
                  "hover:no-underline"
                )}>
                  <item.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                  {!isCollapsed && (
                    <span className="truncate">{item.title}</span>
                  )}
                  {isCollapsed && <span className="sr-only">{item.title}</span>}
                </AccordionTrigger>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
            </Tooltip>
          </AccordionItem>
          <AccordionContent className="pb-1">
            <div className={cn("space-y-1", "ml-4 border-l border-muted/30 pl-2")}>
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
            </div>
          </AccordionContent>
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
              isCollapsed ? "justify-center" : "justify-start",
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


const Sidebar: React.FC<SidebarProps> = ({
  defaultSize = 18,
  minSize = 4,
  maxSize = 20,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { profile } = useProfile();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [isGlobalSearchDialogOpen, setIsGlobalSearchDialogOpen] = useState(false);

  // Determine if a given href is active or part of an active parent
  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    const { data: { session } } = await supabase.auth.getSession();
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

  return (
    <ResizableComponents.ResizablePanelGroup direction="horizontal" className="min-h-screen w-full">
      <ResizableComponents.ResizablePanel
        defaultSize={defaultSize}
        minSize={minSize}
        maxSize={maxSize}
        onCollapse={() => setIsCollapsed(true)}
        onExpand={() => setIsCollapsed(false)}
        collapsible={true}
        className={cn(
          "flex flex-col bg-card border-r border-border transition-all duration-200",
          isCollapsed ? "w-[60px]" : "w-[250px]",
        )}
      >
        {/* Top Section: Logo */}
        <div className="flex items-center justify-between p-4 h-[60px] flex-shrink-0">
          <div className={cn("flex items-center space-x-2", isCollapsed && "justify-center w-full")}>
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
            {!isCollapsed && (
              <span className="text-xl font-semibold text-foreground">Fortress</span>
            )}
          </div>
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

            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
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

            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
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
          </div>
        </ScrollArea>

        {/* Bottom Section: Global Search, Notifications, User Dropdown, Collapse Button */}
        <div className="mt-auto p-2 border-t border-border flex-shrink-0">
          <div className="flex flex-col space-y-1">
            {/* Global Search & Notifications */}
            <div className="flex items-center justify-between px-1">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setIsGlobalSearchDialogOpen(true)} className="h-9 w-9">
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && <TooltipContent side="right">Global Search</TooltipContent>}
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative h-9 w-9"
                      onClick={() => setIsNotificationSheetOpen(true)}
                    >
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && <TooltipContent side="right">Notifications</TooltipContent>}
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-10 w-full justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isCollapsed ? "justify-center" : "justify-start",
                    "text-muted-foreground hover:bg-muted/20 hover:text-foreground",
                  )}
                >
                  <User className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                  {!isCollapsed && (
                    <span className="truncate">{profile?.fullName || "My Profile"}</span>
                  )}
                  {!isCollapsed && (
                    <MoreVertical className="ml-auto h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" side="right" align="end">
                <DropdownMenuLabel>User & Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>My Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/account-settings")}>Account Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/notifications-page")}>Notifications</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/billing")}>Billing & Subscriptions</DropdownMenuItem>
                {profile?.role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate("/users")}>Users</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>Company Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Support & Resources</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/help")}>Help Center</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/whats-new")}>What’s New?</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/setup-instructions")}>Setup Instructions</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10">
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Collapse/Expand Button */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "h-10 w-full justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isCollapsed ? "justify-center" : "justify-start",
                      "text-muted-foreground hover:bg-muted/20 hover:text-foreground",
                    )}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-5 w-5" />
                    ) : (
                      <ChevronLeft className="h-5 w-5 mr-3" />
                    )}
                    {!isCollapsed && (
                      <span className="truncate">{isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}</span>
                    )}
                  </Button>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right">{isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </ResizableComponents.ResizablePanel>
      <ResizableComponents.ResizableHandle withHandle />

      <NotificationSheet
        isOpen={isNotificationSheetOpen}
        onOpenChange={setIsNotificationSheetOpen}
      />
      <GlobalSearchDialog
        isOpen={isGlobalSearchDialogOpen}
        onClose={() => setIsGlobalSearchDialogOpen(false)}
      />
    </ResizableComponents.ResizablePanelGroup>
  );
};

export default Sidebar;