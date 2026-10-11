"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AdminClaimDetails } from "@/components/admin/admin-claim-details";
import { useAdminData } from "@/components/admin/admin-data-provider";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";
import { StatusBadge } from "@/components/admin/status-badge";
import { Icon } from "@/components/ui/icon";
import { formatDate } from "@/lib/format";
import type { ClaimRequest, ClaimStatus } from "@/types/item";

type ClaimFilter = "All" | ClaimStatus;
type PendingAction =
  | { type: "claim"; claim: ClaimRequest; status: ClaimStatus }
  | { type: "return"; claim: ClaimRequest; itemName: string };

const claimFilters: ClaimFilter[] = ["All", "Pending", "Approved", "Rejected"];

export function AdminClaims() {
  const { claims, foundItems, setClaimStatus, markItemReturned } = useAdminData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ClaimFilter>("All");
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [notice, setNotice] = useState("");

  const selectedClaim = claims.find((claim) => claim.id === selectedClaimId) ?? null;
  const selectedItem = selectedClaim
    ? foundItems.find((item) => item.id === selectedClaim.itemId) ?? null
    : null;

  const filteredClaims = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...claims]
      .filter((claim) => {
        const item = foundItems.find((candidate) => candidate.id === claim.itemId);
        const matchesSearch = !search ||
          `${claim.claimant.name} ${claim.claimant.email} ${item?.name ?? ""} ${item?.location ?? ""}`.toLowerCase().includes(search);
        return matchesSearch && (filter === "All" || claim.status === filter);
      })
      .sort((first, second) => second.submittedAt.localeCompare(first.submittedAt));
  }, [claims, filter, foundItems, query]);

  function requestClaimStatus(claim: ClaimRequest, status: ClaimStatus) {
    setSelectedClaimId(null);
    setPendingAction({ type: "claim", claim, status });
  }

  function requestReturn(claim: ClaimRequest) {
    const item = foundItems.find((candidate) => candidate.id === claim.itemId);
    if (!item) return;
    setSelectedClaimId(null);
    setPendingAction({ type: "return", claim, itemName: item.name });
  }

  function confirmAction() {
    if (!pendingAction) return;
    if (pendingAction.type === "claim") {
      setClaimStatus(pendingAction.claim.id, pendingAction.status);
      setNotice(`Claim for ${pendingAction.claim.claimant.name} marked ${pendingAction.status.toLowerCase()}. This prototype change is temporary and was not saved.`);
    } else {
      markItemReturned(pendingAction.claim.itemId);
      setNotice(`${pendingAction.itemName} marked returned. The change is temporary and was not saved.`);
    }
    setPendingAction(null);
  }

  const confirmationTitle = pendingAction?.type === "return"
    ? "Mark the item as returned?"
    : pendingAction?.status === "Rejected"
      ? "Reject this claim?"
      : "Approve this claim?";
  const confirmationDescription = pendingAction?.type === "return"
    ? `Confirm that “${pendingAction.itemName}” has been returned to its owner.`
    : `Are you sure you want to ${pendingAction?.status === "Rejected" ? "reject" : "approve"} the claim from ${pendingAction?.claim.claimant.name}? This only changes the current prototype session.`;
  const confirmationLabel = pendingAction?.type === "return"
    ? "Mark item returned"
    : pendingAction?.status === "Rejected"
      ? "Reject claim"
      : "Approve claim";

  return (
    <>
      <div className="admin-page-intro">
        <div>
          <h2>Claim requests</h2>
          <p>Review private ownership details and keep each request linked to its found item.</p>
        </div>
      </div>
      {notice && <AdminNotice message={notice} onDismiss={() => setNotice("")} />}
      <div className="admin-filterbar admin-claim-filterbar">
        <label className="admin-search-control">
          <Icon name="search" />
          <input aria-label="Search claim requests" onChange={(event) => setQuery(event.target.value)} placeholder="Search claimant or found item" value={query} />
        </label>
        <div aria-label="Filter claim requests by status" className="admin-filter-tabs" role="group">
          {claimFilters.map((claimFilter) => (
            <button
              aria-pressed={filter === claimFilter}
              className={`admin-filter-tab${filter === claimFilter ? " admin-filter-tab-active" : ""}`}
              key={claimFilter}
              onClick={() => setFilter(claimFilter)}
              type="button"
            >
              {claimFilter}
              {claimFilter === "Pending" && <span>{claims.filter((claim) => claim.status === "Pending").length}</span>}
            </button>
          ))}
        </div>
      </div>
      <section aria-label="Claim requests" className="admin-panel">
        <div className="admin-panel-header">
          <div><h3>All claims</h3><p>{filteredClaims.length} {filteredClaims.length === 1 ? "request" : "requests"} · local mock data</p></div>
        </div>
        {filteredClaims.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-claims-table">
              <thead><tr><th>Claimant</th><th>Found item</th><th>Submitted</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {filteredClaims.map((claim) => {
                  const item = foundItems.find((candidate) => candidate.id === claim.itemId);
                  return (
                    <tr key={claim.id}>
                      <td>
                        <div className="admin-table-primary">
                          <span className="admin-avatar admin-claim-avatar" aria-hidden="true">{claim.claimant.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                          <span><strong>{claim.claimant.name}</strong><small>{claim.claimant.email}</small></span>
                        </div>
                      </td>
                      <td>
                        {item ? (
                          <div className="admin-table-primary">
                            <span className="admin-item-thumb"><Image alt="" fill sizes="38px" src={item.image} unoptimized /></span>
                            <span><strong>{item.name}</strong><small>{item.category} · {item.location}</small></span>
                          </div>
                        ) : <span>Item no longer listed</span>}
                      </td>
                      <td>{formatDate(claim.submittedAt)}</td>
                      <td><StatusBadge status={claim.status} /></td>
                      <td>
                        <button
                          className="button button-secondary button-small"
                          disabled={!item}
                          onClick={() => setSelectedClaimId(claim.id)}
                          type="button"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <span className="empty-state-icon"><Icon name="search" /></span>
            <h3>No claim requests found</h3>
            <p>Try another search or select a different status.</p>
            <button className="button button-secondary button-small" onClick={() => { setQuery(""); setFilter("All"); }} type="button">Clear search and filter</button>
          </div>
        )}
      </section>
      {selectedClaim && selectedItem && (
        <AdminClaimDetails
          claim={selectedClaim}
          item={selectedItem}
          onClose={() => setSelectedClaimId(null)}
          onRequestReturn={() => requestReturn(selectedClaim)}
          onRequestStatus={(nextStatus) => requestClaimStatus(selectedClaim, nextStatus)}
        />
      )}
      {pendingAction && (
        <ConfirmationDialog
          danger={pendingAction.type === "claim" && pendingAction.status === "Rejected"}
          confirmLabel={confirmationLabel}
          description={confirmationDescription}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmAction}
          title={confirmationTitle}
        />
      )}
    </>
  );
}
