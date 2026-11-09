"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { MobileModeSwitcher } from "@/components/shared/MobileModeSwitcher";

interface AdminShellProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [counts, setCounts] = useState<{ guests?: number; tables?: number }>({});
  const pathname = usePathname();

  // Fetch real counts from DB metrics
  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.kpis) {
          setCounts({
            guests: data.data.kpis.rsvp.total,
            tables: data.data.kpis.seating.totalTables,
          });
        }
      })
      .catch((err) => console.error("Error loading shell metrics:", err));
  }, [pathname]);

  // Close mobile sidebar automatically on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-[#0D1829] flex">
      {/* Responsive Admin Sidebar (Drawer on mobile, fixed on desktop) */}
      <AdminSidebar
        user={user}
        totalGuests={counts.guests}
        totalTables={counts.tables}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area: Full width on mobile, offset by 72 on desktop */}
      <div className="pl-0 lg:pl-72 flex-1 flex flex-col min-w-0 transition duration-300">
        <AdminHeader
          user={user}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />
        {/* Mode switcher bar below the admin header on mobile */}
        <MobileModeSwitcher topOffset="top-20" />
        {/* pt-20 (header) + 36px (mode bar) = pt-[56px] extra on mobile */}
        <main className="pt-20 flex-1 flex flex-col w-full min-w-0 max-w-full overflow-x-hidden">
          <div className="md:hidden h-9" />{/* mode bar spacer */}
          {children}
        </main>
      </div>
    </div>
  );
}
