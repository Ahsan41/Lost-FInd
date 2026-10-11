import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-copy">© {new Date().getFullYear()} LostNFind. Made for the things that matter.</div>
        <Link className="footer-note" href="/found-items"><Icon name="heart" /> Good things find their way home <Icon name="arrow-right" /></Link>
      </div>
    </footer>
  );
}
