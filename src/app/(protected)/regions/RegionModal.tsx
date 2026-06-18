"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { ControlledDrawerDialog } from "@/components/ModalDrawer/ModalDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createRegion, updateRegion } from "@/lib/apiActions";
import type { Region } from "@/types/api";

interface RegionModalProps {
  open: boolean;
  onOpenChange: (_value: boolean) => void;
  onSuccess: () => void;
  initialData?: Region | null;
}

const regionSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens only"
    )
    .trim(),
  is_active: z.boolean(),
});

type RegionFormValues = z.infer<typeof regionSchema>;

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function RegionModal({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: RegionModalProps) {
  const isEdit = !!initialData;
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegionFormValues>({
    resolver: zodResolver(regionSchema),
    defaultValues: { name: "", slug: "", is_active: true },
  });

  const isActiveValue = watch("is_active");
  const nameValue = watch("name");

  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        name: initialData.name,
        slug: initialData.slug,
        is_active: initialData.is_active,
      });
    } else {
      reset({ name: "", slug: "", is_active: true });
    }
    setError(null);
  }, [open, initialData, isEdit, reset]);

  // Auto-fill slug from name when creating
  useEffect(() => {
    if (!isEdit) {
      setValue("slug", toSlug(nameValue));
    }
  }, [nameValue, isEdit, setValue]);

  async function onSubmit(data: RegionFormValues) {
    setError(null);
    try {
      if (isEdit && initialData?.id) {
        await updateRegion(initialData.id, data);
      } else {
        await createRegion(data);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <ControlledDrawerDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Region" : "Create New Region"}
      className="sm:max-w-[480px]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="region-name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="region-name"
            {...register("name")}
            placeholder="e.g., Porto"
            disabled={isSubmitting}
          />
          {errors.name && (
            <span className="text-red-500 text-xs">{errors.name.message}</span>
          )}
        </div>

        <div>
          <Label htmlFor="region-slug">
            Slug <span className="text-red-500">*</span>
          </Label>
          <Input
            id="region-slug"
            {...register("slug")}
            placeholder="e.g., porto"
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Auto-generated from name. Used in URLs and the API.
          </p>
          {errors.slug && (
            <span className="text-red-500 text-xs">{errors.slug.message}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="region-active" className="cursor-pointer">
              Active
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inactive regions are hidden from users.
            </p>
          </div>
          <Switch
            id="region-active"
            checked={isActiveValue}
            onCheckedChange={(checked) => setValue("is_active", checked)}
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isEdit ? "Update Region" : "Create Region"}
          </Button>
        </div>
      </form>
    </ControlledDrawerDialog>
  );
}
