"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AdminClaimDetails } from "@/components/admin/admin-claim-details";
import { useAdminData } from "@/components/admin/admin-data-provider";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";
import { Icon } from "@/components/ui/icon";
import { StatusTag } from "@/components/ui/status-tag";
import { formatDate, referenceNumber } from "@/lib/format";
import type { AdminFoundItem, ClaimRequest, ClaimStatus } from "@/types/item";

type ClaimFilter = "All" | ClaimStatus;
type PendingAction =
  | { type: "claim"; claim: ClaimRequest; status: ClaimStatus }
  | { type: "return"; claim: ClaimRequest; itemName: string };

interface ClaimGroup {
  key: string;
  item: AdminFoundItem | null;
  claims: ClaimRequest[];
}

const claimFilters: ClaimFilter[] = ["All", "Pending", "Approved", "Rejected"];

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2);
}

/**
 * Claims are listed as comparison slips, grouped under the item they are
 * about: the finder's description on one side, what the claimant says on the
 * other, so a decision can be triaged from the list and confirmed in the sheet.
 */
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

  const groups = useMemo<ClaimGroup[]>(() => {
    const byItem = new Map<string, ClaimGroup>();
    for (const claim of filteredClaims) {
      const group = byItem.get(claim.itemId);
      if (group) group.claims.push(claim);
      else {
        byItem.set(claim.itemId, {
          key: claim.itemId,
          item: foundItems.find((candidate) => candidate.id === claim.itemId) ?? null,
          claims: [claim],
        });
      }
    }
    return [...byItem.values()];
  }, [filteredClaims, foundItems]);

  function pendingSiblings(claim: ClaimRequest) {
    return claims.filter((other) =>
      other.itemId === claim.itemId && other.id !== claim.id && other.status === "Pending").length;
  }

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

  let confirmationTitle = "";
  let confirmationDescription = "";
  let confirmationLabel = "";
  if (pendingAction?.type === "return") {
    confirmationTitle = "Mark the item as returned?";
    confirmationDescription = `Confirm that “${pendingAction.itemName}” has been handed back to ${pendingAction.claim.claimant.name}. The entry is closed and any other pending claims on it are rejected.`;
    confirmationLabel = "Mark item returned";
  } else if (pendingAction?.type === "claim") {
    const who = pendingAction.claim.claimant.name;
    const siblings = pendingSiblings(pendingAction.claim);
    if (pendingAction.status === "Rejected") {
      confirmationTitle = "Reject this claim?";
      confirmationDescription = `${who} will be emailed that the claim was not accepted. The item stays listed and open to other claims.`;
      confirmationLabel = "Reject claim";
    } else {
      confirmationTitle = "Approve this claim?";
      confirmationDescription = `${who} and the finder will each be emailed the other’s contact details to arrange the hand-over.${siblings > 0 ? ` The ${siblings === 1 ? "other pending claim" : `other ${siblings} pending claims`} on this item will be rejected.` : ""}`;
      confirmationLabel = "Approve claim";
    }
  }

  return (
    <>
      <div className="desk-page-head">
        <div>
          <h2>Claim requests</h2>
          <p>
            Each slip puts what the finder wrote next to what the claimant says. Claims on the same item sit together,
            because approving one closes the others.
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

      <section aria-label="Claim requests" className="desk-results">
        <p className="desk-count">
          {filteredClaims.length} {filteredClaims.length === 1 ? "request" : "requests"} from the LostNFind API
          {groups.length > 1 && <> · {groups.length} items</>}
        </p>

        {groups.length ? (
          <ol className="claim-groups">
            {groups.map(({ key, item, claims: groupClaims }) => (
              <li className="claim-group" key={key}>
                <div className="claim-group-head">
                  <span className={`thumb${item?.image ? "" : " thumb-empty"}`}>
                    {item?.image ? <Image alt="" fill sizes="42px" src={item.image} unoptimized /> : <Icon name="image" />}
                  </span>
                  <span className="claim-group-copy">
                    {item ? (
                      <>
                        <strong>{item.name}</strong>
                        <small>{referenceNumber(item.id)} · {item.category} · {item.location}</small>
                      </>
                    ) : (
                      <>
                        <strong>Item no longer listed</strong>
                        <small>The found-item record for this claim is gone.</small>
                      </>
                    )}
                  </span>
                  {item && <StatusTag status={item.reviewStatus} />}
                  <span className="claim-group-count">
                    {groupClaims.length} {groupClaims.length === 1 ? "claim" : "claims"}
                  </span>
                </div>

                <ul className="claim-slips">
                  {groupClaims.map((claim) => (
                    <li className="claim-slip" key={claim.id}>
                      <div className="claim-slip-head">
                        <span aria-hidden="true" className="avatar">{initials(claim.claimant.name)}</span>
                        <span className="claim-slip-who">
                          <strong>{claim.claimant.name}</strong>
                          <small>{claim.claimant.email}</small>
                        </span>
                        <span className="queue-date">{formatDate(claim.submittedAt)}</span>
                        <StatusTag status={claim.status} />
                        <button
                          className={`button button-small ${claim.status === "Pending" ? "button-primary" : "button-secondary"}`}
                          disabled={!item}
                          onClick={() => setSelectedClaimId(claim.id)}
                          type="button"
                        >
                          Review
                        </button>
                      </div>
                      <div className="compare-mini">
                        <div>
                          <span className="compare-label">Finder wrote</span>
                          <p>{item?.description ?? "—"}</p>
                        </div>
                        <div>
                          <span className="compare-label">Claimant says they lost</span>
                          <p>{claim.lostItemDescription}</p>
                          <span className="compare-label">Proof offered</span>
                          <p className="compare-proof">
                            {claim.ownershipProof}
                            {claim.supportingImage && <span className="compare-attachment"><Icon name="image" />with image</span>}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        ) : (
          <div className="notice">
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
          pendingSiblings={pendingSiblings(selectedClaim)}
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
