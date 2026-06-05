import { RequestInit } from "next/dist/server/web/spec-extension/request";

import { useAuthStore } from "@/stores/authStore";

type ApiFetchOptions = RequestInit;

export async function apiFetch<T>(url: string, options: ApiFetchOptions = {}) {
  const { token, logout } = useAuthStore.getState();

  if (!token) {
    logout();
    throw new Error("No authentication token");
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  // Handle 401 Unauthorized
  if (res.status === 401) {
    logout();
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));

    let errorMessage = "Something went wrong. Please try again.";

    if (error.message) {
      errorMessage = error.message;
    } else if (error.non_field_errors?.length) {
      errorMessage = (error.non_field_errors as string[]).join(". ");
    } else if (error.detail) {
      errorMessage =
        typeof error.detail === "string"
          ? error.detail
          : JSON.stringify(error.detail);
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (typeof error === "object" && error !== null) {
      const fieldMessages = Object.entries(error)
        .filter(([, v]) => Array.isArray(v))
        .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
        .join("; ");
      if (fieldMessages) errorMessage = fieldMessages;
    }

    const apiError = new Error(errorMessage) as Error & { data?: unknown };
    apiError.data = error;
    throw apiError;
  }
  return res.json() as Promise<T>;
}
