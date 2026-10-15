import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-container site-footer-inner">
        <div className="site-footer-brand">
          <span className="brand-name">LostNFind</span>
          <p>
            A community register of found belongings. Every report and every claim is checked
            by an administrator, and items stay with the person who found them until an
            ownership claim is approved.
          </p>
        </div>
        <nav aria-label="Footer" className="site-footer-links">
          <Link className="text-link" href="/">Home</Link>
          <Link className="text-link" href="/found-items">Found items</Link>
          <Link className="text-link" href="/admin">Administrator sign in</Link>
        </nav>
        <p className="site-footer-copy">© {new Date().getFullYear()} LostNFind</p>
      </div>
    </footer>
  );
}
