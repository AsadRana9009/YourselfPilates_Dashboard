export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Student {
  id: number;
  email: string;
  full_name: string;
  role: string;
  bio: string | null;
  contact_number: string | null;
  photo: string | null;
}

export interface Professor {
  id?: number;
  name?: string;
  email: string;
  password?: string;
  full_name: string;
  role?: string;
  bio?: string | null;
  contact_number?: string | null;
  photo?: string | null;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  student_ids?: number[];
  students?: Student[];
  is_active?: boolean;
  is_public?: boolean;
  total_purchased_hours?: number | string;
  remaining_hours?: number;
  used_hours?: number;
}

export interface Slot {
  value: string;
  display: string;
}

export interface Booking {
  id: number;
  title: string;
  booking_type: "pro" | "public";
  professor_details: Professor;
  booking_date: string;
  time_slot: string;
  time_slot_display?: string;
  status: "pending" | "confirmed" | "cancelled";
  total_students?: number;
  notes?: string;
  students: number[] | Student[];
  created_at: string;
  updated_at?: string;
  approve: boolean;
  student_details?: { id: number; full_name: string; email: string }[];
}

export interface Video {
  id: number;
  uploaded_by: number;
  video_file: string;
  title: string;
  description: string;
  uploaded_at: string;
}

export interface PaginatedVideoResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Video[];
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  role?: string;
}

export interface Pack {
  id: number;
  title: string;
  description?: string;
  price: string;
  total_hours: number;
  target_role?: "professor" | "student";
  active?: boolean;
  is_public?: boolean;
}

export interface Order {
  id: number;
  user_name: string;
  user_email: string;
  pack_details: {
    title: string;
    total_hours: number;
  };
  amount: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
}
