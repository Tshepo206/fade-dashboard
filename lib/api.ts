import { createClient } from "@/lib/supabase/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token
          ? {
              Authorization: `Bearer ${session.access_token}`,
            }
          : {}),
        ...(options.headers ?? {}),
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}