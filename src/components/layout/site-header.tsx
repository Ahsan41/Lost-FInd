"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";

interface SiteHeaderProps {
  onReport: () => void;
}

const links = [
  { href: "/", label: "Home" },
  { href: "/found-items", label: "Found items" },
] as const;

export function SiteHeader({ onReport }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleReport() {
    setMenuOpen(false);
    onReport();
  }

  return (
    <header className="site-header">
      <div className="page-container">
        <div className="site-header-inner">
          <Link aria-label="LostNFind home" className="brand" href="/">
            <span className="brand-name">LostNFind</span>
          </Link>
          <nav aria-label="Main navigation" className="site-nav">
            {links.map(({ href, label }) => (
              <Link
                aria-current={pathname === href ? "page" : undefined}
                className="site-nav-link"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="site-header-actions">
            <button className="button button-primary" onClick={onReport} type="button">
              <Icon name="plus" /> Report an item
            </button>
            <button
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="button-icon site-menu-toggle"
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              <Icon name={menuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav aria-label="Mobile navigation" className="site-nav-mobile">
            {links.map(({ href, label }) => (
              <Link
                aria-current={pathname === href ? "page" : undefined}
                className="site-nav-link"
                href={href}
                key={href}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <button className="button button-primary" onClick={handleReport} type="button">
              <Icon name="plus" /> Report an item
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
