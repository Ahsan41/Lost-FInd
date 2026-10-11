"use client";

import { useMemo, useState } from "react";
import { foundItems } from "@/data/found-items";
import { itemCategories, type FoundItem } from "@/types/item";
import { ClaimItemModal } from "@/components/forms/claim-item-modal";
import { ItemCard } from "@/components/items/item-card";
import { ItemDetailsModal } from "@/components/items/item-details-modal";
import { Icon } from "@/components/ui/icon";

type SortOrder = "newest" | "oldest" | "name";

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
      : "All items",
  );
  const [sort, setSort] = useState<SortOrder>("newest");
  const [selectedItem, setSelectedItem] = useState<FoundItem | null>(null);
  const [claiming, setClaiming] = useState(false);

  const items = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = foundItems.filter((item) => {
      const matchesQuery = !normalizedQuery ||
        `${item.name} ${item.location} ${item.category} ${item.description}`.toLowerCase().includes(normalizedQuery);
      const matchesCategory = category === "All items" || item.category === category;
      return matchesQuery && matchesCategory;
    });

    return [...filtered].sort((first, second) => {
      if (sort === "name") return first.name.localeCompare(second.name);
      const dateDelta = new Date(second.foundDate).getTime() - new Date(first.foundDate).getTime();
      return sort === "newest" ? dateDelta : -dateDelta;
    });
  }, [category, query, sort]);

  function finishClaim() {
    setClaiming(false);
    setSelectedItem(null);
  }

  return (
    <>
      <section className="browser-banner">
        <div className="page-container">
          <p className="eyebrow"><span className="eyebrow-dot" />Every find tells a story</p>
          <h1 className="browser-title">Found items</h1>
          <p className="section-description">Little things, big relief. Browse what’s been found around your community.</p>
        </div>
      </section>
      <section aria-label="Browse found items" className="page-container browser-section">
        <div className="browser-controls">
          <label className="browser-search">
            <Icon name="search" />
            <input aria-label="Search by item or location" onChange={(event) => setQuery(event.target.value)} placeholder="Search an item or location" value={query} />
          </label>
          <label>
            <span className="sr-only">Sort found items</span>
            <select className="sort-select" onChange={(event) => setSort(event.target.value as SortOrder)} value={sort}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name: A to Z</option>
            </select>
          </label>
        </div>
        <div aria-label="Filter by category" className="filter-row" role="group">
          {["All items", ...itemCategories].map((itemCategory) => (
            <button
              aria-pressed={category === itemCategory}
              className={`filter-button${category === itemCategory ? " filter-button-active" : ""}`}
              key={itemCategory}
              onClick={() => setCategory(itemCategory)}
              type="button"
            >
              {itemCategory}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="result-count">
          {items.length} {items.length === 1 ? "item" : "items"} {category !== "All items" ? `in ${category}` : "waiting to be found"}
        </p>
        {items.length ? (
          <div className="items-grid">
            {items.map((item) => <ItemCard item={item} key={item.id} onSelect={setSelectedItem} />)}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-state-icon"><Icon name="search" /></span>
            <h3>No finds just yet</h3>
            <p>Try a different search or category. New items are added by kind people in the community.</p>
            <button className="button button-secondary button-small" onClick={() => { setQuery(""); setCategory("All items"); }} type="button">Clear search & filters</button>
          </div>
        )}
        {items.length > 0 && (
          <div className="steps-note browse-tip">
            <Icon name="info" />Want to claim a find? Open its card and share a few private details to help verify it’s yours.
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
