"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useAdminData } from "@/components/admin/admin-data-provider";
import { AdminItemDetails } from "@/components/admin/admin-item-details";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";
import { StatusBadge } from "@/components/admin/status-badge";
import { Icon } from "@/components/ui/icon";
import { formatDate } from "@/lib/format";
import { itemCategories, type AdminFoundItem, type AdminItemStatus } from "@/types/item";

type PendingChange = { item: AdminFoundItem; status: AdminItemStatus };

function FoundItemsManager() {
  const { foundItems, setItemStatus, markItemReturned } = useAdminData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [status, setStatus] = useState("All statuses");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedItem = foundItems.find((item) => item.id === selectedItemId) ?? null;
  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...foundItems]
      .filter((item) => {
        const matchesSearch = !search ||
          `${item.name} ${item.category} ${item.location} ${item.reporter.name}`.toLowerCase().includes(search);
        const matchesCategory = category === "All categories" || item.category === category;
        const matchesStatus = status === "All statuses" || item.reviewStatus === status;
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

  const confirmationTitle = pendingChange?.status === "Rejected"
    ? "Reject this report?"
    : pendingChange?.status === "Returned"
      ? "Mark this item as returned?"
      : "Approve this report?";
  const confirmationVerb = pendingChange?.status === "Rejected"
    ? "reject"
    : pendingChange?.status === "Returned"
      ? "mark as returned"
      : "approve";

  return (
    <>
      <div className="admin-page-intro">
        <div>
          <h2>Found item reports</h2>
          <p>Review submissions, keep contact details private, and update each item’s review status.</p>
        </div>
      </div>
      {notice && <AdminNotice message={notice} onDismiss={() => setNotice("")} />}
      <div className="admin-filterbar">
        <label className="admin-search-control">
          <Icon name="search" />
          <input aria-label="Search found item reports" onChange={(event) => setQuery(event.target.value)} placeholder="Search name, location, or reporter" value={query} />
        </label>
        <label>
          <span className="sr-only">Filter found items by category</span>
          <select className="field-input admin-filter-select" onChange={(event) => setCategory(event.target.value)} value={category}>
            <option>All categories</option>
            {itemCategories.map((itemCategory) => <option key={itemCategory}>{itemCategory}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter found items by review status</span>
          <select className="field-input admin-filter-select" onChange={(event) => setStatus(event.target.value)} value={status}>
            <option>All statuses</option>
            <option>Pending review</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Returned</option>
          </select>
        </label>
      </div>
      <section aria-label="Found item reports" className="admin-panel">
        <div className="admin-panel-header">
          <div><h3>All reports</h3><p>{filteredItems.length} {filteredItems.length === 1 ? "result" : "results"} from the LostNFind API</p></div>
        </div>
        {filteredItems.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-manage-table">
              <thead>
                <tr><th>Found item</th><th>Category</th><th>Found location</th><th>Submitted</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="admin-table-primary">
                        <span className="admin-item-thumb">{item.image && <Image alt="" fill sizes="38px" src={item.image} unoptimized />}</span>
                        <span><strong>{item.name}</strong><small>Reported by {item.reporter.name}</small></span>
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.location}</td>
                    <td>{formatDate(item.submittedAt)}</td>
                    <td><StatusBadge status={item.reviewStatus} /></td>
                    <td>
                      <div className="admin-table-actions">
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
          <div className="admin-empty-state">
            <span className="empty-state-icon"><Icon name="search" /></span>
            <h3>No reports match these filters</h3>
            <p>Try another search term or reset the category and status filters.</p>
            <button className="button button-secondary button-small" onClick={() => { setQuery(""); setCategory("All categories"); setStatus("All statuses"); }} type="button">Clear filters</button>
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
          description={`Are you sure you want to ${confirmationVerb} “${pendingChange.item.name}”?`}
          onCancel={() => setPendingChange(null)}
          onConfirm={confirmChange}
          pending={saving}
          title={confirmationTitle}
        />
      )}
    </>
  );
}

export function AdminFoundItems() {
  return <FoundItemsManager />;
}
