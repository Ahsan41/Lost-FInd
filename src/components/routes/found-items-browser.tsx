"use client";

import { useEffect, useMemo, useState } from "react";
import { itemCategories, type FoundItem } from "@/types/item";
import { ClaimItemModal } from "@/components/forms/claim-item-modal";
import { ItemCard } from "@/components/items/item-card";
import { ItemDetailsModal } from "@/components/items/item-details-modal";
import { Icon } from "@/components/ui/icon";
import { SkeletonEntries } from "@/components/ui/skeleton-entries";
import { getPublicApiErrorMessage, publicApi } from "@/lib/public-api";

type SortOrder = "newest" | "oldest" | "name";

const allItems = "All items";

interface FoundItemsBrowserProps {
  initialCategory: string;
  initialQuery: string;
}

export function FoundItemsBrowser({
  initialCategory,
  initialQuery,
}: FoundItemsBrowserProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(
    itemCategories.some((itemCategory) => itemCategory === initialCategory)
      ? initialCategory
      : allItems,
  );
  const [sort, setSort] = useState<SortOrder>("newest");
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

  const items = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = foundItems.filter((item) => {
      const matchesQuery = !normalizedQuery ||
        `${item.name} ${item.location} ${item.category} ${item.description}`.toLowerCase().includes(normalizedQuery);
      const matchesCategory = category === allItems || item.category === category;
      return matchesQuery && matchesCategory;
    });

    return [...filtered].sort((first, second) => {
      if (sort === "name") return first.name.localeCompare(second.name);
      const dateDelta = new Date(second.foundDate).getTime() - new Date(first.foundDate).getTime();
      return sort === "newest" ? dateDelta : -dateDelta;
    });
  }, [category, foundItems, query, sort]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>([[allItems, foundItems.length]]);
    for (const item of foundItems) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    return counts;
  }, [foundItems]);

  const filtersActive = query.trim() !== "" || category !== allItems;

  function retryLoading() {
    setLoading(true);
    setLoadError("");
    setRetryCount((count) => count + 1);
  }

  function clearFilters() {
    setQuery("");
    setCategory(allItems);
  }

  function finishClaim() {
    setClaiming(false);
    setSelectedItem(null);
  }

  const countSentence = loading
    ? "Loading found items…"
    : `${items.length} ${items.length === 1 ? "item" : "items"} ${category !== allItems ? `in ${category}` : "waiting to be found"}`;

  return (
    <>
      <div className="page-container register">
        <header className="register-head">
          <div>
            <p className="kicker">Found-property register</p>
            <h1 className="register-title">Found items</h1>
          </div>
          <p aria-live="polite" className="register-count">{countSentence}</p>
        </header>

        <div className="register-body">
          <aside aria-label="Search and filter" className="rail">
            <label className="rail-search">
              <Icon name="search" />
              <input
                aria-label="Search by item or location"
                className="field-input"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Item, place or detail"
                type="text"
                value={query}
              />
            </label>

            <div aria-label="Filter by category" className="rail-group" role="group">
              <p className="rail-label">Category</p>
              {[allItems, ...itemCategories].map((itemCategory) => (
                <button
                  aria-pressed={category === itemCategory}
                  className="rail-option"
                  key={itemCategory}
                  onClick={() => setCategory(itemCategory)}
                  type="button"
                >
                  {itemCategory}
                  {!loading && !loadError && (
                    <span aria-hidden="true" className="rail-option-count">{categoryCounts.get(itemCategory) ?? 0}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="rail-select">
              <label className="rail-label" htmlFor="register-sort">Sort</label>
              <select
                aria-label="Sort found items"
                className="field-input"
                id="register-sort"
                onChange={(event) => setSort(event.target.value as SortOrder)}
                value={sort}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </aside>

          <section aria-label="Browse found items" className="register-results">
            {loadError ? (
              <div className="notice notice-error" role="alert">
                <h3>Could not load found items</h3>
                <p>{loadError}</p>
                <button className="button button-secondary button-small" onClick={retryLoading} type="button">Try again</button>
              </div>
            ) : loading ? (
              <div aria-label="Loading found items" role="status">
                <SkeletonEntries count={4} variant="row" />
              </div>
            ) : items.length ? (
              <>
                <ol className="ledger">
                  {items.map((item) => (
                    <li key={item.id}>
                      <ItemCard item={item} onSelect={setSelectedItem} variant="row" />
                    </li>
                  ))}
                </ol>
                <p className="inline-note">
                  <Icon name="info" />
                  Recognise something? Open the entry and choose “This is mine”. You will be asked for a detail
                  only the owner would know, which the administrator uses to check the claim.
                </p>
              </>
            ) : (
              <div className="notice">
                <span className="notice-glyph"><Icon name="search" /></span>
                <h3>No finds just yet</h3>
                <p>
                  {filtersActive
                    ? "Nothing in the register matches this search. Try a broader word, another category, or check back later: new reports are added as they are approved."
                    : "The register is empty right now. Reports appear here once an administrator has approved them."}
                </p>
                {filtersActive && (
                  <button className="button button-secondary button-small" onClick={clearFilters} type="button">Clear search & filters</button>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

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
