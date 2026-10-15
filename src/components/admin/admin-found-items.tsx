"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useAdminData } from "@/components/admin/admin-data-provider";
import { AdminItemDetails } from "@/components/admin/admin-item-details";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";
import { Icon } from "@/components/ui/icon";
import { StatusTag } from "@/components/ui/status-tag";
import { formatDate } from "@/lib/format";
import { itemCategories, type AdminFoundItem, type AdminItemStatus } from "@/types/item";

type PendingChange = { item: AdminFoundItem; status: AdminItemStatus };

const allCategories = "All categories";
const allStatuses = "All statuses";

export function AdminFoundItems() {
  const { foundItems, setItemStatus, markItemReturned } = useAdminData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(allCategories);
  const [status, setStatus] = useState(allStatuses);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedItem = foundItems.find((item) => item.id === selectedItemId) ?? null;
  const pendingCount = foundItems.filter((item) => item.reviewStatus === "Pending review").length;

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...foundItems]
      .filter((item) => {
        const matchesSearch = !search ||
          `${item.name} ${item.category} ${item.location} ${item.reporter.name}`.toLowerCase().includes(search);
        const matchesCategory = category === allCategories || item.category === category;
        const matchesStatus = status === allStatuses || item.reviewStatus === status;
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((first, second) => second.submittedAt.localeCompare(first.submittedAt));
  }, [category, foundItems, query, status]);

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
    setStatus(allStatuses);
  }

  const confirmationTitle = pendingChange?.status === "Rejected"
    ? "Reject this report?"
    : pendingChange?.status === "Returned"
      ? "Mark this item as returned?"
      : "Approve this report?";
  const confirmationDescription = pendingChange?.status === "Rejected"
    ? `“${pendingChange.item.name}” will not be listed publicly. You can still approve it later.`
    : pendingChange?.status === "Returned"
      ? `Confirm that “${pendingChange.item.name}” has been handed back to its owner. The entry will be marked reunited and any remaining claims closed.`
      : `“${pendingChange?.item.name}” will appear in the public register so its owner can find and claim it.`;

  return (
    <>
      <div className="desk-page-head">
        <div>
          <h2>Found-item reports</h2>
          <p>
            Approve a report to list it in the public register, reject it to keep it off, and mark it returned once
            the hand-over has happened. Reporter contact details never leave this workspace.
          </p>
        </div>
        {pendingCount > 0 && (
          <button
            className="button button-secondary button-small"
            onClick={() => { setStatus("Pending review"); setCategory(allCategories); setQuery(""); }}
            type="button"
          >
            Show {pendingCount} pending
          </button>
        )}
      </div>

      {notice && <AdminNotice message={notice} onDismiss={() => setNotice("")} />}

      <div className="filterbar">
        <label className="filter-search">
          <Icon name="search" />
          <input
            aria-label="Search found item reports"
            className="field-input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, location or reporter"
            type="text"
            value={query}
          />
        </label>
        <label>
          <span className="sr-only">Filter found items by category</span>
          <select className="field-input filter-select" onChange={(event) => setCategory(event.target.value)} value={category}>
            <option>{allCategories}</option>
            {itemCategories.map((itemCategory) => <option key={itemCategory}>{itemCategory}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter found items by review status</span>
          <select className="field-input filter-select" onChange={(event) => setStatus(event.target.value)} value={status}>
            <option>{allStatuses}</option>
            <option>Pending review</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Returned</option>
          </select>
        </label>
      </div>

      <section aria-label="Found item reports" className="panel">
        <div className="panel-head">
          <div>
            <h3>All reports</h3>
            <p>{filteredItems.length} {filteredItems.length === 1 ? "result" : "results"} from the LostNFind API</p>
          </div>
        </div>
        {filteredItems.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Found item</th><th>Category</th><th>Found location</th><th>Submitted</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="table-primary">
                        <span className={`thumb${item.image ? "" : " thumb-empty"}`}>
                          {item.image ? <Image alt="" fill sizes="42px" src={item.image} unoptimized /> : <Icon name="image" />}
                        </span>
                        <span><strong>{item.name}</strong><small>Reported by {item.reporter.name}</small></span>
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.location}</td>
                    <td className="table-date">{formatDate(item.submittedAt)}</td>
                    <td><StatusTag status={item.reviewStatus} /></td>
                    <td>
                      <div className="table-actions">
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="panel-empty">
            <h3>No reports match these filters</h3>
            <p>Try another search term or reset the category and status filters.</p>
            <button className="button button-secondary button-small" onClick={clearFilters} type="button">Clear filters</button>
          </div>
        )}
      </section>

      {selectedItem && (
        <AdminItemDetails
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
