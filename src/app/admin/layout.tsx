import type { ReactNode } from "react";
import { AdminDataProvider } from "@/components/admin/admin-data-provider";
import { AdminShell } from "@/components/admin/admin-shell";
import "./admin.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminDataProvider>
      <AdminShell>{children}</AdminShell>
    </AdminDataProvider>
  );
}
