import { MAX_IMAGE_BYTES } from "@/lib/public-api";

type RouteParams = { params: Promise<{ path: string[] }> };

const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 64 * 1024;

function jsonError(status: number, message: string) {
  return Response.json(
    { error: { code: status === 503 ? "API_UNAVAILABLE" : "REQUEST_REJECTED", message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function backendUrl(path: string): string | null {
  const configuredUrl = process.env.BACKEND_API_URL;
  if (!configuredUrl) return null;

  try {
    const base = new URL(configuredUrl);
    if (!["http:", "https:"].includes(base.protocol) || base.search || base.hash) return null;
    return `${base.toString().replace(/\/+$/, "")}/api/${path}`;
  } catch {
    return null;
  }
}

function isSameOrigin(request: Request): boolean {
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

function allowedBackendPath(path: string[]): string | null {
  if (path.length === 1 && path[0] === "items") return "items";
  if (
    path.length === 3 &&
    path[0] === "items" &&
    /^[A-Za-z0-9_-]+$/.test(path[1]) &&
    path[2] === "claims"
  ) {
    return `items/${encodeURIComponent(path[1])}/claims`;
  }
  return null;
}

async function post(request: Request, { params }: RouteParams): Promise<Response> {
  if (!isSameOrigin(request)) return jsonError(403, "This request was not accepted.");

  const path = allowedBackendPath((await params).path);
  if (!path) return jsonError(404, "Public endpoint not found.");
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")) {
    return jsonError(415, "Submit the form as multipart data.");
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return jsonError(413, "The uploaded image must be smaller than 8 MB.");
  }

  const url = backendUrl(path);
  if (!url) return jsonError(503, "The service is not configured.");

  const headers = new Headers({ "Content-Type": request.headers.get("content-type")! });
  const init: RequestInit & { duplex: "half" } = {
    method: "POST",
    headers,
    body: request.body,
    cache: "no-store",
    redirect: "manual",
    duplex: "half",
  };

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    if (error instanceof TypeError) return jsonError(502, "The service is unavailable. Try again.");
    throw error;
  }

  if (response.status >= 500) return jsonError(502, "The service is unavailable. Try again.");
  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}

async function get(request: Request, { params }: RouteParams): Promise<Response> {
  const path = allowedBackendPath((await params).path);
  if (path !== "items") return jsonError(404, "Public endpoint not found.");

  const url = backendUrl(path);
  if (!url) return jsonError(503, "The service is not configured.");

  const upstreamUrl = new URL(url);
  upstreamUrl.search = new URL(request.url).search;

  let response: Response;
  try {
    response = await fetch(upstreamUrl, { cache: "no-store", redirect: "manual" });
  } catch (error) {
    if (error instanceof TypeError) return jsonError(502, "The service is unavailable. Try again.");
    throw error;
  }

  if (response.status >= 500) return jsonError(502, "The service is unavailable. Try again.");
  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export const GET = get;
export const POST = post;
