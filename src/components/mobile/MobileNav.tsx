import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Menu,
  LogOut,
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import CurrentDateTime from "@/components/CurrentDateTime";
import { useNotifications } from "@/context/NotificationContext";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/lib/supabaseClient";
import { mainNavItems, userAndSettingsNavItems, supportAndResourcesNavItems } from "@/lib/navigation";

const MobileNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { profile } = useProfile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLogout = async () => {
    const { data: { session } = { session: null } } = await supabase.auth.getSession();
    if (!session) {
      showSuccess("You are already logged out.");
      navigate("/auth");
      setIsSheetOpen(false);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Failed to log out: " + error.message);
    } else {
      showSuccess("Logged out successfully!");
      setIsSheetOpen(false);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsSheetOpen(false);
  };

  const baseButtonClass = "justify-start text-base font-medium transition-colors hover:text-primary w-full";
  const activeLinkClass = "text-primary bg-muted";
  const inactiveLinkClass = "text-muted-foreground";

  const renderNavItems = (items: typeof mainNavItems, isSubItem = false) => (
    <div className={cn("space-y-1", isSubItem && "ml-4 border-l border-muted/30 pl-2")}>
      {items.map((item) => {
        const currentIsActive = location.pathname.startsWith(item.href) || (item.href === "/" && location.pathname === "/");
        const isParentActive = item.isParent && currentIsActive;

        if (item.adminOnly && profile?.role !== 'admin') {
          return null;
        }

        if (item.isParent && item.children) {
          return (
            <Accordion type="single" collapsible key={item.title} className="w-full">
              <AccordionItem value={item.title} className="border-none">
                <AccordionTrigger className={cn(
                  baseButtonClass,
                  "py-2 px-3 flex items-center justify-between",
                  currentIsActive ? activeLinkClass : inactiveLinkClass,
                  "hover:no-underline"
                )}>
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3" />
                    <span className="truncate">{item.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                  {renderNavItems(item.children, true)}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        }

        return (
          <Button
            key={item.title}
            variant="ghost"
            className={cn(
              baseButtonClass,
              currentIsActive ? activeLinkClass : inactiveLinkClass,
            )}
            onClick={() => {
              if (item.action) {
                item.action();
              } else {
                handleNavigation(item.href);
              }
            }}
          >
            <item.icon className="h-5 w-5 mr-3" />
            <span className="truncate">{item.title}</span>
            {item.title === "Notifications" && unreadCount > 0 && (
              <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] flex flex-col">
        <SheetHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
          <SheetTitle className="flex items-center space-x-2">
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
          </SheetTitle>
          <CurrentDateTime />
        </SheetHeader>

        <nav className="flex flex-col flex-grow space-y-4 py-4 overflow-y-auto">
          {renderNavItems(mainNavItems)}

          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
            User & Account
          </div>
          {renderNavItems(userAndSettingsNavItems)}

          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
            Support & Resources
          </div>
          {renderNavItems(supportAndResourcesNavItems)}

          <div className="mt-auto pt-4 border-t border-border">
            <Button
              variant="ghost"
              className={cn(baseButtonClass, "text-destructive focus:bg-destructive/10")}
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" /> Logout
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;