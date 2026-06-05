"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { ControlledDrawerDialog } from "@/components/ModalDrawer/ModalDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { TableLoader } from "@/components/ui/TableLoader";
import { apiFetch } from "@/lib/api";
import { getTodayDateString } from "@/lib/utils";
import { Booking, Professor, Slot, Student } from "@/types/api";

const bookingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  booking_type: z.enum(["pro", "public"]),
  professor: z.number({ required_error: "Professor is required" }),
  students: z.array(z.number()).min(1, "Select at least one student"),
  booking_date: z.string().min(1, "Booking date is required"),
  time_slot: z.string().min(1, "Time slot is required"),
  notes: z.string().optional(),
  status: z.enum(["pending", "confirmed", "cancelled"]),
  // approve: z.boolean().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  open: boolean;
  // eslint-disable-next-line
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: Booking | null;
  defaultBookingType?: "pro" | "public";
}

export function BookingModal({
  open,
  onOpenChange,
  onSuccess,
  initialData,
  defaultBookingType = "pro",
}: BookingModalProps) {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingProfessors, setLoadingProfessors] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Track if the professor was changed by the user
  const initialProfessorRef = React.useRef<number | null>(null);
  const initialStudentsSetRef = React.useRef(false);

  const defaultValues: BookingFormValues = useMemo(
    () =>
      initialData
        ? {
            title: initialData.title || "",
            booking_type: initialData.booking_type || defaultBookingType,
            professor: initialData.professor_details?.id || 0,
            students:
              initialData.student_details &&
              Array.isArray(initialData.student_details)
                ? (initialData.student_details as { id: number }[]).map(
                    (s) => s.id
                  )
                : [],
            booking_date: initialData.booking_date || "",
            time_slot: initialData.time_slot || "",
            notes: initialData.notes || "",
            status: initialData.status || "confirmed",
          }
        : {
            title: "",
            booking_type: defaultBookingType,
            professor: 0,
            students: [],
            booking_date: "",
            time_slot: "",
            notes: "",
            status: "confirmed",
          },
    [initialData, defaultBookingType]
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues,
  });

  // Watch booking_date and professor for slot and student fetching
  const bookingDate = watch("booking_date");
  const selectedProfessor = watch("professor");

  // Fetch professors on mount
  useEffect(() => {
    setLoadingProfessors(true);
    apiFetch<unknown>("/user/users/?role=professor&show_all=true")
      .then((res) => {
        if (Array.isArray(res)) {
          setProfessors(res as Professor[]);
        } else if (
          res &&
          typeof res === "object" &&
          Array.isArray((res as { results?: unknown }).results)
        ) {
          setProfessors((res as { results: Professor[] }).results);
        } else {
          setProfessors([]);
        }
      })
      .catch(() => setProfessors([]))
      .finally(() => setLoadingProfessors(false));
  }, []);

  // Fetch students when professor changes
  useEffect(() => {
    if (!selectedProfessor) {
      setStudents([]);
      setValue("students", []);
      initialProfessorRef.current = null;
      initialStudentsSetRef.current = false;
      return;
    }
    setLoadingStudents(true);
    apiFetch<Student[]>(
      `/user/students/by-professor/?professor_id=${selectedProfessor}`
    )
      .then((res) => {
        setStudents(res || []);
        // Only set students on first load for edit mode
        if (
          initialData &&
          initialData.professor_details?.id === selectedProfessor &&
          !initialStudentsSetRef.current &&
          initialData.student_details &&
          Array.isArray(initialData.student_details)
        ) {
          setValue(
            "students",
            (initialData.student_details as { id: number }[]).map((s) => s.id)
          );
          initialStudentsSetRef.current = true;
        } else if (
          initialProfessorRef.current !== null &&
          initialProfessorRef.current !== selectedProfessor
        ) {
          // Professor changed by user, clear students
          setValue("students", []);
        }
        // Set the initial professor ref if not set
        if (initialProfessorRef.current === null) {
          initialProfessorRef.current = selectedProfessor;
        }
      })
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [selectedProfessor, setValue, initialData]);

  // Fetch slots when booking_date changes
  useEffect(() => {
    if (!bookingDate) return setSlots([]);
    setLoadingSlots(true);
    apiFetch<Slot[]>(`/booking/bookings/available_slots/?date=${bookingDate}`)
      .then((res) => setSlots(res))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [bookingDate]);

  // Reset form when opening for add/edit
  useEffect(() => {
    reset(defaultValues);
    setError(null);
    setSuccess(false);
  }, [initialData, open, reset, defaultValues]);

  async function onSubmit(data: BookingFormValues) {
    setError(null);
    setFormLoading(true);
    try {
      const payload = {
        ...data,
        professor: data.professor,
        students: data.students,
      };
      if (initialData) {
        await apiFetch(`/booking/bookings/${initialData.id}/`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/booking/bookings/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setSuccess(true);
      onSuccess();
      onOpenChange(false);
      // eslint-disable-next-line
    } catch (err: any) {
      setError(err.message || "Failed to save booking");
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <ControlledDrawerDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initialData ? "Edit Booking" : "Add Booking"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input {...register("title")} disabled={formLoading} />
          {errors.title && (
            <span className="text-red-500 text-xs">{errors.title.message}</span>
          )}
        </div>
        <div>
          <Label>Booking Type</Label>
          <Controller
            control={control}
            name="booking_type"
            render={({ field }) => (
              <select
                {...field}
                className="w-full border rounded px-3 py-2 dark:bg-black"
                disabled={formLoading}
              >
                <option value="pro" className="dark:bg-black">Pro (Professor)</option>
                <option value="public" className="dark:bg-black">Public (Student)</option>
              </select>
            )}
          />
        </div>
        <div>
          <Label>Professor</Label>
          {loadingProfessors ? (
            <TableLoader />
          ) : (
            <Controller
              control={control}
              name="professor"
              render={({ field }) => (
                <select
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  className="w-full border rounded px-3 py-2 dark:bg-black"
                  disabled={formLoading}
                >
                  <option value="" className="dark:bg-black">
                    Select Professor
                  </option>
                  {professors.map((prof) => (
                    <option
                      key={prof.id}
                      value={prof.id}
                      className="dark:bg-black"
                    >
                      {prof.full_name}
                    </option>
                  ))}
                </select>
              )}
            />
          )}
          {errors.professor && (
            <span className="text-red-500 text-xs">
              {errors.professor.message as string}
            </span>
          )}
        </div>
        <div>
          <Label>Students</Label>
          {loadingStudents ? (
            <TableLoader />
          ) : (
            <Controller
              control={control}
              name="students"
              render={({ field }) => (
                <MultiSelect
                  options={students.map((student) => ({
                    label: student.full_name,
                    value: student.id,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={
                    selectedProfessor
                      ? "Select students..."
                      : "Select a professor first"
                  }
                  disabled={formLoading || !selectedProfessor}
                />
              )}
            />
          )}
          {errors.students && (
            <span className="text-red-500 text-xs">
              {errors.students.message as string}
            </span>
          )}
        </div>
        <div>
          <Label>Booking Date</Label>
          <Input
            type="date"
            {...register("booking_date")}
            disabled={formLoading}
            min={getTodayDateString()}
          />
          {errors.booking_date && (
            <span className="text-red-500 text-xs">
              {errors.booking_date.message}
            </span>
          )}
        </div>
        <div>
          <Label>Time Slot</Label>
          {loadingSlots ? (
            <TableLoader />
          ) : (
            <Controller
              control={control}
              name="time_slot"
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full border rounded px-3 py-2 dark:bg-black"
                  disabled={formLoading || !bookingDate}
                >
                  <option value="" className="dark:bg-black">
                    {initialData ? initialData.time_slot : "Select Time Slot"}
                  </option>
                  {slots.map((slot) => (
                    <option
                      key={slot.value}
                      value={slot.value}
                      className="dark:bg-black"
                    >
                      {slot.display}
                    </option>
                  ))}
                </select>
              )}
            />
          )}
          {errors.time_slot && (
            <span className="text-red-500 text-xs">
              {errors.time_slot.message}
            </span>
          )}
        </div>
        <div>
          <Label>Notes</Label>
          <textarea
            {...register("notes")}
            className="w-full border rounded px-3 py-2"
            disabled={formLoading}
          />
        </div>
        {/* <div>
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <select
                {...field}
                className="w-full border rounded px-3 py-2"
                disabled={formLoading}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}
          />
          {errors.status && (
            <span className="text-red-500 text-xs">
              {errors.status.message}
            </span>
          )}
        </div> */}
        {/* <div className="flex items-center gap-2">
          <input type="checkbox" {...register("approve")} disabled={formLoading} id="approve" />
          <Label htmlFor="approve">Approved</Label>
        </div> */}
        <Button
          type="submit"
          disabled={isSubmitting || formLoading}
          className="w-full cursor-pointer"
        >
          {formLoading ? "Saving..." : initialData ? "Save" : "Add"}
        </Button>
        {error && <div className="text-red-500 text-center">{error}</div>}
        {success && (
          <div className="text-green-600 text-center">
            Booking saved successfully!
          </div>
        )}
      </form>
    </ControlledDrawerDialog>
  );
}
