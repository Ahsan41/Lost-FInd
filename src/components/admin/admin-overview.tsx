"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAdminData } from "@/components/admin/admin-data-provider";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";
import { Icon } from "@/components/ui/icon";
import { formatDate, referenceNumber } from "@/lib/format";
import type { AdminFoundItem, AdminItemStatus } from "@/types/item";

type PendingChange = { item: AdminFoundItem; status: Extract<AdminItemStatus, "Approved" | "Rejected"> };

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2);
}

/**
 * The overview is a work queue, not a dashboard: what is waiting for a
 * decision right now, with the decision one click away. Totals sit in a
 * single line underneath the heading.
 */
export function AdminOverview() {
  const { overview, foundItems, claims, setItemStatus } = useAdminData();
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const pendingReports = useMemo(
    () => foundItems
      .filter((item) => item.reviewStatus === "Pending review")
      .sort((first, second) => second.submittedAt.localeCompare(first.submittedAt)),
    [foundItems],
  );
  const pendingClaims = useMemo(
    () => claims
      .filter((claim) => claim.status === "Pending")
      .sort((first, second) => second.submittedAt.localeCompare(first.submittedAt))
      .map((claim) => ({ claim, item: foundItems.find((candidate) => candidate.id === claim.itemId) ?? null })),
    [claims, foundItems],
  );

  const waiting = pendingReports.length + pendingClaims.length;

  async function confirmChange() {
    if (!pendingChange) return;
    setSaving(true);
    try {
      const saved = await setItemStatus(pendingChange.item.id, pendingChange.status);
      if (!saved) return;
      setNotice(`${pendingChange.item.name} marked ${pendingChange.status.toLowerCase()}.`);
      setPendingChange(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="overview-intro">
        <div>
          <p className="kicker">Review desk</p>
          <h2>A little closer to found.</h2>
          <p>
            {waiting === 0
              ? "Nothing is waiting on you right now. New reports and claims will show up here first."
              : `${waiting} ${waiting === 1 ? "decision is" : "decisions are"} waiting: ${pendingReports.length} ${pendingReports.length === 1 ? "report" : "reports"} to review and ${pendingClaims.length} ${pendingClaims.length === 1 ? "claim" : "claims"} to decide.`}
          </p>
        </div>
      </section>

      <section aria-label="Dashboard summary" className="tally-line">
        <dl>
          <div><dt>Total Found Items</dt><dd>{overview.totalItems}</dd></div>
          <div><dt>Pending Claims</dt><dd>{overview.pendingClaims}</dd></div>
          <div><dt>Approved Claims</dt><dd>{overview.approvedClaims}</dd></div>
          <div><dt>Items Returned</dt><dd>{overview.itemsReturned}</dd></div>
        </dl>
      </section>

      {notice && <AdminNotice message={notice} onDismiss={() => setNotice("")} />}

      <section aria-labelledby="queue-reports-title" className="queue">
        <div className="queue-head">
          <h3 id="queue-reports-title">Reports awaiting review</h3>
          <span className="queue-count">{pendingReports.length}</span>
          <Link className="text-link" href="/admin/found-items">All reports</Link>
        </div>
        {pendingReports.length ? (
          <ol className="queue-list">
            {pendingReports.map((item) => (
              <li className="queue-row" key={item.id}>
                <span className={`thumb${item.image ? "" : " thumb-empty"}`}>
                  {item.image ? <Image alt="" fill sizes="42px" src={item.image} unoptimized /> : <Icon name="image" />}
                </span>
                <span className="queue-copy">
                  <strong>{item.name}</strong>
                  <small>{referenceNumber(item.id)} · {item.category} · {item.location} · reported by {item.reporter.name}</small>
                </span>
                <span className="queue-date">{formatDate(item.submittedAt)}</span>
                <span className="queue-actions">
                  <button className="button button-primary button-small" onClick={() => setPendingChange({ item, status: "Approved" })} type="button">Approve</button>
                  <button className="button button-danger button-small" onClick={() => setPendingChange({ item, status: "Rejected" })} type="button">Reject</button>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="queue-empty">No reports waiting. New submissions appear here before anything else.</p>
        )}
      </section>

      <section aria-labelledby="queue-claims-title" className="queue">
        <div className="queue-head">
          <h3 id="queue-claims-title">Claims awaiting a decision</h3>
          <span className="queue-count">{pendingClaims.length}</span>
          <Link className="text-link" href="/admin/claims">All claims</Link>
        </div>
        {pendingClaims.length ? (
          <ol className="queue-list">
            {pendingClaims.map(({ claim, item }) => (
              <li className="queue-row" key={claim.id}>
                <span aria-hidden="true" className="avatar">{initials(claim.claimant.name)}</span>
                <span className="queue-copy">
                  <strong>{claim.claimant.name}</strong>
                  <small>
                    {item ? `claims ${item.name} · ${referenceNumber(item.id)} · ${item.location}` : "claims an item that is no longer listed"}
                  </small>
                </span>
                <span className="queue-date">{formatDate(claim.submittedAt)}</span>
                <span className="queue-actions">
                  <Link className="button button-secondary button-small" href="/admin/claims">Review</Link>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="queue-empty">No claims waiting. Approved and rejected claims are listed on the claims page.</p>
        )}
      </section>

      {pendingChange && (
        <ConfirmationDialog
          confirmLabel={`${pendingChange.status === "Rejected" ? "Reject" : "Approve"} report`}
          danger={pendingChange.status === "Rejected"}
          description={pendingChange.status === "Rejected"
            ? `“${pendingChange.item.name}” will not be listed publicly. You can still approve it later.`
            : `“${pendingChange.item.name}” will appear in the public register so its owner can find and claim it.`}
          onCancel={() => setPendingChange(null)}
          onConfirm={confirmChange}
          pending={saving}
          title={pendingChange.status === "Rejected" ? "Reject this report?" : "Approve this report?"}
        />
      )}
    </>
  );
}
