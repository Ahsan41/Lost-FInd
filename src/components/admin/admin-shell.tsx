"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useAdminData } from "@/components/admin/admin-data-provider";
import { Icon } from "@/components/ui/icon";

const navigation = [
  { href: "/admin", label: "Overview", icon: "sparkle" },
  { href: "/admin/found-items", label: "Found Items", icon: "bag" },
  { href: "/admin/claims", label: "Claims", icon: "check-circle" },
  { href: "/admin/settings", label: "Settings", icon: "info" },
] as const;

function routeTitle(pathname: string) {
  if (pathname.startsWith("/admin/found-items")) return "Found Items";
  if (pathname.startsWith("/admin/claims")) return "Claims";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  return "Overview";
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const { claims } = useAdminData();

  useEffect(() => {
    if (!drawerOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = sidebarRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    focusable?.item(0)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawerOpen(false);
        return;
      }
      if (event.key !== "Tab" || !sidebarRef.current) return;
      const elements = sidebarRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      const first = elements.item(0);
      const last = elements.item(elements.length - 1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [drawerOpen]);

  return (
    <div className="admin-app">
      {drawerOpen && (
        <button
          aria-label="Close admin navigation"
          className="admin-mobile-scrim"
          onClick={() => setDrawerOpen(false)}
          type="button"
        />
      )}
      <aside
        ref={sidebarRef}
        aria-label={drawerOpen ? "Admin navigation drawer" : undefined}
        aria-modal={drawerOpen || undefined}
        className={`admin-sidebar${drawerOpen ? " admin-sidebar-open" : ""}`}
        role={drawerOpen ? "dialog" : undefined}
      >
        <div className="admin-brand-row">
          <Link aria-label="LostNFind admin overview" className="brand" href="/admin" onClick={() => setDrawerOpen(false)}>
            <span className="brand-mark"><Icon name="logo" /></span>
            <span className="brand-name">Lost<span>N</span>Find</span>
          </Link>
          <span className="admin-side-label">ADMIN</span>
          <button
            aria-label="Close admin navigation"
            className="button-icon admin-drawer-close"
            onClick={() => setDrawerOpen(false)}
            type="button"
          >
            <Icon name="close" />
          </button>
        </div>
        <p className="admin-nav-label">WORKSPACE</p>
        <nav aria-label="Admin navigation" className="admin-nav">
          {navigation.map(({ href, label, icon }) => {
            const active = href === "/admin"
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`admin-nav-link${active ? " admin-nav-link-active" : ""}`}
                href={href}
                key={href}
                onClick={() => setDrawerOpen(false)}
              >
                <Icon name={icon} />{label}
                {label === "Claims" && <span className="admin-nav-count">{claims.filter((claim) => claim.status === "Pending").length}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-prototype-card">
            <span className="admin-prototype-icon"><Icon name="shield" /></span>
            <strong>Prototype workspace</strong>
            <p>Changes stay in this browser session and are not saved.</p>
          </div>
          <Link className="admin-back-link" href="/"><Icon name="arrow-left" />Back to public site</Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-title">
            <button
              aria-expanded={drawerOpen}
              aria-label="Open admin navigation"
              className="button-icon admin-menu-toggle"
              onClick={() => setDrawerOpen(true)}
              type="button"
            >
              <Icon name="menu" />
            </button>
            <div>
              <p className="admin-breadcrumb">Workspace <span>/</span> {routeTitle(pathname)}</p>
              <h1>{routeTitle(pathname)}</h1>
            </div>
          </div>
          <div className="admin-header-actions">
            <span className="admin-prototype-pill"><span />Frontend prototype</span>
            <button aria-label="Admin profile placeholder" className="admin-avatar" title="Admin profile placeholder" type="button">AD</button>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
