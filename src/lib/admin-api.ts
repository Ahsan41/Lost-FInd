import type {
  AdminFoundItem,
  AdminItemStatus,
  ClaimRequest,
  ClaimStatus,
} from "@/types/item";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN";
}

export interface AdminClaim extends ClaimRequest {
  item: {
    id: string;
    name: string;
    category: AdminFoundItem["category"];
    location: string;
    image: string | null;
    reviewStatus: AdminFoundItem["reviewStatus"];
  };
}

export interface AdminOverviewData {
  totalItems: number;
  pendingClaims: number;
  approvedClaims: number;
  itemsReturned: number;
  recentItems: AdminFoundItem[];
  recentClaims: AdminClaim[];
}

interface ApiEnvelope<T> {
  data: T;
}

interface ApiErrorBody {
  error?: { message?: string };
}

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

async function requestData<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AdminApiError("The admin service returned an invalid response.", response.status);
  }

  if (typeof body !== "object" || body === null) {
    throw new AdminApiError("The admin service returned an invalid response.", response.status);
  }
  if (!response.ok) {
    if (response.status === 401 && path !== "auth/me" && path !== "auth/login") {
      window.dispatchEvent(new Event("admin-session-expired"));
    }
    throw new AdminApiError(
      (body as ApiErrorBody).error?.message ?? "The admin request could not be completed.",
      response.status,
    );
  }
  if (!("data" in body)) {
    throw new AdminApiError("The admin service returned an invalid response.", response.status);
  }
  return (body as ApiEnvelope<T>).data;
}

/**
 * Claim evidence is served by the backend only with the admin token, which the
 * browser never holds. Point the image at the admin proxy instead, which adds it.
 */
function proxiedClaimImage(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const match = /\/api\/files\/claims\/([A-Za-z0-9][A-Za-z0-9._-]*)$/.exec(url);
  return match ? `/api/admin/files/claims/${match[1]}` : url;
}

function withProxiedImage(claim: AdminClaim): AdminClaim {
  const supportingImage = proxiedClaimImage(claim.supportingImage);
  return supportingImage ? { ...claim, supportingImage } : claim;
}

export function getAdminErrorMessage(error: unknown): string {
  if (error instanceof AdminApiError) return error.message;
  if (error instanceof TypeError) return "Could not connect to the admin service. Try again.";
  return "An unexpected admin error occurred. Try again.";
}

export const adminApi = {
  login(email: string, password: string) {
    return requestData<{ user: AdminUser }>("auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then(({ user }) => user);
  },
  session() {
    return requestData<AdminUser>("auth/me");
  },
  logout() {
    return requestData<{ loggedOut: true }>("auth/logout", { method: "POST" });
  },
  listItems() {
    return requestData<AdminFoundItem[]>("items");
  },
  listClaims() {
    return requestData<AdminClaim[]>("claims").then((claims) => claims.map(withProxiedImage));
  },
  overview() {
    return requestData<AdminOverviewData>("stats");
  },
  updateItemStatus(itemId: string, reviewStatus: AdminItemStatus) {
    return requestData<AdminFoundItem>(`items/${encodeURIComponent(itemId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ reviewStatus }),
    });
  },
  markItemReturned(itemId: string) {
    return requestData<AdminFoundItem>(`items/${encodeURIComponent(itemId)}/return`, {
      method: "POST",
    });
  },
  updateClaimStatus(claimId: string, status: ClaimStatus) {
    return requestData<AdminClaim>(`claims/${encodeURIComponent(claimId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }).then(withProxiedImage);
  },
};
