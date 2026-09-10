import { LayoutDashboard, Database, Activity, Settings, Radio } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar
} from "./ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import api from "../lib/api";

const navItems = [
  { title: "Overview", icon: LayoutDashboard, url: "/" },
  { title: "Sensors", icon: Activity, url: "/sensors" },
  { title: "History Logs", icon: Database, url: "/history" },
  { title: "Settings", icon: Settings, url: "/settings" },
];

export function AppSidebar() {
  const [isOnline, setIsOnline] = useState(false);
  const { open } = useSidebar();
  const location = useLocation();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get("/status");
        if (res.status === 200) {
          setIsOnline(true);
        }
      } catch (err) {
        setIsOnline(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-slate-200/80 bg-white">
      <SidebarHeader className="p-3 border-b border-slate-100">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-500/20">
            <Radio className="size-4 animate-pulse" />
          </div>
          {open && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
                STASRG
              </span>
              <span className="text-[10px] font-medium text-slate-500 truncate">
                Sulfur Early Warning
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          {open && (
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                      className={`h-9 px-3 rounded-lg transition-colors font-medium text-sm ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 font-semibold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className={`size-4.5 ${isActive ? "text-emerald-600" : "text-slate-500"}`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-slate-100">
        <div
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all ${
            isOnline
              ? "bg-emerald-50/60 border-emerald-200/60 text-emerald-800"
              : "bg-amber-50/60 border-amber-200/60 text-amber-800"
          } ${!open ? "justify-center p-2" : ""}`}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOnline ? "bg-emerald-500" : "bg-amber-500"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isOnline ? "bg-emerald-600" : "bg-amber-600"
              }`}
            ></span>
          </span>

          {open && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-[11px] font-bold uppercase tracking-wider leading-none">
                {isOnline ? "Backend Live" : "Standalone"}
              </span>
              <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                FastAPI Gateway
              </span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}