import { vi } from "vitest";
import type { AdminFoundItem, FoundItem } from "@/types/item";
import type { AdminClaim, AdminOverviewData } from "@/lib/admin-api";

/**
 * A tiny in-memory stand-in for the Next.js proxy routes. Tests register
 * handlers keyed by "METHOD /api/..." and inspect what the components sent.
 */
export interface RecordedCall {
  method: string;
  url: string;
  body?: FormData | string | null;
  headers: Record<string, string>;
}

type Handler = (call: RecordedCall) => Response | Promise<Response>;

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function ok(data: unknown, extra: Record<string, unknown> = {}): Response {
  return json(200, { data, ...extra });
}

export function apiError(
  status: number,
  message: string,
  fields?: Record<string, string>,
): Response {
  return json(status, { error: { code: "ERR", message, ...(fields ? { fields } : {}) } });
}

export function installFakeApi(routes: Record<string, Handler>) {
  const calls: RecordedCall[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? "GET").toUpperCase();
    const path = url.replace(/^https?:\/\/[^/]+/, "");
    const call: RecordedCall = {
      method,
      url: path,
      body: (init?.body as FormData | string | null | undefined) ?? null,
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
    };
    calls.push(call);

    const exact = routes[`${method} ${path}`];
    const byPathOnly = routes[`${method} ${path.split("?")[0]}`];
    const handler = exact ?? byPathOnly;
    if (!handler) {
      throw new Error(`No fake route for ${method} ${path}`);
    }
    return handler(call);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

export function networkDown() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }),
  );
}

// ---------------------------------------------------------------------------
// Fixtures that mirror what the backend returns.
// ---------------------------------------------------------------------------

export const publicItems: FoundItem[] = [
  {
    id: "item-watch",
    name: "Silver wristwatch",
    category: "Accessories",
    description: "A silver-tone wristwatch with a dark blue face.",
    location: "Riverside Park, near the east entrance",
    foundDate: "2026-10-08",
    image: "https://images.unsplash.com/photo-watch",
    status: "Waiting for owner",
  },
  {
    id: "item-backpack",
    name: "Olive canvas backpack",
    category: "Bags & wallets",
    description: "A well-kept olive canvas daypack.",
    location: "Old Town Market, information desk",
    foundDate: "2026-10-07",
    image: null,
    status: "Waiting for owner",
  },
  {
    id: "item-headphones",
    name: "Wireless headphones",
    category: "Electronics",
    description: "Over-ear wireless headphones.",
    location: "Central Library, second floor",
    foundDate: "2026-10-06",
    image: "https://images.unsplash.com/photo-headphones",
    status: "Waiting for owner",
  },
  {
    id: "item-wallet",
    name: "Brown leather wallet",
    category: "Bags & wallets",
    description: "A slim brown leather wallet.",
    location: "Maple Street Café",
    foundDate: "2026-10-03",
    image: "https://images.unsplash.com/photo-wallet",
    status: "Reunited",
  },
];

export const adminItems: AdminFoundItem[] = [
  {
    ...publicItems[0],
    submittedAt: "2026-10-08",
    reviewStatus: "Approved",
    reporter: { name: "Morgan Ellis", email: "morgan@example.com", phone: "+1 202-555-0101" },
  },
  {
    ...publicItems[1],
    submittedAt: "2026-10-07",
    reviewStatus: "Approved",
    reporter: { name: "Jamie Brooks", email: "jamie@example.com", phone: "+1 202-555-0102" },
  },
  {
    ...publicItems[3],
    submittedAt: "2026-10-03",
    reviewStatus: "Returned",
    reporter: { name: "Alex Rivera", email: "alex@example.com", phone: "+1 202-555-0106" },
  },
  {
    id: "item-scarf",
    name: "Cream scarf with fringe",
    category: "Clothing",
    description: "A cream-coloured knit scarf found beside the transit shelter.",
    location: "Juniper Avenue transit shelter",
    foundDate: "2026-10-10",
    image: null,
    status: "Waiting for owner",
    submittedAt: "2026-10-10",
    reviewStatus: "Pending review",
    reporter: { name: "Chris Taylor", email: "chris@example.com", phone: "+1 202-555-0110" },
  },
  {
    id: "item-tote",
    name: "Canvas tote bag",
    category: "Bags & wallets",
    description: "A canvas tote bag with a stitched front pocket.",
    location: "Northside Community Hall",
    foundDate: "2026-09-27",
    image: null,
    status: "Waiting for owner",
    submittedAt: "2026-09-27",
    reviewStatus: "Rejected",
    reporter: { name: "Drew Morgan", email: "drew@example.com", phone: "+1 202-555-0111" },
  },
];

const linkedItem = (item: AdminFoundItem): AdminClaim["item"] => ({
  id: item.id,
  name: item.name,
  category: item.category,
  location: item.location,
  image: item.image,
  reviewStatus: item.reviewStatus,
});

export const adminClaims: AdminClaim[] = [
  {
    id: "claim-watch-01",
    itemId: "item-watch",
    claimant: { name: "Robin Harper", email: "robin@example.com", phone: "+1 202-555-0121" },
    lostItemDescription: "A silver watch with a navy dial.",
    ownershipProof: "The initials R.H. are engraved on the inside of the clasp.",
    supportingImage: "https://found-lost-backend.onrender.com/api/files/claims/proof-1.jpg",
    submittedAt: "2026-10-09",
    status: "Pending",
    item: linkedItem(adminItems[0]),
  },
  {
    id: "claim-bag-02",
    itemId: "item-backpack",
    claimant: { name: "Devon Price", email: "devon@example.com", phone: "+1 202-555-0122" },
    lostItemDescription: "An olive canvas backpack with a notebook inside.",
    ownershipProof: "The left strap has a hand-stitched repair.",
    submittedAt: "2026-10-08",
    status: "Pending",
    item: linkedItem(adminItems[1]),
  },
  {
    id: "claim-wallet-03",
    itemId: "item-wallet",
    claimant: { name: "Emery Clark", email: "emery@example.com", phone: "+1 202-555-0123" },
    lostItemDescription: "A slim brown wallet.",
    ownershipProof: "Library card in the second slot.",
    submittedAt: "2026-10-04",
    status: "Approved",
    item: linkedItem(adminItems[2]),
  },
];

export const adminOverview: AdminOverviewData = {
  totalItems: 5,
  pendingClaims: 2,
  approvedClaims: 1,
  itemsReturned: 1,
  recentItems: adminItems.slice(0, 4),
  recentClaims: adminClaims,
};

export const adminUser = {
  id: "user-admin",
  name: "LostNFind Admin",
  email: "admin@lostnfind.local",
  role: "ADMIN" as const,
};

/** Standard admin routes for a signed-in session. Override per test as needed. */
export function adminRoutes(overrides: Record<string, Handler> = {}): Record<string, Handler> {
  return {
    "GET /api/admin/auth/me": () => ok(adminUser),
    "GET /api/admin/items": () => ok(adminItems, { total: adminItems.length }),
    "GET /api/admin/claims": () => ok(adminClaims, { total: adminClaims.length }),
    "GET /api/admin/stats": () => ok(adminOverview),
    "POST /api/admin/auth/logout": () => ok({ loggedOut: true }),
    ...overrides,
  };
}
