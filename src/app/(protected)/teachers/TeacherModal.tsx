"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { ControlledDrawerDialog } from "@/components/ModalDrawer/ModalDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { Professor } from "@/types/api";

interface TeacherModalProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: Professor | null;
}

const KNOWN_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "protonmail.com",
  "googlemail.com",
  "live.com",
  "ymail.com",
];

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0
    )
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function suggestDomain(email: string): string | null {
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return null;
  const domain = email.slice(atIndex + 1).toLowerCase();

  if (KNOWN_DOMAINS.includes(domain)) return null;
  if (domain.length < 6) return null;

  let best: string | null = null;
  let bestDist = Infinity;

  for (const known of KNOWN_DOMAINS) {
    const dist = levenshtein(domain, known);
    const threshold = Math.max(2, Math.floor(known.length * 0.35));
    if (dist <= threshold && dist < bestDist) {
      best = known;
      bestDist = dist;
    }
  }
  return best;
}

const emailRule = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address (e.g. name@domain.com)")
  .superRefine((email, ctx) => {
    const suggestion = suggestDomain(email);
    if (suggestion) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Did you mean @${suggestion}? Please double-check your email.`,
      });
    }
  });

const commonSchema = z.object({
  email: emailRule,
  full_name: z.string().min(1, "Full name is required").trim(),
  contact_number: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipcode: z.string().optional(),
});

const editSchema = commonSchema.extend({
  password: z
    .union([z.string().min(6, "Password must be at least 6 characters"), z.literal("")])
    .optional(),
});

type FormValues = z.infer<typeof editSchema>;

const emptyValues: FormValues = {
  email: "",
  password: "",
  full_name: "",
  contact_number: "",
  street: "",
  city: "",
  state: "",
  country: "",
  zipcode: "",
};

function toFormValues(p: Professor): FormValues {
  return {
    email: p.email ?? "",
    password: "",
    full_name: p.full_name ?? "",
    contact_number: p.contact_number ?? "",
    street: p.street ?? "",
    city: p.city ?? "",
    state: p.state ?? "",
    country: p.country ?? "",
    zipcode: p.zipcode ?? "",
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-red-500 text-xs mt-1">{message}</p>;
}

export function TeacherModal({ open, onOpenChange, onSuccess, initialData }: TeacherModalProps) {
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editSchema),
    mode: "onBlur",
    defaultValues: emptyValues as FormValues,
  });

  useEffect(() => {
    reset((isEdit && initialData ? toFormValues(initialData) : emptyValues) as FormValues);
  }, [open, initialData, isEdit, reset]);

  async function onSubmit(data: FormValues) {
    const payload: Record<string, unknown> = {
      email: data.email,
      full_name: data.full_name.trim(),
      role: "professor",
      contact_number: data.contact_number || "",
      street: data.street || "",
      city: data.city || "",
      state: data.state || "",
      country: data.country || "",
      zipcode: data.zipcode || "",
    };
    if (data.password) payload.password = data.password;

    try {
      if (isEdit) {
        await apiFetch(`/user/users/${initialData?.id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Professor updated successfully");
      } else {
        await apiFetch("/user/users/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Professor created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const apiErr = err as Error & { data?: Record<string, unknown> };
      const rawData = apiErr.data;

      const FIELD_MAP = ["email", "full_name", "password", "contact_number", "city", "country", "state", "zipcode", "street"] as const;

      let mappedAny = false;
      if (rawData && typeof rawData === "object") {
        for (const field of FIELD_MAP) {
          const msgs = rawData[field];
          if (Array.isArray(msgs) && msgs.length > 0) {
            setError(field, { message: (msgs as string[]).join(" ") });
            mappedAny = true;
          }
        }
      }

      if (!mappedAny) {
        setError("root", {
          message: apiErr.message || "Something went wrong. Please try again.",
        });
      }
    }
  }

  return (
    <ControlledDrawerDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Professor" : "Add Professor"}
      className="sm:max-w-[560px]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

        {errors.root && (
          <div className="flex items-start gap-3 rounded-md border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3">
            <AlertCircleIcon className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{errors.root.message}</p>
          </div>
        )}
        <div>
          <Label htmlFor="full_name">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="full_name"
            placeholder="e.g. Maria Silva"
            disabled={isSubmitting}
            {...register("full_name")}
            className={errors.full_name ? "border-red-500 focus-visible:ring-red-400" : ""}
          />
          <FieldError message={errors.full_name?.message} />
        </div>
        <div>
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="e.g. professor@example.com"
            disabled={isEdit || isSubmitting}
            {...register("email")}
            className={errors.email ? "border-red-500 focus-visible:ring-red-400" : ""}
          />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="password">
            {isEdit ? "New Password" : "Password"}{" "}
            {!isEdit && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="password"
            type="password"
            placeholder={isEdit ? "Leave blank to keep current password" : "Min. 6 characters"}
            disabled={isSubmitting}
            {...register("password")}
            className={errors.password ? "border-red-500 focus-visible:ring-red-400" : ""}
          />
          <FieldError message={errors.password?.message} />
        </div>
        <div>
          <Label htmlFor="contact_number">Contact Number</Label>
          <Input
            id="contact_number"
            placeholder="e.g. +351 912 345 678"
            disabled={isSubmitting}
            {...register("contact_number")}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              placeholder="e.g. Portugal"
              disabled={isSubmitting}
              {...register("country")}
            />
          </div>
          <div>
            <Label htmlFor="state">State / Region</Label>
            <Input
              id="state"
              placeholder="e.g. Leiria"
              disabled={isSubmitting}
              {...register("state")}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="e.g. Caldas da Rainha"
              disabled={isSubmitting}
              {...register("city")}
            />
          </div>
          <div>
            <Label htmlFor="zipcode">Zipcode</Label>
            <Input
              id="zipcode"
              placeholder="e.g. 2500-001"
              disabled={isSubmitting}
              {...register("zipcode")}
            />
            <FieldError message={errors.zipcode?.message} />
          </div>
        </div>

        <div>
          <Label htmlFor="street">Street</Label>
          <Input
            id="street"
            placeholder="e.g. Rua das Flores, 12"
            disabled={isSubmitting}
            {...register("street")}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Saving..." : "Creating..."}
              </>
            ) : (
              isEdit ? "Save Changes" : "Create Professor"
            )}
          </Button>
        </div>
      </form>
    </ControlledDrawerDialog>
  );
}
