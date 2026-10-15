"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AdminClaimDetails } from "@/components/admin/admin-claim-details";
import { useAdminData } from "@/components/admin/admin-data-provider";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";
import { Icon } from "@/components/ui/icon";
import { StatusTag } from "@/components/ui/status-tag";
import { formatDate } from "@/lib/format";
import type { ClaimRequest, ClaimStatus } from "@/types/item";

type ClaimFilter = "All" | ClaimStatus;
type PendingAction =
  | { type: "claim"; claim: ClaimRequest; status: ClaimStatus }
  | { type: "return"; claim: ClaimRequest; itemName: string };

const claimFilters: ClaimFilter[] = ["All", "Pending", "Approved", "Rejected"];

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2);
}

export function AdminClaims() {
  const { claims, foundItems, setClaimStatus, markItemReturned } = useAdminData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ClaimFilter>("All");
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedClaim = claims.find((claim) => claim.id === selectedClaimId) ?? null;
  const selectedItem = selectedClaim
    ? foundItems.find((item) => item.id === selectedClaim.itemId) ?? null
    : null;
  const pendingCount = claims.filter((claim) => claim.status === "Pending").length;

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

  async function confirmAction() {
    if (!pendingAction) return;
    setSaving(true);
    try {
      const saved = pendingAction.type === "claim"
        ? await setClaimStatus(pendingAction.claim.id, pendingAction.status)
        : await markItemReturned(pendingAction.claim.itemId);
      if (!saved) return;
      setNotice(pendingAction.type === "claim"
        ? `Claim for ${pendingAction.claim.claimant.name} marked ${pendingAction.status.toLowerCase()}.`
        : `${pendingAction.itemName} marked returned.`);
      setPendingAction(null);
    } finally {
      setSaving(false);
    }
  }

  const confirmationTitle = pendingAction?.type === "return"
    ? "Mark the item as returned?"
    : pendingAction?.status === "Rejected"
      ? "Reject this claim?"
      : "Approve this claim?";
  const confirmationDescription = pendingAction?.type === "return"
    ? `Confirm that “${pendingAction.itemName}” has been returned to its owner.`
    : pendingAction?.status === "Rejected"
      ? `${pendingAction?.claim.claimant.name} will be emailed that the claim was not accepted. The item stays listed.`
      : `${pendingAction?.claim.claimant.name} and the finder will each receive the other’s contact details. Any other pending claims on this item will be rejected.`;
  const confirmationLabel = pendingAction?.type === "return"
    ? "Mark item returned"
    : pendingAction?.status === "Rejected"
      ? "Reject claim"
      : "Approve claim";

  return (
    <>
      <div className="desk-page-head">
        <div>
          <h2>Claim requests</h2>
          <p>
            Compare what each claimant says with the finder’s private details before approving. Approving a claim
            shares contact details both ways and closes any other pending claims on the same item.
          </p>
        </div>
      </div>

      {notice && <AdminNotice message={notice} onDismiss={() => setNotice("")} />}

      <div className="filterbar">
        <label className="filter-search">
          <Icon name="search" />
          <input
            aria-label="Search claim requests"
            className="field-input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search claimant or found item"
            type="text"
            value={query}
          />
        </label>
        <div aria-label="Filter claim requests by status" className="filter-tabs" role="group">
          {claimFilters.map((claimFilter) => (
            <button
              aria-pressed={filter === claimFilter}
              className="filter-tab"
              key={claimFilter}
              onClick={() => setFilter(claimFilter)}
              type="button"
            >
              {claimFilter}
              {claimFilter === "Pending" && <span>{pendingCount}</span>}
            </button>
          ))}
        </div>
      </div>

      <section aria-label="Claim requests" className="panel">
        <div className="panel-head">
          <div>
            <h3>All claims</h3>
            <p>{filteredClaims.length} {filteredClaims.length === 1 ? "request" : "requests"} from the LostNFind API</p>
          </div>
        </div>
        {filteredClaims.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Claimant</th><th>Found item</th><th>Submitted</th><th>Status</th><th><span className="sr-only">Action</span></th></tr></thead>
              <tbody>
                {filteredClaims.map((claim) => {
                  const item = foundItems.find((candidate) => candidate.id === claim.itemId);
                  return (
                    <tr key={claim.id}>
                      <td>
                        <div className="table-primary">
                          <span aria-hidden="true" className="avatar">{initials(claim.claimant.name)}</span>
                          <span><strong>{claim.claimant.name}</strong><small>{claim.claimant.email}</small></span>
                        </div>
                      </td>
                      <td>
                        {item ? (
                          <div className="table-primary">
                            <span className={`thumb${item.image ? "" : " thumb-empty"}`}>
                              {item.image ? <Image alt="" fill sizes="42px" src={item.image} unoptimized /> : <Icon name="image" />}
                            </span>
                            <span><strong>{item.name}</strong><small>{item.category} · {item.location}</small></span>
                          </div>
                        ) : <span className="table-muted">Item no longer listed</span>}
                      </td>
                      <td className="table-date" data-label="Submitted">{formatDate(claim.submittedAt)}</td>
                      <td className="table-cell-status"><StatusTag status={claim.status} /></td>
                      <td className="table-cell-actions">
                        <div className="table-actions">
                          <button
                            className={`button button-small ${claim.status === "Pending" ? "button-primary" : "button-secondary"}`}
                            disabled={!item}
                            onClick={() => setSelectedClaimId(claim.id)}
                            type="button"
                          >
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="panel-empty">
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
          pending={saving}
          title={confirmationTitle}
        />
      )}
    </>
  );
}
