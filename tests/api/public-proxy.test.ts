import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/public/[...path]/route";

const params = (...path: string[]) => ({ params: Promise.resolve({ path }) });
const ORIGIN = "http://localhost:3000";

function upstream(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Public proxy: /api/public/[...path]", () => {
  beforeEach(() => {
    process.env.BACKEND_API_URL = "https://backend.test";
  });
  afterEach(() => {
    delete process.env.BACKEND_API_URL;
  });

  it("GET items forwards the query string to the backend and returns its body", async () => {
    const fetchMock = vi.fn(async () => upstream(200, { data: [], total: 0 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(new Request(`${ORIGIN}/api/public/items?limit=100&q=watch`), params("items"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [], total: 0 });
    expect(response.headers.get("cache-control")).toBe("no-store");

    const [url] = fetchMock.mock.calls[0] as unknown as [URL];
    expect(url.toString()).toBe("https://backend.test/api/items?limit=100&q=watch");
  });

  it("only exposes the two public paths", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const admin = await GET(new Request(`${ORIGIN}/api/public/admin/items`), params("admin", "items"));
    expect(admin.status).toBe(404);
    const single = await GET(new Request(`${ORIGIN}/api/public/items/abc`), params("items", "abc"));
    expect(single.status).toBe(404);
  });

  it("POST items requires a same-origin Origin header and multipart data", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const noOrigin = await POST(new Request(`${ORIGIN}/api/public/items`, { method: "POST" }), params("items"));
    expect(noOrigin.status).toBe(403);

    const wrongOrigin = await POST(
      new Request(`${ORIGIN}/api/public/items`, { method: "POST", headers: { origin: "https://evil.example" } }),
      params("items"),
    );
    expect(wrongOrigin.status).toBe(403);

    const jsonBody = await POST(
      new Request(`${ORIGIN}/api/public/items`, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json" },
        body: "{}",
      }),
      params("items"),
    );
    expect(jsonBody.status).toBe(415);
  });

  it("POST streams the multipart body to the backend and passes 400 field errors through", async () => {
    const fetchMock = vi.fn(async () =>
      upstream(400, { error: { code: "VALIDATION_ERROR", message: "x", fields: { name: "Add a name for the item." } } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const form = new FormData();
    form.append("name", "");
    const request = new Request(`${ORIGIN}/api/public/items`, { method: "POST", headers: { origin: ORIGIN }, body: form });

    const response = await POST(request, params("items"));
    expect(response.status).toBe(400);
    expect((await response.json()).error.fields.name).toBe("Add a name for the item.");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://backend.test/api/items");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("content-type")).toContain("multipart/form-data");
  });

  it("POST items/:id/claims maps to the backend claim route", async () => {
    const fetchMock = vi.fn(async () => upstream(201, { data: { id: "c1", status: "Pending" } }));
    vi.stubGlobal("fetch", fetchMock);
    const form = new FormData();
    const response = await POST(
      new Request(`${ORIGIN}/api/public/items/item-1/claims`, { method: "POST", headers: { origin: ORIGIN }, body: form }),
      params("items", "item-1", "claims"),
    );
    expect(response.status).toBe(201);
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe("https://backend.test/api/items/item-1/claims");
  });

  it("rejects bodies larger than the image limit before contacting the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(
      new Request(`${ORIGIN}/api/public/items`, {
        method: "POST",
        headers: {
          origin: ORIGIN,
          "content-type": "multipart/form-data; boundary=x",
          "content-length": String(9 * 1024 * 1024),
        },
        body: "x",
      }),
      params("items"),
    );
    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("turns backend 5xx and network failures into a 502 with a friendly message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => upstream(500, { error: { code: "INTERNAL", message: "boom" } })));
    const down = await GET(new Request(`${ORIGIN}/api/public/items`), params("items"));
    expect(down.status).toBe(502);
    expect((await down.json()).error.message).toBe("The service is unavailable. Try again.");

    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    const offline = await GET(new Request(`${ORIGIN}/api/public/items`), params("items"));
    expect(offline.status).toBe(502);
  });

  it("answers 503 when BACKEND_API_URL is missing", async () => {
    delete process.env.BACKEND_API_URL;
    vi.stubGlobal("fetch", vi.fn());
    const response = await GET(new Request(`${ORIGIN}/api/public/items`), params("items"));
    expect(response.status).toBe(503);
    expect((await response.json()).error.message).toBe("The service is not configured.");
  });
});
