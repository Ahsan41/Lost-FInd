import { cookies } from "next/headers";

const sessionCookieName = "lostnfind_admin_session";
const sessionCookiePath = "/api/admin";

type RouteParams = { params: Promise<{ path: string[] }> };

function jsonError(status: number, message: string) {
  return Response.json(
    {
      error: {
        code: status === 401 ? "UNAUTHORIZED" : status === 403 ? "FORBIDDEN" : "ADMIN_API_ERROR",
        message,
      },
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function backendApiUrl(path: string, search = ""): string | null {
  const configuredUrl = process.env.BACKEND_API_URL;
  if (!configuredUrl) return null;

  try {
    const base = new URL(configuredUrl);
    if (!["http:", "https:"].includes(base.protocol) || base.search || base.hash) return null;
    return `${base.toString().replace(/\/+$/, "")}/api/${path}${search}`;
  } catch {
    return null;
  }
}

function isSameOriginMutation(request: Request): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const requestUrl = new URL(request.url);
  const host = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    requestUrl.host
  ).split(",")[0].trim().toLowerCase();
  const protocol = (
    request.headers.get("x-forwarded-proto") ??
    requestUrl.protocol.slice(0, -1)
  ).split(",")[0].trim().toLowerCase();
  try {
    const parsedOrigin = new URL(origin);
    return parsedOrigin.host.toLowerCase() === host && parsedOrigin.protocol === `${protocol}:`;
  } catch {
    return false;
  }
}

function isAllowedRequest(path: string[], method: string): boolean {
  const route = path.join("/");
  if (route === "auth/login" || route === "auth/logout") return method === "POST";
  if (route === "auth/me" || route === "stats" || route === "items" || route === "claims") {
    return method === "GET";
  }
  if (/^items\/[A-Za-z0-9_-]+$/.test(route) || /^claims\/[A-Za-z0-9_-]+$/.test(route)) {
    return method === "GET";
  }
  // Claim evidence lives in a private bucket; the backend only serves it with the admin token.
  if (/^files\/claims\/[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/.test(route)) return method === "GET";
  if (/^items\/[A-Za-z0-9_-]+\/status$/.test(route) || /^claims\/[A-Za-z0-9_-]+\/status$/.test(route)) {
    return method === "PATCH";
  }
  return /^items\/[A-Za-z0-9_-]+\/return$/.test(route) && method === "POST";
}

async function readBackendJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function clearSessionCookie() {
  (await cookies()).set(sessionCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: sessionCookiePath,
    maxAge: 0,
  });
}

async function forward(request: Request, path: string, token?: string): Promise<Response> {
  const url = backendApiUrl(path, new URL(request.url).search);
  if (!url) return jsonError(503, "The admin API is not configured.");

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body: ArrayBuffer | undefined;
  if (!["GET", "HEAD"].includes(request.method)) body = await request.arrayBuffer();

  let response: Response;
  try {
    response = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });
  } catch (error) {
    if (error instanceof TypeError) return jsonError(502, "The admin API is unavailable.");
    throw error;
  }

  if (response.status === 401 || response.status === 403) {
    await clearSessionCookie();
    return jsonError(
      response.status,
      response.status === 401
        ? "Your admin session has expired. Sign in again."
        : "Administrator access is required.",
    );
  }

  if (response.status >= 500) {
    return jsonError(502, "The admin API is unavailable.");
  }

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}

async function handle(request: Request, { params }: RouteParams): Promise<Response> {
  if (!isSameOriginMutation(request)) return jsonError(403, "This request was not accepted.");
  const { path } = await params;
  if (!isAllowedRequest(path, request.method)) return jsonError(404, "Admin endpoint not found.");
  const route = path.join("/");

  if (route === "auth/logout") {
    await clearSessionCookie();
    return Response.json({ data: { loggedOut: true } }, { headers: { "Cache-Control": "no-store" } });
  }

  if (route === "auth/login") {
    const upstream = await forward(request, "auth/login");
    if (!upstream.ok) {
      if (upstream.status === 401) return jsonError(401, "Email or password is incorrect.");
      if (upstream.status >= 500) return jsonError(502, "The admin API is unavailable.");
      return jsonError(upstream.status, "Enter a valid email and password.");
    }

    let payload: unknown;
    try {
      payload = await readBackendJson(upstream);
    } catch {
      return jsonError(502, "The admin API returned an invalid response.");
    }
    const data = isRecord(payload) && isRecord(payload.data) ? payload.data : null;
    const user = data && isRecord(data.user) ? data.user : null;
    const token = data?.token;
    if (!user || typeof user.id !== "string" || typeof user.name !== "string" || typeof user.email !== "string" || typeof token !== "string" || !token) {
      return jsonError(502, "The admin API returned an invalid response.");
    }
    if (user.role !== "ADMIN") {
      return jsonError(403, "These credentials cannot access the admin workspace.");
    }

    (await cookies()).set(sessionCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: sessionCookiePath,
      priority: "high",
    });
    return Response.json(
      { data: { user: { id: user.id, name: user.name, email: user.email, role: "ADMIN" } } },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return jsonError(401, "Sign in to continue.");

  if (route === "auth/me") {
    const upstream = await forward(request, "auth/me", token);
    if (!upstream.ok) return upstream;
    let payload: unknown;
    try {
      payload = await readBackendJson(upstream);
    } catch {
      return jsonError(502, "The admin API returned an invalid response.");
    }
    const data = isRecord(payload) && isRecord(payload.data) ? payload.data : null;
    if (!data || typeof data.id !== "string" || typeof data.name !== "string" || typeof data.email !== "string") {
      return jsonError(502, "The admin API returned an invalid response.");
    }
    if (data.role !== "ADMIN") {
      await clearSessionCookie();
      return jsonError(403, "Administrator access is required.");
    }
    return Response.json(
      { data: { id: data.id, name: data.name, email: data.email, role: "ADMIN" } },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (route.startsWith("files/")) return forward(request, route, token);
  return forward(request, `admin/${route}`, token);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
