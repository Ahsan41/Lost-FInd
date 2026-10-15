"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth-gate";
import { useAdminData } from "@/components/admin/admin-data-provider";
import { Icon } from "@/components/ui/icon";

const navigation = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/found-items", label: "Found items" },
  { href: "/admin/claims", label: "Claims" },
  { href: "/admin/analytics", label: "Analytics" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { claims, error, dismissError } = useAdminData();
  const { user, signOut } = useAdminAuth();
  const pendingClaims = claims.filter((claim) => claim.status === "Pending").length;

  return (
    <div className="desk-app">
      <header className="desk-topbar">
        <div className="desk-container desk-topbar-inner">
          <Link aria-label="LostNFind admin overview" className="brand" href="/admin">
            <span className="brand-name">LostNFind</span>
            <span className="desk-badge">Admin</span>
          </Link>
          <nav aria-label="Admin navigation" className="desk-tabs">
            {navigation.map(({ href, label }) => {
              const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className="desk-tab"
                  href={href}
                  key={href}
                >
                  {label}
                  {label === "Claims" && (
                    <span className={`desk-tab-count${pendingClaims > 0 ? " desk-tab-count-live" : ""}`}>
                      {pendingClaims}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="desk-user">
            <span className="desk-user-email" title={user.email}>{user.email}</span>
            <button className="button button-secondary button-small" onClick={() => void signOut()} type="button">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="desk-container desk-main">
        {error && (
          <div className="desk-alert" role="alert">
            <span>{error}</span>
            <button onClick={dismissError} type="button">Dismiss</button>
          </div>
        )}
        {children}
      </main>

      <footer className="desk-container desk-foot">
        <Link className="text-link" href="/"><Icon name="arrow-left" />Public site</Link>
        <span>Signed in as {user.name}</span>
      </footer>
    </div>
  );
}
