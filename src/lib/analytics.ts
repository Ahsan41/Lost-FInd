import {
  itemCategories,
  type AdminFoundItem,
  type AdminItemStatus,
  type ClaimRequest,
  type ClaimStatus,
  type ItemCategory,
} from "@/types/item";

/*
 * Pure helpers behind the admin "Analytics" page. Everything here works on the
 * data the admin workspace already holds (found-item reports and claims), so
 * the page needs no extra backend endpoint. Dates in the data are ISO day
 * strings ("2026-10-14"); they are treated as UTC calendar days throughout.
 */

export type AnalyticsPeriod = "30d" | "12w" | "all";

export const analyticsPeriods: { id: AnalyticsPeriod; label: string }[] = [
  { id: "30d", label: "Last 30 days" },
  { id: "12w", label: "Last 12 weeks" },
  { id: "all", label: "All time" },
];

export interface TimelineBucket {
  key: string;
  /** Label printed under the column; empty for columns that stay unlabelled. */
  label: string;
  /** Human-readable range used for the column's tooltip. */
  title: string;
  start: number;
  end: number;
  reports: number;
  claims: number;
}

export interface FunnelStage {
  id: "received" | "listed" | "claimed" | "returned";
  label: string;
  note: string;
  count: number;
}

export interface CategoryRow {
  category: ItemCategory;
  count: number;
  returned: number;
}

export interface LocationRow {
  location: string;
  count: number;
}

export interface BreakdownSegment<Status extends string> {
  status: Status;
  count: number;
}

export interface AnalyticsSnapshot {
  period: AnalyticsPeriod;
  /** UTC midnight of the first day counted. */
  from: number;
  /** UTC midnight of the last day counted (today). */
  to: number;
  reports: AdminFoundItem[];
  claims: ClaimRequest[];
  timeline: TimelineBucket[];
  timelineMax: number;
  funnel: FunnelStage[];
  categories: CategoryRow[];
  locations: LocationRow[];
  reviewBreakdown: BreakdownSegment<AdminItemStatus>[];
  claimBreakdown: BreakdownSegment<ClaimStatus>[];
}

const DAY = 86_400_000;

export const reviewStatusOrder: AdminItemStatus[] = ["Pending review", "Approved", "Returned", "Rejected"];
export const claimStatusOrder: ClaimStatus[] = ["Pending", "Approved", "Rejected"];

/** UTC midnight for the local calendar date of `now`. */
export function todayUtc(now: Date = new Date()): number {
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Parses an ISO day string ("2026-10-14") to UTC midnight; NaN when malformed. */
export function parseDay(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return Number.NaN;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function startOfWeek(day: number): number {
  const weekday = new Date(day).getUTCDay(); // 0 = Sunday
  const offset = (weekday + 6) % 7; // days since Monday
  return day - offset * DAY;
}

function startOfMonth(day: number): number {
  const date = new Date(day);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

function addMonths(monthStart: number, months: number): number {
  const date = new Date(monthStart);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1);
}

const shortDay = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });
const shortMonth = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });
const monthYear = new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function formatDay(day: number): string {
  return longDay.format(new Date(day));
}

function emptyBuckets(period: AnalyticsPeriod, today: number, earliest: number | null): TimelineBucket[] {
  const buckets: TimelineBucket[] = [];

  if (period === "30d") {
    for (let i = 29; i >= 0; i--) {
      const start = today - i * DAY;
      buckets.push({
        key: `d${start}`,
        label: i % 7 === 1 || i === 29 ? shortDay.format(new Date(start)) : "",
        title: longDay.format(new Date(start)),
        start,
        end: start + DAY,
        reports: 0,
        claims: 0,
      });
    }
    return buckets;
  }

  if (period === "12w") {
    const thisWeek = startOfWeek(today);
    for (let i = 11; i >= 0; i--) {
      const start = thisWeek - i * 7 * DAY;
      buckets.push({
        key: `w${start}`,
        label: i % 2 === 1 ? shortDay.format(new Date(start)) : "",
        title: `Week of ${longDay.format(new Date(start))}`,
        start,
        end: start + 7 * DAY,
        reports: 0,
        claims: 0,
      });
    }
    return buckets;
  }

  const thisMonth = startOfMonth(today);
  const firstMonth = Math.min(
    addMonths(thisMonth, -5),
    earliest === null ? thisMonth : startOfMonth(earliest),
  );
  for (let start = firstMonth; start <= thisMonth; start = addMonths(start, 1)) {
    const date = new Date(start);
    const isJanuaryOrFirst = date.getUTCMonth() === 0 || start === firstMonth;
    buckets.push({
      key: `m${start}`,
      label: isJanuaryOrFirst ? monthYear.format(date) : shortMonth.format(date),
      title: monthYear.format(date),
      start,
      end: addMonths(start, 1),
      reports: 0,
      claims: 0,
    });
  }
  return buckets;
}

/** Smallest "even" ceiling for a chart axis so the half-way gridline is a whole number. */
export function niceMax(value: number): number {
  if (value <= 2) return 2;
  const steps = [2, 4, 6, 8, 10, 12, 16, 20, 24, 30, 40, 50, 60, 80, 100];
  let scale = 1;
  for (;;) {
    for (const step of steps) {
      if (step * scale >= value) return step * scale;
    }
    scale *= 10;
  }
}

function normaliseLocation(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function buildAnalytics(
  items: AdminFoundItem[],
  claims: ClaimRequest[],
  period: AnalyticsPeriod,
  today: number = todayUtc(),
): AnalyticsSnapshot {
  const itemDays = new Map(items.map((item) => [item.id, parseDay(item.submittedAt)]));
  const claimDays = new Map(claims.map((claim) => [claim.id, parseDay(claim.submittedAt)]));

  const allDays = [...itemDays.values(), ...claimDays.values()].filter((day) => !Number.isNaN(day));
  const earliest = allDays.length ? Math.min(...allDays) : null;

  const timeline = emptyBuckets(period, today, earliest);
  const from = timeline[0].start;
  const to = today;

  const inWindow = (day: number) => !Number.isNaN(day) && day >= from && day < today + DAY;
  const reports = items.filter((item) => inWindow(itemDays.get(item.id) ?? Number.NaN));
  const windowClaims = claims.filter((claim) => inWindow(claimDays.get(claim.id) ?? Number.NaN));

  const bucketFor = (day: number) => timeline.find((bucket) => day >= bucket.start && day < bucket.end);
  for (const item of reports) bucketFor(itemDays.get(item.id)!)!.reports += 1;
  for (const claim of windowClaims) {
    const bucket = bucketFor(claimDays.get(claim.id)!);
    if (bucket) bucket.claims += 1;
  }
  const timelineMax = niceMax(Math.max(0, ...timeline.map((bucket) => Math.max(bucket.reports, bucket.claims))));

  const reportIds = new Set(reports.map((item) => item.id));
  const claimedItemIds = new Set(claims.map((claim) => claim.itemId).filter((id) => reportIds.has(id)));
  const listed = reports.filter((item) => item.reviewStatus === "Approved" || item.reviewStatus === "Returned").length;
  const returned = reports.filter((item) => item.reviewStatus === "Returned").length;

  const funnel: FunnelStage[] = [
    { id: "received", label: "Reports received", note: "Every found-item report submitted", count: reports.length },
    { id: "listed", label: "Approved for listing", note: "Shown in the public register", count: listed },
    { id: "claimed", label: "Claimed by someone", note: "At least one ownership claim", count: claimedItemIds.size },
    { id: "returned", label: "Returned to owner", note: "Hand-over confirmed", count: returned },
  ];

  const categories: CategoryRow[] = itemCategories
    .map((category) => ({
      category,
      count: reports.filter((item) => item.category === category).length,
      returned: reports.filter((item) => item.category === category && item.reviewStatus === "Returned").length,
    }))
    .sort((first, second) => second.count - first.count || first.category.localeCompare(second.category));

  const locationCounts = new Map<string, LocationRow>();
  for (const item of reports) {
    const key = normaliseLocation(item.location).toLowerCase();
    if (!key) continue;
    const row = locationCounts.get(key) ?? { location: normaliseLocation(item.location), count: 0 };
    row.count += 1;
    locationCounts.set(key, row);
  }
  const locations = [...locationCounts.values()]
    .sort((first, second) => second.count - first.count || first.location.localeCompare(second.location))
    .slice(0, 6);

  const reviewBreakdown = reviewStatusOrder.map((status) => ({
    status,
    count: reports.filter((item) => item.reviewStatus === status).length,
  }));
  const claimBreakdown = claimStatusOrder.map((status) => ({
    status,
    count: windowClaims.filter((claim) => claim.status === status).length,
  }));

  return {
    period,
    from,
    to,
    reports,
    claims: windowClaims,
    timeline,
    timelineMax,
    funnel,
    categories,
    locations,
    reviewBreakdown,
    claimBreakdown,
  };
}

export function percentOf(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}
