"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useAdminData } from "@/components/admin/admin-data-provider";
import { StatusBadge } from "@/components/admin/status-badge";
import { Icon, type IconName } from "@/components/ui/icon";
import { formatDate } from "@/lib/format";

export function AdminOverview() {
  const { foundItems, claims } = useAdminData();
  const recentItems = useMemo(
    () => [...foundItems].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 4),
    [foundItems],
  );
  const recentClaims = useMemo(
    () => [...claims].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 4),
    [claims],
  );
  const stats: { label: string; value: number; note: string; icon: IconName; mint?: boolean }[] = [
    { label: "Total Found Items", value: foundItems.length, note: "Community item reports", icon: "bag" },
    { label: "Pending Claims", value: claims.filter((claim) => claim.status === "Pending").length, note: "Awaiting a review", icon: "clock" },
    { label: "Approved Claims", value: claims.filter((claim) => claim.status === "Approved").length, note: "Ownership confirmed", icon: "check-circle", mint: true },
    { label: "Items Returned", value: foundItems.filter((item) => item.reviewStatus === "Returned").length, note: "Reunited with their owners", icon: "heart", mint: true },
  ];

  return (
    <>
      <section className="admin-welcome">
        <div className="admin-welcome-copy">
          <span className="admin-welcome-mark"><Icon name="sparkle" /></span>
          <div>
            <h2>A little closer to found.</h2>
            <p>Review community reports, verify ownership details, and help each item find its way back.</p>
          </div>
        </div>
        <Link className="button button-primary" href="/admin/found-items">Review reports <Icon name="arrow-right" /></Link>
      </section>

      <section aria-label="Dashboard summary" className="admin-summary-grid">
        {stats.map(({ label, value, note, icon, mint }) => (
          <article className="admin-stat-card" key={label}>
            <div className="admin-stat-top">
              <span className="admin-stat-label">{label}</span>
              <span className={`admin-stat-icon${mint ? " admin-stat-icon-mint" : ""}`}><Icon name={icon} /></span>
            </div>
            <strong className="admin-stat-value">{value}</strong>
            <span className="admin-stat-note">{note}</span>
          </article>
        ))}
      </section>

      <div className="admin-overview-grid">
        <section aria-labelledby="recent-reports-title" className="admin-panel">
          <div className="admin-panel-header">
            <div><h3 id="recent-reports-title">Recent found-item reports</h3><p>Latest community submissions</p></div>
            <Link className="admin-panel-link" href="/admin/found-items">All reports <Icon name="arrow-right" /></Link>
          </div>
          {recentItems.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table admin-compact-table">
                <thead><tr><th>Item</th><th>Submitted</th><th>Status</th></tr></thead>
                <tbody>
                  {recentItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="admin-table-primary">
                          <span className="admin-item-thumb"><Image alt="" fill sizes="38px" src={item.image} unoptimized /></span>
                          <span><strong>{item.name}</strong><small>{item.category}</small></span>
                        </div>
                      </td>
                      <td>{formatDate(item.submittedAt)}</td>
                      <td><StatusBadge status={item.reviewStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="admin-empty-state"><h3>No reports yet</h3><p>Found item reports will appear here.</p></div>}
        </section>

        <section aria-labelledby="recent-claims-title" className="admin-panel">
          <div className="admin-panel-header">
            <div><h3 id="recent-claims-title">Recent claim requests</h3><p>People looking for their belongings</p></div>
            <Link className="admin-panel-link" href="/admin/claims">All claims <Icon name="arrow-right" /></Link>
          </div>
          {recentClaims.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table admin-compact-table">
                <thead><tr><th>Claimant</th><th>Found item</th><th>Status</th></tr></thead>
                <tbody>
                  {recentClaims.map((claim) => {
                    const item = foundItems.find((candidate) => candidate.id === claim.itemId);
                    return (
                      <tr key={claim.id}>
                        <td><div className="admin-table-primary"><span><strong>{claim.claimant.name}</strong><small>{formatDate(claim.submittedAt)}</small></span></div></td>
                        <td>{item?.name ?? "Item no longer listed"}</td>
                        <td><StatusBadge status={claim.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <div className="admin-empty-state"><h3>No claim requests yet</h3><p>New ownership requests will appear here.</p></div>}
        </section>
      </div>
    </>
  );
}
