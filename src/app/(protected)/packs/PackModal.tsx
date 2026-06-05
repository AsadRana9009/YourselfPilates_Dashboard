/* eslint-disable no-console */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import * as React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { ControlledDrawerDialog } from "@/components/ModalDrawer/ModalDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createPack, Pack, updatePack } from "@/lib/apiActions";

interface PackModalProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: Pack | null;
}

const packSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .trim()
    .refine((val) => val.length > 0, "Title cannot be empty"),
  description: z
    .string()
    .min(1, "Description is required")
    .trim()
    .refine((val) => val.length > 0, "Description cannot be empty"),
  price: z
    .number({ required_error: "Price is required" })
    .positive("Price must be greater than 0"),
  active: z.boolean(),
  is_public: z.boolean(),
  creditHours: z
    .number({ required_error: "Credit Hours is required" })
    .int("Credit Hours must be a whole number")
    .min(0, "Credit Hours must be 0 or greater"),
});

type PackFormValues = z.infer<typeof packSchema>;

export function PackModal({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: PackModalProps) {
  const isEdit = !!initialData;
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PackFormValues>({
    resolver: zodResolver(packSchema),
    defaultValues: isEdit
      ? {
          title: initialData?.title || "",
          description: initialData?.description || "",
          price: initialData?.price ? parseFloat(initialData.price) : 0,
          active: initialData?.active ?? true,
          is_public: initialData?.is_public ?? false,
          creditHours: initialData?.total_hours ?? 0,
        }
      : {
          title: "",
          description: "",
          price: 0,
          active: true,
          is_public: false,
          creditHours: 0,
        },
  });

  const activeValue = watch("active");
  const isPublicValue = watch("is_public");

  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        title: initialData.title || "",
        description: initialData.description || "",
        price: initialData.price ? parseFloat(initialData.price) : 0,
        active: initialData.active ?? true,
        is_public: initialData.is_public ?? false,
        creditHours: initialData.total_hours ?? 0,
      });
      setImagePreview(initialData.image || null);
    } else {
      reset({
        title: "",
        description: "",
        price: 0,
        active: true,
        is_public: false,
        creditHours: 0,
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setError(null);
  }, [open, initialData, reset, isEdit]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setImageFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  async function onSubmit(data: PackFormValues) {
    setError(null);

    // Validate all required fields
    if (!data.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!data.description.trim()) {
      setError("Description is required");
      return;
    }

    if (!data.price || data.price <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    if (data.creditHours < 0) {
      setError("Credit Hours must be 0 or greater");
      return;
    }

    if (!imageFile && !isEdit) {
      setError("Image is required");
      return;
    }

    try {
      const payload = {
        title: data.title.trim(),
        description: data.description.trim(),
        active: data.active,
        is_public: data.is_public,
        price: data.price.toString(),
        total_hours: data.creditHours,
        ...(imageFile && { image: imageFile }),
      };
      console.log("Payload:", payload);
      if (isEdit && initialData?.id) {
        await updatePack(Number(initialData.id), payload);
      } else {
        await createPack(payload);
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
      title={isEdit ? "Edit Pack" : "Create New Pack"}
      className="sm:max-w-[600px]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="title">
            Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="e.g., 1 session/lesson hour"
            disabled={isSubmitting}
            required
          />
          {errors.title && (
            <span className="text-red-500 text-xs">{errors.title.message}</span>
          )}
        </div>

        <div>
          <Label htmlFor="image">
            Image {!isEdit && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isSubmitting}
            className="cursor-pointer"
            required={!isEdit}
          />
          {!isEdit && (
            <span className="text-muted-foreground text-xs mt-1 block">
              Image is required
            </span>
          )}
          {isEdit && !imageFile && !imagePreview && (
            <span className="text-muted-foreground text-xs mt-1 block">
              Select a new image to update, or keep the existing one
            </span>
          )}
          {imagePreview && (
            <div className="mt-4 relative w-full h-48 rounded-md overflow-hidden border">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="One-hour pack for greater scheduling flexibility."
            rows={3}
            disabled={isSubmitting}
            required
          />
          {errors.description && (
            <span className="text-red-500 text-xs">
              {errors.description.message}
            </span>
          )}
        </div>

        <div>
          <Label htmlFor="price">
            Price (€) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0.01"
            {...register("price", { valueAsNumber: true })}
            placeholder="22.00"
            disabled={isSubmitting}
            required
          />
          {errors.price && (
            <span className="text-red-500 text-xs">{errors.price.message}</span>
          )}
        </div>

        <div>
          <Label htmlFor="creditHours">
            Credit Hours <span className="text-red-500">*</span>
          </Label>
          <Input
            id="creditHours"
            type="number"
            step="1"
            min="0"
            {...register("creditHours", { valueAsNumber: true })}
            placeholder="2"
            disabled={isSubmitting}
            required
          />
          {errors.creditHours && (
            <span className="text-red-500 text-xs">
              {errors.creditHours.message}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="active" className="cursor-pointer">
            Active
          </Label>
          <Switch
            id="active"
            checked={activeValue}
            onCheckedChange={(checked) => setValue("active", checked)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="is_public" className="cursor-pointer">
              Public Pack
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visible to all users. Turn off for Pro-only packs.
            </p>
          </div>
          <Switch
            id="is_public"
            checked={isPublicValue}
            onCheckedChange={(checked) => setValue("is_public", checked)}
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
            {isEdit ? "Update Pack" : "Create Pack"}
          </Button>
        </div>
      </form>
    </ControlledDrawerDialog>
  );
}
