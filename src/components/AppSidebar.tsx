
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Archive,
  Package,
  Settings,
  FileText,
  Search,
  Bell,
  Shield,
  ArrowBigLeft,
  Stethoscope,
  ShoppingCart,
  PackageCheck,
  Menu,
  X,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Archive },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Purchase Orders", url: "/purchase-orders", icon: ShoppingCart },
  { title: "Stock Receiving", url: "/stock-receiving", icon: PackageCheck },
  { title: "Equipment", url: "/equipment", icon: Stethoscope },
  { title: "Suppliers", url: "/suppliers", icon: Shield },
  { title: "Reports", url: "/reports", icon: FileText },
 /* { title: "Settings", url: "/settings", icon: Settings },*/
  { title: "Back To Admin Portal", url: "http://localhost:3001", icon: ArrowBigLeft },
];

export function AppSidebar() {
  const { state, openMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
  const currentPath = location.pathname;
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile && (
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden fixed top-4 left-4 z-[50] bg-white border"
          onClick={() => setOpenMobile(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <Sidebar 
        className={collapsed ? "w-14" : "w-64"} 
        collapsible="icon"
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between p-1">
            <div className="flex flex-col items-center flex-1">
              <span className="mx-auto">
                <img src="/logo.png" alt="DentalTrack Pro Logo" className="h-16 w-16 object-contain" />
              </span>
              {!collapsed && (
                <p className="text-sm text-gray-600 mt-1 p-2">Inventory Dashboard</p>
              )}
            </div>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4"
                onClick={() => setOpenMobile(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        <SidebarContent className="px-2 py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-500 font-medium mb-2">
              {!collapsed && "Main Menu"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = item.url === "/"
                    ? currentPath === "/"
                    : currentPath.startsWith(item.url);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        {item.url.startsWith("http") ? (
                          <a
                            href={item.url}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-emerald-600" : "text-gray-500"}`} />
                            {!collapsed && <span>{item.title}</span>}
                          </a>
                        ) : (
                          <NavLink
                            to={item.url}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                              isActive
                                ? "bg-emerald-100 text-emerald-700 border-l-4 border-emerald-500 shadow-sm"
                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                            onClick={() => isMobile && setOpenMobile(false)}
                          >
                            <item.icon
                              className={`h-5 w-5 flex-shrink-0 ${
                                isActive ? "text-emerald-600" : "text-gray-500"
                              }`}
                            />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
}
