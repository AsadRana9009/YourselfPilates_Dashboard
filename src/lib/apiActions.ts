import { useAuthStore } from "@/stores/authStore";
import type { Region } from "@/types/api";
import { PaginatedResponse, PaginatedVideoResponse, Video } from "@/types/api";
import { Order } from "@/types/api";

import { apiFetch } from "./api";

export interface VisitorData {
  date: string;
  count: number;
}

export interface VisitorStats {
  last_7_days: VisitorData[];
  last_30_days: VisitorData[];
  last_3_months: VisitorData[];
}

export interface AnalyticsData {
  total_bookings: number;
  bookings_this_month: number;
  bookings_this_week: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  confirmed_last_7_days: number;
  confirmed_last_30_days: number;
  confirmed_last_3_months: number;
  total_teachers: number;
  active_teachers: number;
  registered_teachers: number;
  total_students: number;
  active_students: number;
  registered_students: number;
  teacher_visitors: VisitorStats;
  student_visitors: VisitorStats;
}

type OrdersResponse = PaginatedResponse<Order>;

export async function cancelBookingById(bookingId: number) {
  return apiFetch(`/booking/bookings/${bookingId}/reject/`, {
    method: "GET",
    credentials: "include", // remove if not needed
  });
}

export async function getAnalytics(): Promise<AnalyticsData> {
  return apiFetch("/dashboard/analytics/");
}

export async function getVideos(): Promise<Video[]> {
  const res: PaginatedVideoResponse = await apiFetch("/dashboard/videos/");
  return res.results;
}

export async function getVideoDetail(id: number): Promise<Video> {
  return apiFetch(`/dashboard/videos/${id}/`);
}

export async function deleteVideo(id: number) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard/videos/${id}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Token ${useAuthStore.getState().token}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete video");
  }

  // DELETE requests often return no content, so don't try to parse JSON
  return response;
}

export async function deleteBooking(id: number) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/booking/bookings/${id}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Token ${useAuthStore.getState().token}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete booking");
  }

  return response;
}

export async function deleteStudent(id: number) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/students/${id}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Token ${useAuthStore.getState().token}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete student");
  }

  return response;
}

export async function deleteProfessor(id: number) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/users/${id}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Token ${useAuthStore.getState().token}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete professor");
  }

  return response;
}

export async function uploadVideo({
  file,
  title,
  description,
}: {
  file: File;
  title: string;
  description: string;
}): Promise<Video> {
  const formData = new FormData();
  formData.append("video_file", file);
  formData.append("title", title);
  formData.append("description", description);

  // Use fetch directly for multipart/form-data
  const { token } = useAuthStore.getState();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard/videos/`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        // 'Content-Type' should NOT be set for FormData
      },
      body: formData,
      credentials: "include",
    }
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to upload video");
  }
  return res.json();
}

export interface PackRegionPrice {
  id: number;
  region: number;
  region_name: string;
  region_slug: string;
  price: string;
}

export interface Pack {
  id: number;
  title: string;
  description: string;
  image: string | null;
  active: boolean;
  is_public: boolean;
  price: string;
  total_hours?: number;
  region?: number | null;
  region_name?: string | null;
  region_prices?: PackRegionPrice[];
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedPackResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Pack[];
}

export interface CreatePackPayload {
  title: string;
  description: string;
  image?: File | string;
  active: boolean;
  is_public: boolean;
  price: string;
  total_hours?: number;
  region?: number | null;
}

export async function getPacks(page = 1): Promise<PaginatedPackResponse> {
  return apiFetch(`/subscriptions/packs/?page=${page}`);
}

export async function getPackById(id: number): Promise<Pack> {
  return apiFetch(`/subscriptions/packs/${id}/`);
}

export async function createPack(
  payload: CreatePackPayload & { image?: File }
): Promise<Pack> {
  const { token } = useAuthStore.getState();
  if (!token) throw new Error("No authentication token");

  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("active", payload.active.toString());
  formData.append("is_public", payload.is_public.toString());
  formData.append("price", payload.price);

  if (payload["total_hours"] !== undefined) {
    formData.append("total_hours", payload["total_hours"].toString());
  }

  if (payload.region !== undefined) {
    formData.append(
      "region",
      payload.region != null ? payload.region.toString() : ""
    );
  }

  if (payload.image instanceof File) {
    formData.append("image", payload.image);
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/packs/`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData,
      credentials: "include",
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create pack");
  }

  return res.json();
}

export async function updatePack(
  id: number,
  payload: Partial<CreatePackPayload> & { image?: File }
): Promise<Pack> {
  const { token } = useAuthStore.getState();
  if (!token) throw new Error("No authentication token");

  const formData = new FormData();

  if (payload.title !== undefined) {
    formData.append("title", payload.title);
  }
  if (payload.description !== undefined) {
    formData.append("description", payload.description);
  }
  if (payload.active !== undefined) {
    formData.append("active", payload.active.toString());
  }
  if (payload.is_public !== undefined) {
    formData.append("is_public", payload.is_public.toString());
  }
  if (payload.price !== undefined) {
    formData.append("price", payload.price);
  }

  if (payload["total_hours"] !== undefined) {
    formData.append("total_hours", payload["total_hours"].toString());
  }

  if (payload.region !== undefined) {
    formData.append(
      "region",
      payload.region != null ? payload.region.toString() : ""
    );
  }

  if (payload.image instanceof File) {
    formData.append("image", payload.image);
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/packs/${id}/`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Token ${token}`,
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData,
      credentials: "include",
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update pack");
  }

  return res.json();
}

export async function deletePack(id: number) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/packs/${id}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Token ${useAuthStore.getState().token}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete pack");
  }

  return response;
}

export async function subscribeToPack(
  packId: number,
  options?: {
    region_id?: number;
    payment_method?: string;
    mbway_phone?: string;
  }
) {
  return apiFetch(`/subscriptions/packs/${packId}/subscribe/`, {
    method: "POST",
    body: JSON.stringify(options ?? {}),
  });
}

// ---------- Region API ----------

export async function getRegions(): Promise<Region[]> {
  const res: PaginatedResponse<Region> = await apiFetch(
    "/subscriptions/regions/"
  );
  return res.results;
}

export async function createRegion(payload: {
  name: string;
  slug: string;
  is_active: boolean;
}): Promise<Region> {
  return apiFetch("/subscriptions/regions/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRegion(
  id: number,
  payload: Partial<{ name: string; slug: string; is_active: boolean }>
): Promise<Region> {
  return apiFetch(`/subscriptions/regions/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteRegion(id: number): Promise<void> {
  const { token } = useAuthStore.getState();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscriptions/regions/${id}/`,
    {
      method: "DELETE",
      headers: { Authorization: `Token ${token}` },
      credentials: "include",
    }
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to delete region");
  }
}

export async function setPackRegionPrices(
  packId: number,
  prices: { region_id: number; price: string }[]
): Promise<Pack> {
  return apiFetch(`/subscriptions/packs/${packId}/set_region_prices/`, {
    method: "POST",
    body: JSON.stringify({ prices }),
  });
}

export async function deleteOrder(orderId: number): Promise<void> {
  return apiFetch(`/subscriptions/orders/${orderId}/`, { method: "DELETE" });
}

export async function getOrders(params?: {
  page?: number;
  ownerRole?: "pro" | "student";
}): Promise<OrdersResponse> {
  const page = params?.page ?? 1;

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  if (params?.ownerRole) {
    qs.set("owner_role", params.ownerRole);
  }

  return apiFetch(`/subscriptions/orders/?${qs.toString()}`, { method: "GET" });
}
