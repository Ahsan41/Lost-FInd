"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ReportItemForm } from "@/components/forms/report-item-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Modal } from "@/components/ui/modal";

const ReportDialogContext = createContext<(() => void) | null>(null);

export function useReportDialog() {
  const openReport = useContext(ReportDialogContext);
  if (!openReport) throw new Error("useReportDialog must be used inside AppShell.");
  return openReport;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const [reportOpen, setReportOpen] = useState(false);
  const openReport = useCallback(() => setReportOpen(true), []);
  const closeReport = useCallback(() => setReportOpen(false), []);

  return (
    <ReportDialogContext.Provider value={openReport}>
      {isAdminRoute ? (
        <div className="admin-route">{children}</div>
      ) : (
        <div className="site-shell">
          <SiteHeader onReport={openReport} />
          <main className="site-main">{children}</main>
          <SiteFooter />
        </div>
      )}
      {!isAdminRoute && reportOpen && (
        <Modal onClose={closeReport} title="Report a found item">
          <ReportItemForm onCancel={closeReport} onDone={closeReport} />
        </Modal>
      )}
    </ReportDialogContext.Provider>
  );
}
