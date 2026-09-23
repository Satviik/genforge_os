"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { overviewDashboardData } from "@/lib/data/overview";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="gf-app-bg flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          pathname={pathname}
          dateRangeLabel={overviewDashboardData.dateRangeLabel}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 px-4 py-4 lg:px-5 lg:py-5">{children}</main>
      </div>
    </div>
  );
}
