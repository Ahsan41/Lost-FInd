import { itemCategories, type FoundItem, type ItemCategory } from "@/types/item";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export interface ReportItemInput {
  name: string;
  category: ItemCategory | "";
  description: string;
  location: string;
  foundDate: string;
  reporterName: string;
  email: string;
  phone: string;
  whatsapp: string;
}

export interface ClaimInput {
  name: string;
  email: string;
  phone: string;
  description: string;
  proof: string;
}

export class PublicApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = "PublicApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function postForm<T>(path: string, form: FormData, hasId: (data: unknown) => data is T): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/public/${path}`, {
      method: "POST",
      body: form,
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new PublicApiError("Could not connect to the service. Please try again.", 0);
    }
    throw error;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new PublicApiError("The service returned an invalid response.", response.status);
  }

  if (!isRecord(payload)) {
    throw new PublicApiError("The service returned an invalid response.", response.status);
  }
  if (!response.ok) {
    const error = isRecord(payload.error) ? payload.error : null;
    const rawFields = error && isRecord(error.fields) ? error.fields : {};
    const fields = Object.fromEntries(
      Object.entries(rawFields).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
    const message = error && typeof error.message === "string"
      ? error.message
      : "The request could not be completed. Please try again.";
    throw new PublicApiError(message, response.status, fields);
  }

  if (!hasId(payload.data)) {
    throw new PublicApiError("The service returned an invalid response.", response.status);
  }
  return payload.data;
}

function isCreatedItem(data: unknown): data is { id: string } {
  return isRecord(data) && typeof data.id === "string" && data.id.length > 0;
}

function isCreatedClaim(data: unknown): data is { id: string; status: string } {
  return isRecord(data) &&
    typeof data.id === "string" &&
    data.id.length > 0 &&
    typeof data.status === "string";
}

function isFoundItem(data: unknown): data is FoundItem {
  return isRecord(data) &&
    typeof data.id === "string" &&
    typeof data.name === "string" &&
    itemCategories.some((category) => category === data.category) &&
    typeof data.description === "string" &&
    typeof data.location === "string" &&
    typeof data.foundDate === "string" &&
    (typeof data.image === "string" || data.image === null) &&
    (data.status === "Waiting for owner" || data.status === "Reunited");
}

export function getApiFieldErrors<K extends string>(
  error: unknown,
  keys: readonly K[],
): Partial<Record<K, string>> {
  if (!(error instanceof PublicApiError)) return {};
  const fields: Partial<Record<K, string>> = {};
  for (const key of keys) {
    const message = error.fields[key];
    if (message) fields[key] = message;
  }
  return fields;
}

export function getPublicApiErrorMessage(error: unknown): string {
  if (error instanceof PublicApiError) return error.message;
  return "An unexpected error occurred. Please try again.";
}

export const publicApi = {
  async listFoundItems(): Promise<FoundItem[]> {
    let response: Response;
    try {
      response = await fetch("/api/public/items?limit=100", {
        cache: "no-store",
        credentials: "same-origin",
      });
    } catch (error) {
      if (error instanceof TypeError) {
        throw new PublicApiError("Could not connect to the service. Please try again.", 0);
      }
      throw error;
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new PublicApiError("The service returned an invalid response.", response.status);
    }

    if (!isRecord(payload)) {
      throw new PublicApiError("The service returned an invalid response.", response.status);
    }
    if (!response.ok) {
      const error = isRecord(payload.error) ? payload.error : null;
      const message = error && typeof error.message === "string"
        ? error.message
        : "The items could not be loaded. Please try again.";
      throw new PublicApiError(message, response.status);
    }

    if (!Array.isArray(payload.data) || !payload.data.every(isFoundItem)) {
      throw new PublicApiError("The service returned an invalid response.", response.status);
    }
    if (typeof payload.total !== "number" || !Number.isInteger(payload.total) || payload.total < 0) {
      throw new PublicApiError("The service returned an invalid response.", response.status);
    }
    if (payload.total > payload.data.length) {
      throw new PublicApiError("The service did not return all available items. Please try again later.", response.status);
    }
    return payload.data;
  },
  submitFoundItem(values: ReportItemInput, image: File | null) {
    const form = new FormData();
    for (const [key, value] of Object.entries(values)) form.append(key, value);
    if (image) form.append("image", image);
    return postForm("items", form, isCreatedItem);
  },
  submitClaim(itemId: string, values: ClaimInput, image: File | null) {
    const form = new FormData();
    for (const [key, value] of Object.entries(values)) form.append(key, value);
    if (image) form.append("supportingImage", image);
    return postForm(`items/${encodeURIComponent(itemId)}/claims`, form, isCreatedClaim);
  },
};
