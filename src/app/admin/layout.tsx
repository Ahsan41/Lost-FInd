import type { ReactNode } from "react";
import { AdminAuthGate } from "@/components/admin/admin-auth-gate";
import { AdminDataProvider } from "@/components/admin/admin-data-provider";
import { AdminShell } from "@/components/admin/admin-shell";
import "./admin.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGate>
      <AdminDataProvider>
        <AdminShell>{children}</AdminShell>
      </AdminDataProvider>
    </AdminAuthGate>
  );
}
