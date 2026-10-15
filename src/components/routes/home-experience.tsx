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
import { formatDate, referenceNumber } from "@/lib/format";
import { getPublicApiErrorMessage, publicApi } from "@/lib/public-api";

const maxInlineMatches = 5;
const maxLocations = 8;

function matchesQuery(item: FoundItem, query: string): boolean {
  return `${item.name} ${item.location} ${item.category} ${item.description}`.toLowerCase().includes(query);
}

export function HomeExperience() {
  const openReport = useReportDialog();
  const [selectedItem, setSelectedItem] = useState<FoundItem | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [draft, setDraft] = useState("");

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

  const ready = !loading && !loadError;
  const recentItems = foundItems.slice(0, 3);
  const reunited = useMemo(
    () => foundItems.filter((item) => item.status === "Reunited").slice(0, 6),
    [foundItems],
  );

  const register = useMemo(() => {
    const waiting = foundItems.filter((item) => item.status === "Waiting for owner").length;
    const latest = foundItems.reduce<string | null>(
      (newest, item) => (newest === null || item.foundDate > newest ? item.foundDate : newest),
      null,
    );
    const byCategory = new Map<string, number>();
    for (const item of foundItems) byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + 1);

    // Locations are free text, so group case-insensitively and keep the first spelling seen.
    const byLocation = new Map<string, { label: string; count: number }>();
    for (const item of foundItems) {
      const label = item.location.trim();
      const key = label.toLowerCase();
      if (!key) continue;
      const entry = byLocation.get(key);
      if (entry) entry.count += 1;
      else byLocation.set(key, { label, count: 1 });
    }
    const locations = [...byLocation.values()]
      .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label))
      .slice(0, maxLocations);

    return { waiting, latest, byCategory, locations };
  }, [foundItems]);

  const query = draft.trim().toLowerCase();
  const inlineMatches = useMemo(
    () => (query ? foundItems.filter((item) => matchesQuery(item, query)) : []),
    [foundItems, query],
  );

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
        <div className="page-container desk-inner">
          <h1 className="desk-title">Lost something? Search what has already been found.</h1>
          <p className="desk-status">
            {ready && foundItems.length > 0 && (
              <>
                <strong>{register.waiting}</strong> {register.waiting === 1 ? "item is" : "items are"} waiting for an owner
                {register.latest && <> · latest find logged {formatDate(register.latest)}</>}
              </>
            )}
            {ready && foundItems.length === 0 && "The register is open. Nothing has been logged yet."}
            {loading && "Opening the register…"}
          </p>

          <form action="/found-items" className="desk-search" role="search">
            <div className="desk-search-input">
              <Icon name="search" />
              <input
                aria-label="Search found items by name or location"
                autoComplete="off"
                className="field-input"
                name="q"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="What did you lose? Try “black wallet”, “keys” or a place"
                type="text"
                value={draft}
              />
            </div>
            <button className="button button-primary" type="submit">Search</button>
          </form>

          {query && ready && (
            <div className="desk-matches">
              {inlineMatches.length ? (
                <>
                  <p className="desk-matches-label">
                    {inlineMatches.length} {inlineMatches.length === 1 ? "entry matches" : "entries match"} “{draft.trim()}”
                  </p>
                  <ol className="desk-matches-list">
                    {inlineMatches.slice(0, maxInlineMatches).map((item) => (
                      <li key={item.id}>
                        <button className="desk-match" onClick={() => setSelectedItem(item)} type="button">
                          <span className="desk-match-ref">{referenceNumber(item.id)}</span>
                          <span className="desk-match-name">{item.name}</span>
                          <span className="desk-match-where">{item.location}</span>
                          <span className="desk-match-date">{formatDate(item.foundDate)}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                  {inlineMatches.length > maxInlineMatches && (
                    <Link className="text-link" href={`/found-items?q=${encodeURIComponent(draft.trim())}`}>
                      See all {inlineMatches.length} matches in the register
                    </Link>
                  )}
                </>
              ) : (
                <p className="desk-matches-label">
                  Nothing in the register matches “{draft.trim()}” yet. New reports are added as they are approved.
                </p>
              )}
            </div>
          )}

          <p className="desk-browse">
            <span>Or browse by category</span>
            {itemCategories.map((category) => {
              const count = register.byCategory.get(category) ?? 0;
              return (
                <Link href={`/found-items?category=${encodeURIComponent(category)}`} key={category}>
                  {category}
                  {ready && <span aria-hidden="true" className="desk-browse-count">{count}</span>}
                </Link>
              );
            })}
          </p>
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

      {ready && register.locations.length > 0 && (
        <section aria-labelledby="places-heading" className="page-container home-section places">
          <div className="places-aside">
            <h2 id="places-heading">Where things turn up</h2>
            <p>Places named in the register, most entries first. Open one to see everything found there.</p>
          </div>
          <ul className="category-index places-index">
            {register.locations.map(({ label, count }) => (
              <li key={label.toLowerCase()}>
                <Link href={`/found-items?q=${encodeURIComponent(label)}`}>
                  <span>{label}</span>
                  <span className="category-index-count">{count} {count === 1 ? "entry" : "entries"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {ready && reunited.length > 0 && (
        <section aria-labelledby="reunited-heading" className="page-container home-section">
          <div className="closed-head">
            <h2 id="reunited-heading">Recently reunited</h2>
            <span className="closed-count">{reunited.length} closed {reunited.length === 1 ? "entry" : "entries"}</span>
          </div>
          <ol className="closed-log">
            {reunited.map((item) => (
              <li key={item.id}>
                <button aria-label={`Open closed entry ${item.name}`} className="closed-row" onClick={() => setSelectedItem(item)} type="button">
                  <span aria-hidden="true" className="closed-mark"><Icon name="check" /></span>
                  <span className="closed-name">{item.name}</span>
                  <span className="closed-meta">{item.category} · found {formatDate(item.foundDate)} · {item.location}</span>
                  <span className="closed-ref">{referenceNumber(item.id)}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="closed-note">Entries close when the administrator records the hand-over. The finder and owner are never named here.</p>
        </section>
      )}

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
