import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { AdminAnalytics } from "@/components/admin/admin-analytics";
import { AdminAuthGate } from "@/components/admin/admin-auth-gate";
import { AdminDataProvider } from "@/components/admin/admin-data-provider";
import { AdminShell } from "@/components/admin/admin-shell";
import { buildAnalytics, niceMax, parseDay } from "@/lib/analytics";
import { adminClaims, adminItems, adminRoutes, installFakeApi } from "../helpers/fake-api";

function renderAdmin(page: ReactNode) {
  return render(
    <AdminAuthGate>
      <AdminDataProvider>
        <AdminShell>{page}</AdminShell>
      </AdminDataProvider>
    </AdminAuthGate>,
  );
}

// The fixtures are dated around October 2026; pin "today" so the tests do
// not drift as the calendar moves on.
const today = parseDay("2026-10-16");

describe("buildAnalytics", () => {
  it("counts the outcome funnel from the reports in the period", () => {
    const snapshot = buildAnalytics(adminItems, adminClaims, "30d", today);
    expect(snapshot.funnel.map((stage) => stage.count)).toEqual([5, 3, 3, 1]);
  });

  it("drops reports outside the period and keeps the ones inside", () => {
    const snapshot = buildAnalytics(adminItems, adminClaims, "30d", parseDay("2026-10-30"));
    // The rejected report from 27 September now falls outside the 30-day window.
    expect(snapshot.reports.map((item) => item.id)).not.toContain("item-tote");
    expect(snapshot.funnel[0].count).toBe(4);
  });

  it("buckets submissions into days, weeks and months", () => {
    const daily = buildAnalytics(adminItems, adminClaims, "30d", today);
    expect(daily.timeline).toHaveLength(30);
    expect(daily.timeline.reduce((sum, bucket) => sum + bucket.reports, 0)).toBe(5);
    expect(daily.timeline.reduce((sum, bucket) => sum + bucket.claims, 0)).toBe(3);

    const weekly = buildAnalytics(adminItems, adminClaims, "12w", today);
    expect(weekly.timeline).toHaveLength(12);
    expect(weekly.timeline.at(-1)?.title).toBe("Week of Oct 12, 2026");

    const monthly = buildAnalytics(adminItems, adminClaims, "all", today);
    expect(monthly.timeline.length).toBeGreaterThanOrEqual(6);
    expect(monthly.timeline.at(-1)?.title).toBe("Oct 2026");
  });

  it("ranks categories and locations by count", () => {
    const snapshot = buildAnalytics(adminItems, adminClaims, "30d", today);
    expect(snapshot.categories[0]).toMatchObject({ category: "Bags & wallets", count: 3, returned: 1 });
    expect(snapshot.categories).toHaveLength(7);
    expect(snapshot.locations[0]).toMatchObject({ count: 1 });
    expect(snapshot.locations.length).toBeLessThanOrEqual(6);
  });

  it("breaks reviews and claim decisions down by status", () => {
    const snapshot = buildAnalytics(adminItems, adminClaims, "30d", today);
    expect(Object.fromEntries(snapshot.reviewBreakdown.map((segment) => [segment.status, segment.count]))).toEqual({
      "Pending review": 1,
      Approved: 2,
      Returned: 1,
      Rejected: 1,
    });
    expect(Object.fromEntries(snapshot.claimBreakdown.map((segment) => [segment.status, segment.count]))).toEqual({
      Pending: 2,
      Approved: 1,
      Rejected: 0,
    });
  });

  it("chooses an even axis ceiling", () => {
    expect(niceMax(0)).toBe(2);
    expect(niceMax(3)).toBe(4);
    expect(niceMax(11)).toBe(12);
    expect(niceMax(130)).toBe(160);
  });
});

describe("Analytics page (AdminAnalytics)", () => {
  it("renders the report sections from the loaded workspace data", async () => {
    installFakeApi(adminRoutes());
    renderAdmin(<AdminAnalytics />);

    expect(await screen.findByRole("heading", { name: "How the register is moving." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Analytics" })).toHaveAttribute("href", "/admin/analytics");

    const funnel = screen.getByRole("region", { name: "From found to returned" });
    expect(within(funnel).getAllByRole("listitem")).toHaveLength(4);
    expect(within(funnel).getByText("Reports received")).toBeInTheDocument();

    expect(screen.getByRole("region", { name: /Submissions, day by day/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Submissions per day/ })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "What gets handed in" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Decisions" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Where things turn up" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Claim pressure" })).toBeInTheDocument();
  });

  it("switches the period and relabels the timeline", async () => {
    installFakeApi(adminRoutes());
    renderAdmin(<AdminAnalytics />);
    await screen.findByRole("heading", { name: "How the register is moving." });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Last 12 weeks" }));
    expect(screen.getByRole("button", { name: "Last 12 weeks" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("region", { name: /Submissions, week by week/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All time" }));
    expect(screen.getByRole("region", { name: /Submissions, month by month/ })).toBeInTheDocument();
  });
});
