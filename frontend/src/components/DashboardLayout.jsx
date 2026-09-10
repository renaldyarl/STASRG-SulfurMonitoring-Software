import React from "react";
import Header from "./Header";
import { SidebarProvider, SidebarInset } from "../components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Routes, Route } from "react-router-dom";
import DashboardMainContent from "./DashboardMainContent";

// Pages
import LogsPage from "./pages/LogsPage";
import SensorsPage from "./pages/SensorsPage";
import SettingsPage from "./pages/SettingsPage";

const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50/60">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 bg-slate-50/60 min-w-0">
          <Header />

          <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
            <Routes>
              <Route path="/" element={<DashboardMainContent />} />
              <Route path="/sensors" element={<SensorsPage />} />
              <Route path="/history" element={<LogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
