"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useAdminData } from "@/components/admin/admin-data-provider";
import { AdminItemDetails } from "@/components/admin/admin-item-details";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";
import { Icon } from "@/components/ui/icon";
import { StatusTag } from "@/components/ui/status-tag";
import { formatDate, referenceNumber } from "@/lib/format";
import { itemCategories, type AdminFoundItem, type AdminItemStatus } from "@/types/item";

type PendingChange = { item: AdminFoundItem; status: AdminItemStatus };
type StatusFilter = "All" | AdminItemStatus;

const allCategories = "All categories";

/** The order the register is read in: what needs a decision first, then what is live, then what is closed. */
const statusOrder: AdminItemStatus[] = ["Pending review", "Approved", "Rejected", "Returned"];

const statusBlurb: Record<AdminItemStatus, string> = {
  "Pending review": "Not listed yet. Approve to publish it, reject to keep it off.",
  Approved: "Listed in the public register and open to claims.",
  Rejected: "Kept off the register. Can still be approved later.",
  Returned: "Handed back to the owner. Closed.",
};

export function AdminFoundItems() {
  const { foundItems, claims, setItemStatus, markItemReturned } = useAdminData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(allCategories);
  const [status, setStatus] = useState<StatusFilter>("All");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedItem = foundItems.find((item) => item.id === selectedItemId) ?? null;
  const selectedItemClaims = selectedItem ? claims.filter((claim) => claim.itemId === selectedItem.id) : [];

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...foundItems]
      .filter((item) => {
        const matchesSearch = !search ||
          `${item.name} ${item.category} ${item.location} ${item.reporter.name}`.toLowerCase().includes(search);
        const matchesCategory = category === allCategories || item.category === category;
        const matchesStatus = status === "All" || item.reviewStatus === status;
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((first, second) => second.submittedAt.localeCompare(first.submittedAt));
  }, [category, foundItems, query, status]);

  const statusCounts = useMemo(() => {
    const counts = new Map<StatusFilter, number>([["All", foundItems.length]]);
    for (const item of foundItems) counts.set(item.reviewStatus, (counts.get(item.reviewStatus) ?? 0) + 1);
    return counts;
  }, [foundItems]);

  const sections = statusOrder
    .filter((reviewStatus) => status === "All" || reviewStatus === status)
    .map((reviewStatus) => ({
      status: reviewStatus,
      items: filteredItems.filter((item) => item.reviewStatus === reviewStatus),
    }))
    .filter((section) => section.items.length > 0);

  function claimsOn(item: AdminFoundItem) {
    return claims.filter((claim) => claim.itemId === item.id);
  }

  function requestStatus(item: AdminFoundItem, nextStatus: AdminItemStatus) {
    setSelectedItemId(null);
    setPendingChange({ item, status: nextStatus });
  }

  async function confirmChange() {
    if (!pendingChange) return;
    const { item, status: nextStatus } = pendingChange;
    setSaving(true);
    try {
      const saved = nextStatus === "Returned"
        ? await markItemReturned(item.id)
        : await setItemStatus(item.id, nextStatus);
      if (!saved) return;
      setNotice(`${item.name} marked ${nextStatus.toLowerCase()}.`);
      setPendingChange(null);
    } finally {
      setSaving(false);
    }
  }

  function clearFilters() {
    setQuery("");
    setCategory(allCategories);
    setStatus("All");
  }

  let confirmationTitle = "";
  let confirmationDescription = "";
  if (pendingChange) {
    const { item, status: nextStatus } = pendingChange;
    const pending = claimsOn(item).filter((claim) => claim.status === "Pending").length;
    const approved = claimsOn(item).find((claim) => claim.status === "Approved");
    if (nextStatus === "Rejected") {
      confirmationTitle = "Reject this report?";
      confirmationDescription = `“${item.name}” will not be listed publicly. You can still approve it later.`;
    } else if (nextStatus === "Returned") {
      confirmationTitle = "Mark this item as returned?";
      confirmationDescription = `Confirm that “${item.name}” has been handed back${approved ? ` to ${approved.claimant.name}` : ""}. The entry is marked reunited${pending > 0 ? ` and ${pending === 1 ? "the remaining pending claim is" : `the ${pending} remaining pending claims are`} rejected` : ""}.`;
    } else {
      confirmationTitle = "Approve this report?";
      confirmationDescription = `“${item.name}” will appear in the public register so its owner can find and claim it.`;
    }
  }

  return (
    <>
      <div className="desk-page-head">
        <div>
          <h2>Found-item reports</h2>
          <p>
            Read top to bottom: reports waiting for a decision first, then what is listed, then what is closed.
            Reporter contact details never leave this workspace.
          </p>
        </div>
      </div>

      {notice && <AdminNotice message={notice} onDismiss={() => setNotice("")} />}

      <div className="desk-split">
        <aside aria-label="Search and filter reports" className="rail">
          <label className="rail-search">
            <Icon name="search" />
            <input
              aria-label="Search found item reports"
              className="field-input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, location or reporter"
              type="text"
              value={query}
            />
          </label>

          <div aria-label="Filter found items by review status" className="rail-group" role="group">
            <p className="rail-label">Status</p>
            {(["All", ...statusOrder] as StatusFilter[]).map((option) => (
              <button
                aria-pressed={status === option}
                className="rail-option"
                key={option}
                onClick={() => setStatus(option)}
                type="button"
              >
                {option === "All" ? "All reports" : option}
                <span aria-hidden="true" className="rail-option-count">{statusCounts.get(option) ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="rail-select">
            <label className="rail-label" htmlFor="reports-category">Category</label>
            <select
              aria-label="Filter found items by category"
              className="field-input"
              id="reports-category"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <option>{allCategories}</option>
              {itemCategories.map((itemCategory) => <option key={itemCategory}>{itemCategory}</option>)}
            </select>
          </div>
        </aside>

        <section aria-label="Found item reports" className="desk-results">
          <p className="desk-count">{filteredItems.length} {filteredItems.length === 1 ? "result" : "results"} from the LostNFind API</p>

          {sections.length ? (
            sections.map(({ status: sectionStatus, items }) => (
              <section aria-labelledby={`section-${sectionStatus.replace(/\s+/g, "-")}`} className="status-section" key={sectionStatus}>
                <div className="status-section-head">
                  <h3 id={`section-${sectionStatus.replace(/\s+/g, "-")}`}>{sectionStatus}</h3>
                  <span className="status-section-count">{items.length}</span>
                  <p>{statusBlurb[sectionStatus]}</p>
                </div>
                <ol className="slips">
                  {items.map((item) => {
                    const itemClaims = claimsOn(item);
                    const pendingClaims = itemClaims.filter((claim) => claim.status === "Pending").length;
                    return (
                      <li className="slip" key={item.id}>
                        <span className={`thumb${item.image ? "" : " thumb-empty"}`}>
                          {item.image ? <Image alt="" fill sizes="48px" src={item.image} unoptimized /> : <Icon name="image" />}
                        </span>
                        <span className="slip-copy">
                          <strong>{item.name}</strong>
                          <span className="slip-meta">{referenceNumber(item.id)} · {item.category} · {item.location}</span>
                          <small>Reported by {item.reporter.name}</small>
                          {itemClaims.length > 0 && (
                            <span className="slip-claims">
                              {itemClaims.length} {itemClaims.length === 1 ? "claim" : "claims"}
                              {pendingClaims > 0 && <>, {pendingClaims} pending</>}
                            </span>
                          )}
                        </span>
                        <span className="queue-date">{formatDate(item.submittedAt)}</span>
                        <StatusTag status={item.reviewStatus} />
                        <span className="queue-actions">
                          <button aria-label={`View ${item.name} details`} className="button button-secondary button-small" onClick={() => setSelectedItemId(item.id)} type="button">View</button>
                          {item.reviewStatus === "Pending review" && (
                            <>
                              <button className="button button-primary button-small" onClick={() => requestStatus(item, "Approved")} type="button">Approve</button>
                              <button className="button button-danger button-small" onClick={() => requestStatus(item, "Rejected")} type="button">Reject</button>
                            </>
                          )}
                          {item.reviewStatus === "Rejected" && (
                            <button className="button button-primary button-small" onClick={() => requestStatus(item, "Approved")} type="button">Approve</button>
                          )}
                          {item.reviewStatus === "Approved" && (
                            <button className="button button-secondary button-small" onClick={() => requestStatus(item, "Returned")} type="button">Mark returned</button>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))
          ) : (
            <div className="notice">
              <h3>No reports match these filters</h3>
              <p>Try another search term or reset the category and status filters.</p>
              <button className="button button-secondary button-small" onClick={clearFilters} type="button">Clear filters</button>
            </div>
          )}
        </section>
      </div>

      {selectedItem && (
        <AdminItemDetails
          claims={selectedItemClaims}
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
          onRequestStatus={(nextStatus) => requestStatus(selectedItem, nextStatus)}
        />
      )}
      {pendingChange && (
        <ConfirmationDialog
          danger={pendingChange.status === "Rejected"}
          confirmLabel={`${pendingChange.status === "Rejected" ? "Reject" : pendingChange.status === "Returned" ? "Mark returned" : "Approve"} report`}
          description={confirmationDescription}
          onCancel={() => setPendingChange(null)}
          onConfirm={confirmChange}
          pending={saving}
          title={confirmationTitle}
        />
      )}
    </>
  );
}
