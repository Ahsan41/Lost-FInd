"use client";

import { useMemo, useState } from "react";
import { useAdminData } from "@/components/admin/admin-data-provider";
import {
  analyticsPeriods,
  buildAnalytics,
  formatDay,
  percentOf,
  todayUtc,
  type AnalyticsPeriod,
  type AnalyticsSnapshot,
  type BreakdownSegment,
  type TimelineBucket,
} from "@/lib/analytics";

function statusSlug(status: string): string {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function AdminAnalytics() {
  const { foundItems, claims } = useAdminData();
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const today = useMemo(() => todayUtc(), []);
  const snapshot = useMemo(
    () => buildAnalytics(foundItems, claims, period, today),
    [claims, foundItems, period, today],
  );
  const empty = snapshot.reports.length === 0 && snapshot.claims.length === 0;

  return (
    <>
      <div className="desk-page-head">
        <div>
          <p className="kicker">Register report</p>
          <h2>How the register is moving.</h2>
          <p>
            Drawn from the same reports and claims you review on the other tabs. Counts cover
            submissions between <strong>{formatDay(snapshot.from)}</strong> and{" "}
            <strong>{formatDay(snapshot.to)}</strong>.
          </p>
        </div>
        <div aria-label="Reporting period" className="filter-tabs" role="group">
          {analyticsPeriods.map(({ id, label }) => (
            <button
              aria-pressed={period === id}
              className="filter-tab"
              key={id}
              onClick={() => setPeriod(id)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {empty ? (
        <section className="panel">
          <div className="panel-empty">
            <h3>Nothing logged in this period</h3>
            <p>Widen the period, or check back once new reports and claims arrive.</p>
          </div>
        </section>
      ) : (
        <>
          <Funnel snapshot={snapshot} />
          <Timeline snapshot={snapshot} />
          <div className="report-grid">
            <Categories snapshot={snapshot} />
            <Decisions snapshot={snapshot} />
          </div>
          <div className="report-grid report-grid-even">
            <Locations snapshot={snapshot} />
            <ClaimLoad snapshot={snapshot} />
          </div>
        </>
      )}
    </>
  );
}

/* Outcome funnel ----------------------------------------------------- */

function Funnel({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  const received = snapshot.funnel[0].count;
  const returned = snapshot.funnel[3].count;
  return (
    <section aria-labelledby="funnel-title" className="panel report-panel">
      <div className="panel-head">
        <div>
          <h3 id="funnel-title">From found to returned</h3>
          <p>What happened to the reports received in this period</p>
        </div>
        <p className="report-figure">
          <strong>{percentOf(returned, received)}%</strong>
          <span>reunited</span>
        </p>
      </div>
      <ol className="funnel">
        {snapshot.funnel.map((stage, index) => {
          const previous = index === 0 ? null : snapshot.funnel[index - 1];
          const width = received ? Math.max((stage.count / received) * 100, stage.count ? 2 : 0) : 0;
          return (
            <li className="funnel-stage" key={stage.id}>
              <div className="funnel-copy">
                <span className="funnel-label">{stage.label}</span>
                <span className="funnel-note">{stage.note}</span>
              </div>
              <div className="funnel-track" aria-hidden="true">
                <span className={`funnel-bar funnel-bar-${stage.id}`} style={{ width: `${width}%` }} />
              </div>
              <div className="funnel-count">
                <strong>{stage.count}</strong>
                {previous && previous.count > 0 && (
                  <small>{percentOf(stage.count, previous.count)}% of {previous.label.split(" ")[0].toLowerCase()}</small>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* Submissions over time --------------------------------------------- */

function Timeline({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  const { timeline, timelineMax } = snapshot;
  const totalReports = timeline.reduce((sum, bucket) => sum + bucket.reports, 0);
  const totalClaims = timeline.reduce((sum, bucket) => sum + bucket.claims, 0);
  const busiest = timeline.reduce<TimelineBucket | null>(
    (best, bucket) => (bucket.reports + bucket.claims > (best ? best.reports + best.claims : 0) ? bucket : best),
    null,
  );
  const unit = snapshot.period === "30d" ? "day" : snapshot.period === "12w" ? "week" : "month";
  const columnWidth = 100 / timeline.length;
  const barWidth = Math.min(columnWidth * 0.3, 2.6);
  const gap = Math.min(columnWidth * 0.06, 0.5);

  return (
    <section aria-labelledby="timeline-title" className="panel report-panel">
      <div className="panel-head">
        <div>
          <h3 id="timeline-title">Submissions, {unit} by {unit}</h3>
          <p>
            {plural(totalReports, "report")} and {plural(totalClaims, "claim")}
            {busiest && busiest.reports + busiest.claims > 0 ? ` · busiest ${unit}: ${busiest.title}` : ""}
          </p>
        </div>
        <ul className="report-legend">
          <li><span className="legend-swatch legend-swatch-reports" />Reports</li>
          <li><span className="legend-swatch legend-swatch-claims" />Claims</li>
        </ul>
      </div>
      <div className="timeline">
        <div aria-hidden="true" className="timeline-scale">
          <span>{timelineMax}</span>
          <span>{timelineMax / 2}</span>
          <span>0</span>
        </div>
        <div className="timeline-plot">
          <svg
            aria-label={`Submissions per ${unit}: ${timeline
              .filter((bucket) => bucket.reports || bucket.claims)
              .map((bucket) => `${bucket.title}: ${bucket.reports} reports, ${bucket.claims} claims`)
              .join("; ") || "none in this period"}`}
            className="timeline-svg"
            preserveAspectRatio="none"
            role="img"
            viewBox="0 0 100 100"
          >
            <line className="timeline-rule" x1="0" x2="100" y1="0" y2="0" vectorEffect="non-scaling-stroke" />
            <line className="timeline-rule" x1="0" x2="100" y1="50" y2="50" vectorEffect="non-scaling-stroke" />
            <line className="timeline-rule timeline-rule-base" x1="0" x2="100" y1="100" y2="100" vectorEffect="non-scaling-stroke" />
            {timeline.map((bucket, index) => {
              const centre = columnWidth * index + columnWidth / 2;
              const reportsHeight = (bucket.reports / timelineMax) * 100;
              const claimsHeight = (bucket.claims / timelineMax) * 100;
              return (
                <g key={bucket.key}>
                  <title>{`${bucket.title}: ${bucket.reports} reports, ${bucket.claims} claims`}</title>
                  {bucket.reports > 0 && (
                    <rect
                      className="timeline-bar timeline-bar-reports"
                      height={reportsHeight}
                      width={barWidth}
                      x={centre - barWidth - gap}
                      y={100 - reportsHeight}
                    />
                  )}
                  {bucket.claims > 0 && (
                    <rect
                      className="timeline-bar timeline-bar-claims"
                      height={claimsHeight}
                      width={barWidth}
                      x={centre + gap}
                      y={100 - claimsHeight}
                    />
                  )}
                  {bucket.reports === 0 && bucket.claims === 0 && (
                    <rect className="timeline-tick" height="1.5" width={barWidth * 2 + gap * 2} x={centre - barWidth - gap} y="98.5" />
                  )}
                </g>
              );
            })}
          </svg>
          <div aria-hidden="true" className="timeline-axis">
            {timeline.map((bucket) => (
              <span key={bucket.key}>{bucket.label}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* Categories --------------------------------------------------------- */

function Categories({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  const max = Math.max(1, ...snapshot.categories.map((row) => row.count));
  const top = snapshot.categories[0];
  return (
    <section aria-labelledby="categories-title" className="panel report-panel">
      <div className="panel-head">
        <div>
          <h3 id="categories-title">What gets handed in</h3>
          <p>Reports by category · darker segment is returned</p>
        </div>
        {top && top.count > 0 && (
          <p className="report-figure">
            <strong>{percentOf(top.count, snapshot.reports.length)}%</strong>
            <span>{top.category.toLowerCase()}</span>
          </p>
        )}
      </div>
      <ol className="ledger">
        {snapshot.categories.map((row) => (
          <li className={`ledger-row${row.count === 0 ? " ledger-row-empty" : ""}`} key={row.category}>
            <span className="ledger-label">{row.category}</span>
            <span aria-hidden="true" className="ledger-track">
              <span className="ledger-bar" style={{ width: `${(row.count / max) * 100}%` }}>
                <span className="ledger-bar-done" style={{ width: row.count ? `${(row.returned / row.count) * 100}%` : 0 }} />
              </span>
            </span>
            <span className="ledger-count">
              {row.count === 0 ? "—" : row.count}
              <small>{row.returned ? `${row.returned} back` : ""}</small>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* Review and claim decisions ---------------------------------------- */

function Breakdown<Status extends string>({
  title,
  total,
  segments,
  unit,
}: {
  title: string;
  total: number;
  segments: BreakdownSegment<Status>[];
  unit: string;
}) {
  return (
    <div className="breakdown">
      <div className="breakdown-head">
        <span className="breakdown-title">{title}</span>
        <span className="breakdown-total">{plural(total, unit)}</span>
      </div>
      <div
        aria-label={`${title}: ${segments.map((segment) => `${segment.count} ${segment.status.toLowerCase()}`).join(", ")}`}
        className="breakdown-bar"
        role="img"
      >
        {total === 0 ? (
          <span className="breakdown-segment breakdown-segment-none" />
        ) : (
          segments
            .filter((segment) => segment.count > 0)
            .map((segment) => (
              <span
                className={`breakdown-segment is-${statusSlug(segment.status)}`}
                key={segment.status}
                style={{ flexGrow: segment.count }}
                title={`${segment.status}: ${segment.count}`}
              />
            ))
        )}
      </div>
      <ul className="breakdown-legend">
        {segments.map((segment) => (
          <li className={segment.count === 0 ? "is-zero" : undefined} key={segment.status}>
            <span className={`legend-swatch is-${statusSlug(segment.status)}`} />
            <span className="breakdown-legend-label">{segment.status}</span>
            <span className="breakdown-legend-count">
              {segment.count}
              <small>{percentOf(segment.count, total)}%</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Decisions({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  const pendingReports = snapshot.reviewBreakdown.find((segment) => segment.status === "Pending review")?.count ?? 0;
  const pendingClaims = snapshot.claimBreakdown.find((segment) => segment.status === "Pending")?.count ?? 0;
  return (
    <section aria-labelledby="decisions-title" className="panel report-panel">
      <div className="panel-head">
        <div>
          <h3 id="decisions-title">Decisions</h3>
          <p>
            {pendingReports + pendingClaims === 0
              ? "Nothing waiting on a decision"
              : `${plural(pendingReports, "report")} and ${plural(pendingClaims, "claim")} still waiting`}
          </p>
        </div>
      </div>
      <div className="breakdown-stack">
        <Breakdown segments={snapshot.reviewBreakdown} title="Report reviews" total={snapshot.reports.length} unit="report" />
        <Breakdown segments={snapshot.claimBreakdown} title="Claim decisions" total={snapshot.claims.length} unit="claim" />
      </div>
    </section>
  );
}

/* Locations ---------------------------------------------------------- */

function Locations({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  const max = Math.max(1, ...snapshot.locations.map((row) => row.count));
  return (
    <section aria-labelledby="locations-title" className="panel report-panel">
      <div className="panel-head">
        <div>
          <h3 id="locations-title">Where things turn up</h3>
          <p>Most frequent places reported</p>
        </div>
      </div>
      {snapshot.locations.length ? (
        <ol className="ledger ledger-ranked">
          {snapshot.locations.map((row, index) => (
            <li className="ledger-row" key={row.location}>
              <span className="ledger-rank">{String(index + 1).padStart(2, "0")}</span>
              <span className="ledger-label">{row.location}</span>
              <span aria-hidden="true" className="ledger-track">
                <span className="ledger-bar" style={{ width: `${(row.count / max) * 100}%` }} />
              </span>
              <span className="ledger-count">{row.count}</span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="panel-empty panel-empty-compact"><p>No locations recorded in this period.</p></div>
      )}
    </section>
  );
}

/* Claim load --------------------------------------------------------- */

function ClaimLoad({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  const claimsPerItem = new Map<string, number>();
  for (const claim of snapshot.claims) {
    claimsPerItem.set(claim.itemId, (claimsPerItem.get(claim.itemId) ?? 0) + 1);
  }
  const itemsById = new Map(snapshot.reports.map((item) => [item.id, item]));
  const contested = [...claimsPerItem.entries()]
    .map(([itemId, count]) => ({ item: itemsById.get(itemId), count }))
    .filter((row): row is { item: NonNullable<typeof row.item>; count: number } => Boolean(row.item))
    .sort((first, second) => second.count - first.count || first.item.name.localeCompare(second.item.name))
    .slice(0, 5);
  const listed = snapshot.funnel[1].count;
  const claimedListed = snapshot.funnel[2].count;
  const approvedClaims = snapshot.claimBreakdown.find((segment) => segment.status === "Approved")?.count ?? 0;

  return (
    <section aria-labelledby="claims-title" className="panel report-panel">
      <div className="panel-head">
        <div>
          <h3 id="claims-title">Claim pressure</h3>
          <p>How many listed items are being asked for</p>
        </div>
      </div>
      <dl className="ledger-figures">
        <div>
          <dt>Claims per listed item</dt>
          <dd>{listed ? (snapshot.claims.length / listed).toFixed(1) : "—"}</dd>
        </div>
        <div>
          <dt>Listed items with a claim</dt>
          <dd>{percentOf(claimedListed, listed)}%</dd>
        </div>
        <div>
          <dt>Claims approved</dt>
          <dd>{percentOf(approvedClaims, snapshot.claims.length)}%</dd>
        </div>
      </dl>
      {contested.length > 0 && (
        <ol className="ledger ledger-ranked ledger-inset">
          {contested.map(({ item, count }, index) => (
            <li className="ledger-row" key={item.id}>
              <span className="ledger-rank">{String(index + 1).padStart(2, "0")}</span>
              <span className="ledger-label">
                {item.name}
                <small>{item.category}</small>
              </span>
              <span className="ledger-count">{plural(count, "claim")}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
