"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { DEMO_ADMIN, useIsAdmin } from "@/demo/db";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const pathname = usePathname();

  // Misma protección que producción, con sesión demo en localStorage
  useEffect(() => {
    if (!isAdmin) router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }, [isAdmin, pathname, router]);

  if (!isAdmin) return null;

  return <AdminShell user={DEMO_ADMIN}>{children}</AdminShell>;
}
