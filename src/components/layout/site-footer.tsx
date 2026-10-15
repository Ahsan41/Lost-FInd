"use client";

import Link from "next/link";
import { useReportDialog } from "@/components/app-shell";
import { Icon } from "@/components/ui/icon";

export function SiteFooter() {
  const openReport = useReportDialog();

  return (
    <footer className="site-footer">
      <div className="page-container">
        <div className="footer-statement">
          <p className="footer-statement-text">
            Found things only get home when someone <em>writes them down.</em>
          </p>
          <button className="button button-primary" onClick={openReport} type="button">
            <Icon name="plus" /> Report a found item
          </button>
        </div>

        <div className="footer-columns">
          <div className="footer-column">
            <p className="footer-column-label">The register</p>
            <ul className="footer-list">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/found-items">Found items</Link></li>
              <li><Link href="/found-items?category=Documents">Documents and ID cards</Link></li>
              <li><Link href="/found-items?category=Keys">Keys</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <p className="footer-column-label">How it works</p>
            <ol className="footer-steps">
              <li><span>01</span>A finder logs the item, the place and the date.</li>
              <li><span>02</span>An administrator checks the report before it is listed.</li>
              <li><span>03</span>The owner claims it with a detail only they would know.</li>
              <li><span>04</span>Both sides are put in touch and the entry is closed.</li>
            </ol>
          </div>
          <div className="footer-column">
            <p className="footer-column-label">Good to know</p>
            <ul className="footer-notes">
              <li>Contact details are never shown on a public listing.</li>
              <li>Items stay with the person who found them until a claim is approved.</li>
              <li>Claims and proof are seen only by the administrator.</li>
            </ul>
          </div>
        </div>

        <div className="footer-bar">
          <span className="footer-wordmark">LostNFind</span>
          <span className="footer-copy">© {new Date().getFullYear()} · A community found-property register</span>
          <Link className="footer-admin" href="/admin"><Icon name="lock" />Administrator sign in</Link>
        </div>
      </div>
    </footer>
  );
}
