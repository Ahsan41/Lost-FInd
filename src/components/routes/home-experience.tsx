"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FoundItem, ItemCategory } from "@/types/item";
import { useReportDialog } from "@/components/app-shell";
import { ClaimItemModal } from "@/components/forms/claim-item-modal";
import { ItemCard } from "@/components/items/item-card";
import { ItemDetailsModal } from "@/components/items/item-details-modal";
import { Icon, type IconName } from "@/components/ui/icon";
import { getPublicApiErrorMessage, publicApi } from "@/lib/public-api";

const categoryShortcuts: { label: ItemCategory; icon: IconName }[] = [
  { label: "Electronics", icon: "camera" },
  { label: "Bags & wallets", icon: "bag" },
  { label: "Accessories", icon: "sparkle" },
  { label: "Keys", icon: "key" },
];

export function HomeExperience() {
  const openReport = useReportDialog();
  const [selectedItem, setSelectedItem] = useState<FoundItem | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    publicApi.listFoundItems().then(
      (items) => {
        if (active) setFoundItems(items);
      },
      (error: unknown) => {
        if (active) setLoadError(getPublicApiErrorMessage(error));
      },
    ).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [retryCount]);

  const recentItems = foundItems.slice(0, 3);

  function retryLoading() {
    setLoading(true);
    setLoadError("");
    setRetryCount((count) => count + 1);
  }

  function finishClaim() {
    setClaiming(false);
    setSelectedItem(null);
  }

  return (
    <>
      <section className="hero-section">
        <div className="hero-inner">
          <p className="eyebrow"><span className="eyebrow-dot" />A little closer to found</p>
          <h1 className="hero-title">Lost something?<br /><span className="hero-title-accent">Let’s find it.</span></h1>
          <p className="hero-description">The kind-hearted corner of the internet where lost things find their way home. Search nearby finds or help someone reconnect with what matters.</p>
          <div className="hero-actions">
            <Link className="hero-action-card" href="/found-items">
              <span className="hero-action-icon"><Icon name="search" /></span>
              <span className="hero-action-content">
                <span className="hero-action-title">I lost something</span>
                <span className="hero-action-description">Browse recent finds and see if yours is here.</span>
              </span>
              <Icon className="hero-action-arrow" name="arrow-right" />
            </Link>
            <button className="hero-action-card hero-action-card-found" onClick={openReport} type="button">
              <span className="hero-action-icon"><Icon name="hand" /></span>
              <span className="hero-action-content">
                <span className="hero-action-title">I found something</span>
                <span className="hero-action-description">Tell us a little about it and help it get home.</span>
              </span>
              <Icon className="hero-action-arrow" name="arrow-right" />
            </button>
          </div>
          <form action="/found-items" className="hero-search" role="search">
            <Icon className="hero-search-icon" name="search" />
            <input aria-label="Search found items by name or location" name="q" placeholder="Try “blue backpack” or “Riverside Park”" />
            <button className="button button-primary" type="submit">Search</button>
          </form>
        </div>
      </section>

      <section aria-labelledby="category-heading" className="page-container home-section">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">A good place to start</p>
            <h2 className="section-title" id="category-heading">What are you looking for?</h2>
          </div>
        </div>
        <div className="category-shortcuts">
          {categoryShortcuts.map(({ label, icon }) => (
            <Link className="category-chip" href={`/found-items?category=${encodeURIComponent(label)}`} key={label}>
              <Icon name={icon} />{label}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-heading" className="page-container home-section">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Freshly found</p>
            <h2 className="section-title" id="recent-heading">Recently found items</h2>
            <p className="section-description">A few things waiting to be reunited with their people.</p>
          </div>
          <Link className="button button-primary home-view-all" href="/found-items">View all items <Icon name="arrow-right" /></Link>
        </div>
        {loadError ? (
          <div className="empty-state" role="alert">
            <p>{loadError}</p>
            <button className="button button-secondary button-small" onClick={retryLoading} type="button">Try again</button>
          </div>
        ) : loading ? (
          <div aria-label="Loading recent items" className="empty-state" role="status">
            <p>Loading recent community reports…</p>
          </div>
        ) : recentItems.length ? (
          <div className="items-grid">
            {recentItems.map((item) => <ItemCard item={item} key={item.id} onSelect={setSelectedItem} />)}
          </div>
        ) : (
          <div className="empty-state"><p>No approved found items yet.</p></div>
        )}
      </section>

      {selectedItem && (
        claiming ? (
          <ClaimItemModal item={selectedItem} onCancel={() => setClaiming(false)} onDone={finishClaim} />
        ) : (
          <ItemDetailsModal item={selectedItem} onClaim={() => setClaiming(true)} onClose={() => setSelectedItem(null)} />
        )
      )}
    </>
  );
}
