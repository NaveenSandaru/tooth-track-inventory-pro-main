
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

const menuItems = [
  { title: "Dashboard", url: "/", icon: Archive },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Purchase Orders", url: "/purchase-orders", icon: FileText },
  { title: "Stock Receiving", url: "/stock-receiving", icon: Package },
  { title: "Equipment", url: "/equipment", icon: Settings },
  { title: "Suppliers", url: "/suppliers", icon: Shield },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Back To Admin Portal", url: "http://localhost:3001", icon: ArrowBigLeft },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-dental-primary text-white font-medium shadow-sm" 
      : "hover:bg-blue-50 text-gray-700 hover:text-dental-primary";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-center">
          <img src="/logo.png" alt="DentalTrack Pro Logo" className="h-36 w-36 object-contain" />
        </div>
        
      </div>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 font-medium mb-2">
            {!collapsed && "Main Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => 
                        `flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavCls({ isActive })}`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
