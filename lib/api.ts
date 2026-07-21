import { createClient } from "@/lib/supabase/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getErrorMessage(
  payload: unknown,
  fallback: string
): string {
  if (
    typeof payload === "object" &&
    payload !== null
  ) {
    if (
      "detail" in payload &&
      typeof payload.detail === "string"
    ) {
      return payload.detail;
    }

    if (
      "message" in payload &&
      typeof payload.message === "string"
    ) {
      return payload.message;
    }
  }

  return fallback;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not configured."
    );
  }

  const supabase = createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(
      `Could not read the authentication session: ${sessionError.message}`
    );
  }

  if (!session?.access_token) {
    throw new Error(
      "Authentication session was not found. Please log in again."
    );
  }

  const headers = new Headers(options.headers);

  headers.set(
    "Authorization",
    `Bearer ${session.access_token}`
  );

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const response = await fetch(
    `${API_BASE_URL}${normalizedEndpoint}`,
    {
      ...options,
      headers,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const fallbackMessage =
      `Request failed with status ${response.status}.`;

    let errorMessage = fallbackMessage;

    try {
      const payload: unknown = await response.json();

      errorMessage = getErrorMessage(
        payload,
        fallbackMessage
      );
    } catch {
      const responseText = await response.text();

      if (responseText.trim()) {
        errorMessage = responseText;
      }
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}