"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { itemCategories, type FoundItem } from "@/types/item";
import { useReportDialog } from "@/components/app-shell";
import { ClaimItemModal } from "@/components/forms/claim-item-modal";
import { ItemCard } from "@/components/items/item-card";
import { ItemDetailsModal } from "@/components/items/item-details-modal";
import { Icon } from "@/components/ui/icon";
import { SkeletonEntries } from "@/components/ui/skeleton-entries";
import { formatDate } from "@/lib/format";
import { getPublicApiErrorMessage, publicApi } from "@/lib/public-api";

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

  const tally = useMemo(() => {
    const waiting = foundItems.filter((item) => item.status === "Waiting for owner").length;
    const latest = foundItems.reduce<string | null>(
      (newest, item) => (newest === null || item.foundDate > newest ? item.foundDate : newest),
      null,
    );
    const byCategory = new Map<string, number>();
    for (const item of foundItems) byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + 1);
    return { waiting, reunited: foundItems.length - waiting, latest, byCategory };
  }, [foundItems]);

  const ready = !loading && !loadError;

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
      <section className="desk">
        <div className="page-container desk-grid">
          <div>
            <p className="kicker">Found-property register</p>
            <h1 className="desk-title">
              Lost something? Start with what has <em>already been found.</em>
            </h1>
            <p className="lede desk-lede">
              People who find belongings log them here with where and when they were found.
              Search the register, open an entry, and send a private claim if it is yours.
            </p>
            <form action="/found-items" className="desk-search" role="search">
              <div className="desk-search-input">
                <Icon name="search" />
                <input
                  aria-label="Search found items by name or location"
                  className="field-input"
                  name="q"
                  placeholder="Try “black wallet”, “Central Library” or “keys”"
                  type="text"
                />
              </div>
              <button className="button button-primary" type="submit">Search the register</button>
            </form>
            <p className="desk-search-hint">Searches item names, descriptions, categories and the place they were found.</p>
          </div>

          <aside aria-label="Register at a glance" className="tally">
            <p className="tally-title">Register at a glance</p>
            <dl>
              <div>
                <dt>Waiting for an owner</dt>
                <dd>{ready ? tally.waiting : "—"}</dd>
              </div>
              <div>
                <dt>Reunited so far</dt>
                <dd>{ready ? tally.reunited : "—"}</dd>
              </div>
              <div>
                <dt>Most recent find</dt>
                <dd className="tally-date">{ready && tally.latest ? formatDate(tally.latest) : "—"}</dd>
              </div>
            </dl>
            <p className="tally-note">Counts cover reports an administrator has approved for listing.</p>
          </aside>
        </div>
      </section>

      <section aria-label="How the register works" className="page-container paths">
        <div className="path path-lost">
          <span aria-hidden="true" className="path-index">I.</span>
          <p className="kicker">If you lost something</p>
          <h2>Search first, then claim.</h2>
          <ol className="path-steps">
            <li><span>01</span>Search the register by item, place or category.</li>
            <li><span>02</span>Open an entry and compare the photo and description with what you lost.</li>
            <li><span>03</span>Send a claim with a detail only the owner would know. The administrator checks it before anyone is contacted.</li>
          </ol>
          <Link className="button button-secondary" href="/found-items">Browse found items <Icon name="arrow-right" /></Link>
        </div>
        <div className="path path-found">
          <span aria-hidden="true" className="path-index">II.</span>
          <p className="kicker kicker-accent">If you found something</p>
          <h2>Log it and keep it safe.</h2>
          <ol className="path-steps">
            <li><span>01</span>Describe the item and where you found it. A photo helps, but keep one identifying detail to yourself.</li>
            <li><span>02</span>An administrator reviews the report before it appears in the register.</li>
            <li><span>03</span>When a claim is approved, you are put in touch with the owner to hand it over.</li>
          </ol>
          <button className="button button-primary" onClick={openReport} type="button">
            <Icon name="plus" /> Report a found item
          </button>
        </div>
      </section>

      <section aria-labelledby="category-heading" className="page-container home-section">
        <div className="section-head">
          <div>
            <h2 id="category-heading">Browse by category</h2>
            <p>Every entry in the register is filed under one of these.</p>
          </div>
        </div>
        <ul className="category-index">
          {itemCategories.map((category) => {
            const count = tally.byCategory.get(category) ?? 0;
            return (
              <li key={category}>
                <Link href={`/found-items?category=${encodeURIComponent(category)}`}>
                  <span>{category}</span>
                  <span className="category-index-count">
                    {ready ? `${count} ${count === 1 ? "entry" : "entries"}` : "—"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="recent-heading" className="page-container home-section">
        <div className="section-head">
          <div>
            <h2 id="recent-heading">Latest entries</h2>
            <p>The three most recently approved reports.</p>
          </div>
          <Link className="text-link" href="/found-items">View the full register</Link>
        </div>
        {loadError ? (
          <div className="notice notice-error" role="alert">
            <h3>The register could not be loaded</h3>
            <p>{loadError}</p>
            <button className="button button-secondary button-small" onClick={retryLoading} type="button">Try again</button>
          </div>
        ) : loading ? (
          <div aria-label="Loading recent items" role="status">
            <span className="sr-only">Loading recent items…</span>
            <SkeletonEntries count={3} variant="tile" />
          </div>
        ) : recentItems.length ? (
          <div className="latest">
            <div className="latest-lead">
              <ItemCard item={recentItems[0]} onSelect={setSelectedItem} />
            </div>
            {recentItems.length > 1 && (
              <div className="latest-side">
                {recentItems.slice(1).map((item) => (
                  <ItemCard item={item} key={item.id} onSelect={setSelectedItem} variant="row" />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="notice">
            <span className="notice-glyph"><Icon name="inbox" /></span>
            <h3>The register is empty</h3>
            <p>No approved found items yet.</p>
            <p>Reports appear here once an administrator has reviewed them.</p>
          </div>
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
