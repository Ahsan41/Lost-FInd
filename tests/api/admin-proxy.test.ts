import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// next/headers cookies() backed by a plain map so the handler can be called directly.
const { cookieJar, cookieSets } = vi.hoisted(() => ({
  cookieJar: new Map<string, string>(),
  cookieSets: [] as { name: string; value: string; options: Record<string, unknown> }[],
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    set: (name: string, value: string, options: Record<string, unknown>) => {
      cookieSets.push({ name, value, options });
      if (options.maxAge === 0) cookieJar.delete(name);
      else cookieJar.set(name, value);
    },
  }),
}));

import { GET, PATCH, POST } from "@/app/api/admin/[...path]/route";

const ORIGIN = "http://localhost:3000";
const COOKIE = "lostnfind_admin_session";
const params = (...path: string[]) => ({ params: Promise.resolve({ path }) });

function upstream(status: number, body: unknown, contentType = "application/json"): Response {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "Content-Type": contentType },
  });
}

function jsonRequest(path: string, method: string, body?: unknown): Request {
  return new Request(`${ORIGIN}/api/admin/${path}`, {
    method,
    headers: { origin: ORIGIN, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Admin proxy: /api/admin/[...path]", () => {
  beforeEach(() => {
    process.env.BACKEND_API_URL = "https://backend.test";
    cookieJar.clear();
    cookieSets.length = 0;
  });
  afterEach(() => {
    delete process.env.BACKEND_API_URL;
  });

  it("login forwards credentials, stores the JWT in an HttpOnly cookie and never returns it", async () => {
    const fetchMock = vi.fn(async () =>
      upstream(200, { data: { token: "jwt-123", user: { id: "u1", name: "Admin", email: "a@b.c", role: "ADMIN" } } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(jsonRequest("auth/login", "POST", { email: "a@b.c", password: "pw" }), params("auth", "login"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ data: { user: { id: "u1", name: "Admin", email: "a@b.c", role: "ADMIN" } } });
    expect(JSON.stringify(body)).not.toContain("jwt-123");

    expect(cookieSets[0]).toMatchObject({
      name: COOKIE,
      value: "jwt-123",
      options: { httpOnly: true, sameSite: "lax", path: "/api/admin" },
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://backend.test/api/auth/login");
    expect(new Headers(init.headers).get("authorization")).toBeNull();
  });

  it("login with wrong credentials answers 401 with a message the form can show", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => upstream(401, { error: { code: "UNAUTHORIZED", message: "Incorrect email or password." } })));
    const response = await POST(jsonRequest("auth/login", "POST", { email: "a@b.c", password: "x" }), params("auth", "login"));
    expect(response.status).toBe(401);
    expect((await response.json()).error.message).toBe("Email or password is incorrect.");
    expect(cookieJar.size).toBe(0);
  });

  it("mutations need a same-origin Origin header", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const response = await POST(
      new Request(`${ORIGIN}/api/admin/auth/login`, { method: "POST", headers: { origin: "https://evil.example" } }),
      params("auth", "login"),
    );
    expect(response.status).toBe(403);
  });

  it("every other route needs the session cookie", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(jsonRequest("stats", "GET"), params("stats"));
    expect(response.status).toBe(401);
    expect((await response.json()).error).toEqual({ code: "UNAUTHORIZED", message: "Sign in to continue." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards admin calls with the Bearer token from the cookie, keeping path, query, method and body", async () => {
    cookieJar.set(COOKIE, "jwt-123");
    const fetchMock = vi.fn(async () => upstream(200, { data: { id: "item-1", reviewStatus: "Approved" } }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await PATCH(jsonRequest("items/item-1/status", "PATCH", { reviewStatus: "Approved" }), params("items", "item-1", "status"));
    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://backend.test/api/admin/items/item-1/status");
    expect(init.method).toBe("PATCH");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer jwt-123");
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe(JSON.stringify({ reviewStatus: "Approved" }));

    const list = await GET(jsonRequest("items?reviewStatus=Pending%20review", "GET"), params("items"));
    expect(list.status).toBe(200);
    expect((fetchMock.mock.calls[1] as unknown as [string])[0]).toBe("https://backend.test/api/admin/items?reviewStatus=Pending%20review");
  });

  it("/me goes to /api/auth/me (not /api/admin) and only returns the public user fields", async () => {
    cookieJar.set(COOKIE, "jwt-123");
    const fetchMock = vi.fn(async () =>
      upstream(200, { data: { id: "u1", name: "Admin", email: "a@b.c", role: "ADMIN", passwordHash: "nope" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(jsonRequest("auth/me", "GET"), params("auth", "me"));
    expect(await response.json()).toEqual({ data: { id: "u1", name: "Admin", email: "a@b.c", role: "ADMIN" } });
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe("https://backend.test/api/auth/me");
  });

  it("a backend 401 clears the cookie and tells the UI to sign in again", async () => {
    cookieJar.set(COOKIE, "expired");
    vi.stubGlobal("fetch", vi.fn(async () => upstream(401, { error: { code: "UNAUTHORIZED", message: "expired" } })));
    const response = await GET(jsonRequest("claims", "GET"), params("claims"));
    expect(response.status).toBe(401);
    expect((await response.json()).error.message).toBe("Your admin session has expired. Sign in again.");
    expect(cookieJar.has(COOKIE)).toBe(false);
  });

  it("logout clears the cookie without touching the backend", async () => {
    cookieJar.set(COOKIE, "jwt-123");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(jsonRequest("auth/logout", "POST"), params("auth", "logout"));
    expect(await response.json()).toEqual({ data: { loggedOut: true } });
    expect(cookieJar.has(COOKIE)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("serves claim evidence from /api/files/claims with the token, and nothing else under files/", async () => {
    cookieJar.set(COOKIE, "jwt-123");
    const fetchMock = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "Content-Type": "image/png" } }));
    vi.stubGlobal("fetch", fetchMock);

    const image = await GET(jsonRequest("files/claims/proof.png", "GET"), params("files", "claims", "proof.png"));
    expect(image.status).toBe(200);
    expect(image.headers.get("content-type")).toBe("image/png");
    expect(new Uint8Array(await image.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://backend.test/api/files/claims/proof.png");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer jwt-123");

    const items = await GET(jsonRequest("files/items/x.png", "GET"), params("files", "items", "x.png"));
    expect(items.status).toBe(404);
    const traversal = await GET(jsonRequest("files/claims/..%2Fsecret", "GET"), params("files", "claims", "../secret"));
    expect(traversal.status).toBe(404);
  });

  it("unknown routes and wrong methods are 404, backend 5xx is 502", async () => {
    cookieJar.set(COOKIE, "jwt-123");
    vi.stubGlobal("fetch", vi.fn(async () => upstream(500, "boom", "text/plain")));
    expect((await GET(jsonRequest("users", "GET"), params("users"))).status).toBe(404);
    expect((await POST(jsonRequest("items", "POST"), params("items"))).status).toBe(404);
    expect((await GET(jsonRequest("stats", "GET"), params("stats"))).status).toBe(502);
  });
});
