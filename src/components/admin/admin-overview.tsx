"use client";

import Image from "next/image";
import Link from "next/link";
import { useAdminData } from "@/components/admin/admin-data-provider";
import { Icon } from "@/components/ui/icon";
import { StatusTag } from "@/components/ui/status-tag";
import { formatDate } from "@/lib/format";

export function AdminOverview() {
  const { overview, foundItems } = useAdminData();
  const pendingReports = foundItems.filter((item) => item.reviewStatus === "Pending review").length;

  const stats = [
    { label: "Total Found Items", value: overview.totalItems, note: "Reports received, all statuses" },
    { label: "Pending Claims", value: overview.pendingClaims, note: "Waiting for a decision", attention: overview.pendingClaims > 0 },
    { label: "Approved Claims", value: overview.approvedClaims, note: "Ownership confirmed" },
    { label: "Items Returned", value: overview.itemsReturned, note: "Handed back to their owners" },
  ];

  return (
    <>
      <section className="overview-intro">
        <div>
          <p className="kicker">Review desk</p>
          <h2>A little closer to found.</h2>
          <p>
            {pendingReports === 0 && overview.pendingClaims === 0
              ? "Nothing is waiting on you right now. New reports and claims will show up here."
              : `${pendingReports} ${pendingReports === 1 ? "report" : "reports"} and ${overview.pendingClaims} ${overview.pendingClaims === 1 ? "claim" : "claims"} are waiting for a decision.`}
          </p>
        </div>
        <Link className="button button-primary" href={pendingReports > 0 ? "/admin/found-items" : "/admin/claims"}>
          {pendingReports > 0 ? "Review reports" : "Review claims"} <Icon name="arrow-right" />
        </Link>
      </section>

      <section aria-label="Dashboard summary" className="stat-strip">
        {stats.map(({ label, value, note, attention }) => (
          <article className={`stat${attention ? " stat-attention" : ""}`} key={label}>
            <span className="stat-label">{label}</span>
            <strong className="stat-value">{value}</strong>
            <span className="stat-note">{note}</span>
          </article>
        ))}
      </section>

      <div className="overview-grid">
        <section aria-labelledby="recent-reports-title" className="panel">
          <div className="panel-head">
            <div>
              <h3 id="recent-reports-title">Recent found-item reports</h3>
              <p>Latest submissions</p>
            </div>
            <Link className="text-link" href="/admin/found-items">All reports</Link>
          </div>
          {overview.recentItems.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Item</th><th>Submitted</th><th>Status</th></tr></thead>
                <tbody>
                  {overview.recentItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="table-primary">
                          <span className={`thumb${item.image ? "" : " thumb-empty"}`}>
                            {item.image ? <Image alt="" fill sizes="42px" src={item.image} unoptimized /> : <Icon name="image" />}
                          </span>
                          <span><strong>{item.name}</strong><small>{item.category}</small></span>
                        </div>
                      </td>
                      <td className="table-date">{formatDate(item.submittedAt)}</td>
                      <td><StatusTag status={item.reviewStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="panel-empty">
              <h3>No reports yet</h3>
              <p>Found-item reports will appear here as people submit them.</p>
            </div>
          )}
        </section>

        <section aria-labelledby="recent-claims-title" className="panel">
          <div className="panel-head">
            <div>
              <h3 id="recent-claims-title">Recent claim requests</h3>
              <p>People looking for their belongings</p>
            </div>
            <Link className="text-link" href="/admin/claims">All claims</Link>
          </div>
          {overview.recentClaims.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Claimant</th><th>Found item</th><th>Status</th></tr></thead>
                <tbody>
                  {overview.recentClaims.map((claim) => (
                    <tr key={claim.id}>
                      <td>
                        <div className="table-primary">
                          <span><strong>{claim.claimant.name}</strong><small>{formatDate(claim.submittedAt)}</small></span>
                        </div>
                      </td>
                      <td>{claim.item.name}</td>
                      <td><StatusTag status={claim.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="panel-empty">
              <h3>No claim requests yet</h3>
              <p>New ownership claims will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
