/* eslint-disable no-console */
"use client";
import { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { useEffect, useState } from "react";

import { ControlledDrawerDialog } from "@/components/ModalDrawer/ModalDrawer";
import { Button } from "@/components/ui/button";
import { TableLoader } from "@/components/ui/TableLoader";
import { apiFetch } from "@/lib/api";

// Define types based on the API response
interface ProfessorDetails {
  id: number;
  full_name: string;
  email: string;
}

interface StudentDetails {
  id: number;
  full_name: string;
  email: string;
}

interface BookingEvent {
  id: number;
  title: string | null;
  booking_date: string;
  time_slot: string;
  approve: boolean;
  status: "confirmed" | "cancelled";
  total_students: number;
  notes: string;
  created_at: string;
  updated_at: string;
  visited: boolean;
  professor_details: ProfessorDetails;
  student_details: StudentDetails[];
}

// Define a type for calendar events
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  status: "confirmed" | "cancelled" | "approved";
  color?: string;
  backgroundColor?: string;
  extendedProps: {
    bookingId: number;
    professor: string;
    students: StudentDetails[];
    timeSlot: string;
    notes?: string;
    approved: boolean;
  };
}

// Only two colors: green for confirmed/approved, red for cancelled
function getEventColors(event: CalendarEvent): {
  color?: string;
  backgroundColor?: string;
} {
  if (event.status !== "cancelled") {
    return { color: "#4caf50", backgroundColor: "#c8e6c9" };
  } else {
    return { color: "#f44336", backgroundColor: "#ffcdd2" };
  }
}

function formatBookingToCalendarEvent(booking: BookingEvent): CalendarEvent {
  // Show only booking title or professor name
  const title =
    booking.title && booking.title.trim()
      ? booking.title
      : booking.professor_details.full_name;

  // Format the date and time for the calendar
  const startDate = new Date(booking.booking_date);
  const [startTime] = booking.time_slot.split(" - ");
  const [hours, minutes] = startTime.split(":");
  startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  // Determine status: cancelled, approved, or confirmed
  let status: "confirmed" | "cancelled" | "approved";
  if (booking.status === "cancelled") {
    status = "cancelled";
  } else if (booking.approve) {
    status = "approved";
  } else {
    status = "confirmed";
  }

  const event: CalendarEvent = {
    id: booking.id.toString(),
    title: title,
    start: startDate.toISOString(),
    status: status,
    extendedProps: {
      bookingId: booking.id,
      professor: booking.professor_details.full_name,
      students: booking.student_details,
      timeSlot: booking.time_slot,
      notes: booking.notes,
      approved: booking.approve,
    },
  };

  return {
    ...event,
    ...getEventColors(event),
  };
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CalendarEvent | null>(
    null
  );
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBookings() {
      setLoading(true);
      setError(null);
      try {
        const response: BookingEvent[] = await apiFetch(
          "/booking/bookings/filter_bookings/"
        );
        const calendarEvents = response.map(formatBookingToCalendarEvent);
        setEvents(calendarEvents);
      } catch (e) {
        console.error("Failed to load bookings:", e);
        setError("Failed to load bookings. Please try again.");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  const handleDateClick = (arg: DateClickArg) => {
    console.log("Date Clicked:", arg.dateStr);
    // TODO: Open booking modal for the selected date
  };

  const handleEventClick = (arg: EventClickArg) => {
    const event = arg.event;
    // Determine status for event click as well
    let status: "confirmed" | "cancelled" | "approved";
    if (event.extendedProps.status) {
      status = event.extendedProps.status;
    } else if (event.extendedProps.approved) {
      status = "approved";
    } else if (event.backgroundColor === "#c8e6c9") {
      status = "confirmed";
    } else {
      status = "cancelled";
    }
    setSelectedBooking({
      id: event.id,
      title: event.title,
      start: event.startStr,
      status: status,
      color: event.backgroundColor === "#c8e6c9" ? "#4caf50" : "#f44336",
      backgroundColor: event.backgroundColor,
      extendedProps: event.extendedProps as CalendarEvent["extendedProps"],
    });
    setDrawerOpen(true);
  };
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      await apiFetch(
        `/booking/bookings/${selectedBooking.extendedProps.bookingId}/reject/`,
        {
          method: "GET",
          credentials: "include", // remove if not needed
        }
      );

      setDrawerOpen(false);
      // Refresh events
      const bookingsResponse: BookingEvent[] = await apiFetch(
        "/booking/bookings/filter_bookings/"
      );
      const calendarEvents = bookingsResponse.map(formatBookingToCalendarEvent);
      setEvents(calendarEvents);
    } catch (e: unknown) {
      setCancelError(
        e instanceof Error ? e.message : "Failed to cancel booking"
      );
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <TableLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      {/* Custom style for FullCalendar header buttons */}
      <style>{`
        .fc .fc-button {
          background-color: #004481 !important;
          border-color: #004481 !important;
          color: #fff !important;
        }
        .fc .fc-button:hover, .fc .fc-button:focus {
          background-color: #003366 !important;
          border-color: #003366 !important;
        }
        .fc .fc-event {
          cursor: pointer;
        }
        .fc .fc-event-title {
          font-weight: 500;
        }
.fc-col-header-cell[role="columnheader"]{
  background-color: #004481 !important;
  color: #ffffff !important;
}
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek,dayGridDay",
        }}
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        height="auto"
        eventDisplay="block"
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: false,
          hour12: false,
        }}
      />
      <ControlledDrawerDialog
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Booking Details"
        className="max-w-md"
      >
        {selectedBooking && (
          <div className="flex flex-col gap-4 p-4">
            <div>
              <div className="font-semibold text-lg mb-2">
                {selectedBooking.title}
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                <span className="font-medium">Professor:</span>{" "}
                {selectedBooking.extendedProps.professor}
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                <span className="font-medium">Time Slot:</span>{" "}
                {selectedBooking.extendedProps.timeSlot}
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                <span className="font-medium">Status:</span>{" "}
                {selectedBooking.status}
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                <span className="font-medium">Notes:</span>{" "}
                {selectedBooking.extendedProps.notes || "-"}
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                <span className="font-medium">Students:</span>{" "}
                {selectedBooking.extendedProps.students
                  .map((s) => s.full_name)
                  .join(", ")}
              </div>
            </div>
            {cancelError && (
              <div className="text-red-500 text-sm">{cancelError}</div>
            )}
            <Button
              variant="destructive"
              className="w-full mt-4"
              onClick={handleCancelBooking}
              disabled={cancelLoading || selectedBooking.status === "cancelled"}
            >
              {cancelLoading
                ? "Cancelling..."
                : selectedBooking.status === "cancelled"
                  ? "Already Cancelled"
                  : "Cancel Booking"}
            </Button>
          </div>
        )}
      </ControlledDrawerDialog>
    </div>
  );
}
