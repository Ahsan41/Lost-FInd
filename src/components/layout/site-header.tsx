"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";

interface SiteHeaderProps {
  onReport: () => void;
}

export function SiteHeader({ onReport }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleReport() {
    setMenuOpen(false);
    onReport();
  }

  return (
    <header className="site-header">
      <div className="nav-inner">
        <Link aria-label="LostNFind home" className="brand" href="/">
          <span className="brand-mark"><Icon name="logo" /></span>
          <span className="brand-name">Lost<span>N</span>Find</span>
        </Link>
        <nav aria-label="Main navigation" className="nav-links">
          <Link aria-current={pathname === "/" ? "page" : undefined} className={`nav-link${pathname === "/" ? " nav-link-active" : ""}`} href="/">Home</Link>
          <Link aria-current={pathname === "/found-items" ? "page" : undefined} className={`nav-link${pathname === "/found-items" ? " nav-link-active" : ""}`} href="/found-items">Found items</Link>
        </nav>
        <button className="button button-primary nav-report" onClick={onReport} type="button">
          <Icon name="plus" /> Report an item
        </button>
        <button
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <Icon name={menuOpen ? "close" : "menu"} />
        </button>
        {menuOpen && (
          <nav aria-label="Mobile navigation" className="mobile-nav">
            <Link aria-current={pathname === "/" ? "page" : undefined} className="nav-link" href="/" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link aria-current={pathname === "/found-items" ? "page" : undefined} className="nav-link" href="/found-items" onClick={() => setMenuOpen(false)}>Found items</Link>
            <button className="button button-primary" onClick={handleReport} type="button"><Icon name="plus" /> Report an item</button>
          </nav>
        )}
      </div>
    </header>
  );
}
