import React, { useState } from "react";
import Header from "./Header";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "../components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Routes, Route } from "react-router-dom";
import DashboardMainContent from "./DashboardMainContent";

// Pages
import LogsPage from "./pages/LogsPage";
import SensorsPage from "./pages/SensorsPage";
import SettingsPage from "./pages/SettingsPage";
import InfoPage from "./pages/InfoPage";

const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 bg-background">
          <Header />

          <main className="p-6">
            <Routes>
              <Route path="/" element={<DashboardMainContent />} />
              <Route path="/sensors" element={<SensorsPage />} />
              <Route path="/history" element={<LogsPage />} />
              <Route path="/info" element={<InfoPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>

        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
