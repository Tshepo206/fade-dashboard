"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  Scissors,
  Search,
  UserRound,
  X,
} from "lucide-react";


type CalendarView =
  | "day"
  | "week"
  | "month";

type CalendarSlot = {
  slot_id: number;
  slot_datetime: string;
  status:
    | "AVAILABLE"
    | "BOOKED"
    | "BLOCKED"
    | string;
  booking_id: number | null;
  blocked_reason: string | null;
  customer_name: string | null;
  service_name: string | null;
};

type Customer = {
  id?: number;
  client_id?: number;
  first_name?: string | null;
  customer_name?: string | null;
  phone_number?: string | null;
  email?: string | null;
  notes?: string | null;
};

type Service = {
  id?: number;
  service_id?: number;
  name?: string | null;
  service_name?: string | null;
  price?: number | null;
  duration_minutes?: number | null;
  is_active?: boolean;
};

type CustomersResponse = {
  success?: boolean;
  customers?: Customer[];
  detail?: string;
};

type ServicesResponse = {
  success?: boolean;
  services?: Service[];
  detail?: string;
};

type ManualBookingResponse = {
  success?: boolean;
  message?: string;
  booking?: {
    booking_id?: number;
    id?: number;
    appointment_timestamp?: string;
    appointment_datetime?: string;
  } | null;
  customer?: unknown;
  service?: unknown;
  detail?: string;
};

type AvailableSlotsResponse = {
  success?: boolean;
  slots?: CalendarSlot[];
  detail?: string;
};

type BookingForm = {
  selected_customer_id: string;
  customer_name: string;
  phone_number: string;
  customer_email: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  customer_notes: string;
};

function getTodayInputDate() {
  const now = new Date();
  const timezoneOffset =
    now.getTimezoneOffset() * 60_000;

  return new Date(
    now.getTime() - timezoneOffset
  )
    .toISOString()
    .slice(0, 10);
}

function createEmptyBookingForm(
  selectedDate: string
): BookingForm {
  return {
    selected_customer_id: "",
    customer_name: "",
    phone_number: "",
    customer_email: "",
    service_id: "",
    appointment_date: selectedDate,
    appointment_time: "09:00",
    customer_notes: "",
  };
}

function getCustomerId(
  customer: Customer
) {
  return String(
    customer.id ??
      customer.client_id ??
      ""
  );
}

function getCustomerName(
  customer: Customer
) {
  return (
    customer.first_name?.trim() ||
    customer.customer_name?.trim() ||
    "Unnamed customer"
  );
}

function getServiceId(service: Service) {
  return String(
    service.service_id ??
      service.id ??
      ""
  );
}

function getServiceName(
  service: Service
) {
  return (
    service.service_name?.trim() ||
    service.name?.trim() ||
    "Service"
  );
}

function getServiceLabel(
  service: Service
) {
  const parts = [
    getServiceName(service),
  ];

  if (
    service.duration_minutes != null
  ) {
    parts.push(
      `${service.duration_minutes} min`
    );
  }

  if (service.price != null) {
    parts.push(
      formatMoney(service.price)
    );
  }

  return parts.join(" • ");
}

function formatMoney(value?: number | null) {
  return `R${Number(
    value || 0
  ).toLocaleString("en-ZA", {
    maximumFractionDigits: 0,
  })}`;
}

function formatSlotTime(value: string) {
  return new Date(
    value
  ).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSlotDate(value: string) {
  return new Date(
    value
  ).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getTimeInputFromDateTime(
  value: string
) {
  const date = new Date(value);

  return date.toLocaleTimeString(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  );
}

function statusStyles(status: string) {
  if (status === "BLOCKED") {
    return {
      container:
        "border-red-500/30 bg-red-500/10",
      badge:
        "bg-red-500/20 text-red-200",
      icon: "text-red-300",
    };
  }

  if (status === "BOOKED") {
    return {
      container:
        "border-blue-500/30 bg-blue-500/10",
      badge:
        "bg-blue-500/20 text-blue-200",
      icon: "text-blue-300",
    };
  }

  return {
    container:
      "border-emerald-500/30 bg-emerald-500/10",
    badge:
      "bg-emerald-500/20 text-emerald-200",
    icon: "text-emerald-300",
  };
}

export default function CalendarPage() {
  const [
    calendarView,
    setCalendarView,
  ] =
    useState<CalendarView>("day");

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getTodayInputDate()
  );

  const [
    calendarSlots,
    setCalendarSlots,
  ] = useState<CalendarSlot[]>([]);

  const [
    calendarLoading,
    setCalendarLoading,
  ] = useState(true);

  const [
    calendarError,
    setCalendarError,
  ] = useState("");

  const [
    blockStartTime,
    setBlockStartTime,
  ] = useState("14:00");

  const [
    blockEndTime,
    setBlockEndTime,
  ] = useState("16:00");

  const [
    blockReason,
    setBlockReason,
  ] = useState("");

  const [
    blockLoading,
    setBlockLoading,
  ] = useState(false);

  const [
    blockError,
    setBlockError,
  ] = useState("");

  const [
    blockSuccess,
    setBlockSuccess,
  ] = useState("");

  const [
    bookingSheetOpen,
    setBookingSheetOpen,
  ] = useState(false);

  const [
    bookingForm,
    setBookingForm,
  ] = useState<BookingForm>(
    createEmptyBookingForm(
      selectedDate
    )
  );

  const [
    customers,
    setCustomers,
  ] = useState<Customer[]>([]);

  const [
    services,
    setServices,
  ] = useState<Service[]>([]);

  const [
    referenceDataLoading,
    setReferenceDataLoading,
  ] = useState(false);

  const [
    bookingSaving,
    setBookingSaving,
  ] = useState(false);

  const [
    bookingError,
    setBookingError,
  ] = useState("");

  const [
    bookingSuccess,
    setBookingSuccess,
  ] = useState("");

  const [
    customerSearch,
    setCustomerSearch,
  ] = useState("");

  const [
    bookingDateSlots,
    setBookingDateSlots,
  ] = useState<CalendarSlot[]>([]);

  const [
    bookingSlotsLoading,
    setBookingSlotsLoading,
  ] = useState(false);

  const [
    bookingSlotsError,
    setBookingSlotsError,
  ] = useState("");

  const [
    highlightedBookingId,
    setHighlightedBookingId,
  ] = useState<number | null>(null);

  const loadCalendar =
    useCallback(async () => {
      setCalendarLoading(true);
      setCalendarError("");

      try {
        const data = await apiRequest<{
          success?: boolean;
          slots?: CalendarSlot[];
          detail?: string;
        }>(
          `/dashboard/calendar?view=${calendarView}&target_date=${selectedDate}`,
          { cache: "no-store" }
        );

        setCalendarSlots(
          data.slots || []
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not load the calendar.";

        setCalendarError(message);
        setCalendarSlots([]);
      } finally {
        setCalendarLoading(false);
      }
    }, [
      calendarView,
      selectedDate,
    ]);

  const loadReferenceData =
    useCallback(async () => {
      setReferenceDataLoading(true);
      setBookingError("");

      try {
        const [
          customersData,
          servicesData,
        ] = await Promise.all([
          apiRequest<CustomersResponse>(
            "/dashboard/customers?limit=500",
            { cache: "no-store" }
          ),
          apiRequest<ServicesResponse>(
            "/dashboard/services",
            { cache: "no-store" }
          ),
        ]);

        setCustomers(
          customersData.customers || []
        );

        setServices(
          servicesData.services || []
        );
      } catch (error) {
        setBookingError(
          error instanceof Error
            ? error.message
            : "Could not load booking information."
        );
      } finally {
        setReferenceDataLoading(false);
      }
    }, []);

  const loadBookingDateSlots =
    useCallback(
      async (date: string) => {
        if (!date) {
          setBookingDateSlots([]);
          return;
        }

        setBookingSlotsLoading(true);
        setBookingSlotsError("");

        try {
          const data =
            await apiRequest<AvailableSlotsResponse>(
              `/dashboard/calendar?view=day&target_date=${date}`,
              { cache: "no-store" }
            );

          setBookingDateSlots(
            (data.slots || []).filter(
              (slot) =>
                slot.status === "AVAILABLE"
            )
          );
        } catch (error) {
          setBookingDateSlots([]);
          setBookingSlotsError(
            error instanceof Error
              ? error.message
              : "Could not load available times."
          );
        } finally {
          setBookingSlotsLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  useEffect(() => {
    if (!bookingSuccess) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        setBookingSuccess("");
      }, 5000);

    return () =>
      window.clearTimeout(
        timeoutId
      );
  }, [bookingSuccess]);

  useEffect(() => {
    if (highlightedBookingId == null) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        setHighlightedBookingId(null);
      }, 6000);

    return () =>
      window.clearTimeout(timeoutId);
  }, [highlightedBookingId]);

  async function blockCalendarTime() {
    setBlockError("");
    setBlockSuccess("");

    if (
      !blockStartTime ||
      !blockEndTime
    ) {
      setBlockError(
        "Select both a start time and an end time."
      );
      return;
    }

    if (
      blockStartTime >=
      blockEndTime
    ) {
      setBlockError(
        "The end time must be later than the start time."
      );
      return;
    }

    setBlockLoading(true);

    try {
      const data = await apiRequest<{
        success?: boolean;
        message?: string;
        detail?: string;
      }>("/dashboard/calendar/block", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_datetime: `${selectedDate}T${blockStartTime}:00`,
          end_datetime: `${selectedDate}T${blockEndTime}:00`,
          reason:
            blockReason.trim() ||
            "Blocked time",
        }),
      });

      if (!data.success) {
        throw new Error(
          data.detail ||
            data.message ||
            "Could not block this time."
        );
      }

      setBlockSuccess(
        "The selected time has been blocked."
      );

      setBlockReason("");

      await loadCalendar();
    } catch (error) {
      setBlockError(
        error instanceof Error
          ? error.message
          : "Could not block this time."
      );
    } finally {
      setBlockLoading(false);
    }
  }

  async function unblockCalendarSlot(
    slotId: number
  ) {
    const confirmed =
      window.confirm(
        "Remove this blocked time?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const data = await apiRequest<{
        success?: boolean;
        message?: string;
        detail?: string;
      }>(
        `/dashboard/calendar/unblock/${slotId}`,
        { method: "DELETE" }
      );

      if (!data.success) {
        throw new Error(
          data.detail ||
            data.message ||
            "Could not unblock this time."
        );
      }

      await loadCalendar();
    } catch (error) {
      setCalendarError(
        error instanceof Error
          ? error.message
          : "Could not unblock this time."
      );
    }
  }

  async function openBookingSheet(
    slot?: CalendarSlot
  ) {
    setBookingError("");
    setBookingSlotsError("");
    setCustomerSearch("");

    const slotDate = slot
      ? new Date(
          slot.slot_datetime
        )
      : null;

    const bookingDate = slotDate
      ? new Date(
          slotDate.getTime() -
            slotDate.getTimezoneOffset() *
              60_000
        )
          .toISOString()
          .slice(0, 10)
      : selectedDate;

    const bookingTime = slot
      ? getTimeInputFromDateTime(
          slot.slot_datetime
        )
      : "";

    setBookingForm({
      ...createEmptyBookingForm(
        bookingDate
      ),
      appointment_time:
        bookingTime,
    });

    setBookingSheetOpen(true);

    await Promise.all([
      loadReferenceData(),
      loadBookingDateSlots(
        bookingDate
      ),
    ]);
  }

  function closeBookingSheet() {
    if (bookingSaving) {
      return;
    }

    setBookingSheetOpen(false);
    setBookingError("");
    setCustomerSearch("");
    setBookingDateSlots([]);
    setBookingSlotsError("");
    setBookingForm(
      createEmptyBookingForm(
        selectedDate
      )
    );
  }

  function handleCustomerSelection(
    customerId: string
  ) {
    if (!customerId) {
      setBookingForm(
        (current) => ({
          ...current,
          selected_customer_id:
            "",
          customer_name: "",
          phone_number: "",
          customer_email: "",
          customer_notes: "",
        })
      );
      return;
    }

    const selectedCustomer =
      customers.find(
        (customer) =>
          getCustomerId(
            customer
          ) === customerId
      );

    if (!selectedCustomer) {
      return;
    }

    setBookingForm(
      (current) => ({
        ...current,
        selected_customer_id:
          customerId,
        customer_name:
          getCustomerName(
            selectedCustomer
          ),
        phone_number:
          selectedCustomer.phone_number ||
          "",
        customer_email:
          selectedCustomer.email ||
          "",
        customer_notes:
          selectedCustomer.notes ||
          "",
      })
    );
  }

  async function createManualBooking(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setBookingError("");

    const customerName =
      bookingForm.customer_name.trim();

    const phoneNumber =
      bookingForm.phone_number
        .replace(
          /[\s()-]/g,
          ""
        )
        .trim();

    if (!customerName) {
      setBookingError(
        "Enter or select a customer."
      );
      return;
    }

    if (
      phoneNumber.length < 8
    ) {
      setBookingError(
        "Enter a valid phone number."
      );
      return;
    }

    if (
      !bookingForm.service_id
    ) {
      setBookingError(
        "Select a service."
      );
      return;
    }

    if (
      !bookingForm.appointment_date ||
      !bookingForm.appointment_time
    ) {
      setBookingError(
        "Select an appointment date and time."
      );
      return;
    }

    const appointmentTimestamp =
      `${bookingForm.appointment_date}T${bookingForm.appointment_time}:00`;

    const appointmentDate =
      new Date(
        appointmentTimestamp
      );

    if (
      Number.isNaN(
        appointmentDate.getTime()
      )
    ) {
      setBookingError(
        "The appointment date or time is invalid."
      );
      return;
    }

    if (
      appointmentDate.getTime() <=
      Date.now()
    ) {
      setBookingError(
        "The appointment must be in the future."
      );
      return;
    }

    setBookingSaving(true);

    try {
      const data =
        await apiRequest<ManualBookingResponse>(
          "/dashboard/manual-booking",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              customer_name:
                customerName,
              phone_number:
                phoneNumber,
              service_id: Number(
                bookingForm.service_id
              ),
              appointment_timestamp:
                appointmentTimestamp,
              customer_email:
                bookingForm.customer_email.trim() ||
                null,
              customer_notes:
                bookingForm.customer_notes.trim() ||
                null,
            }),
          }
        );

      if (!data.success) {
        throw new Error(
          data.detail ||
            data.message ||
            "The booking could not be created."
        );
      }

      const createdBookingId =
        data.booking?.booking_id ??
        data.booking?.id ??
        null;

      setBookingSheetOpen(false);

      setBookingSuccess(
        data.message ||
          `✅ ${customerName} was booked successfully.`
      );

      setHighlightedBookingId(
        createdBookingId
      );

      setSelectedDate(
        bookingForm.appointment_date
      );

      setCalendarView("day");

      setBookingForm(
        createEmptyBookingForm(
          bookingForm.appointment_date
        )
      );

      setBookingDateSlots([]);

      const refreshData =
        await apiRequest<AvailableSlotsResponse>(
          `/dashboard/calendar?view=day&target_date=${bookingForm.appointment_date}`,
          { cache: "no-store" }
        );

      setCalendarSlots(
        refreshData.slots || []
      );
    } catch (error) {
      setBookingError(
        error instanceof Error
          ? error.message
          : "The booking could not be created."
      );
    } finally {
      setBookingSaving(false);
    }
  }

  const filteredCustomers =
    useMemo(() => {
      const query =
        customerSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return customers;
      }

      return customers.filter(
        (customer) =>
          [
            getCustomerName(
              customer
            ),
            customer.phone_number ||
              "",
            customer.email || "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)
      );
    }, [
      customers,
      customerSearch,
    ]);

  const selectedService =
    useMemo(
      () =>
        services.find(
          (service) =>
            getServiceId(service) ===
            bookingForm.service_id
        ) || null,
      [
        services,
        bookingForm.service_id,
      ]
    );

  const availableTimeOptions =
    useMemo(
      () =>
        bookingDateSlots
          .map((slot) => ({
            value:
              getTimeInputFromDateTime(
                slot.slot_datetime
              ),
            label:
              formatSlotTime(
                slot.slot_datetime
              ),
          }))
          .sort((first, second) =>
            first.value.localeCompare(
              second.value
            )
          ),
      [bookingDateSlots]
    );

  const availableCount =
    calendarSlots.filter(
      (slot) =>
        slot.status ===
        "AVAILABLE"
    ).length;

  const bookedCount =
    calendarSlots.filter(
      (slot) =>
        slot.status ===
        "BOOKED"
    ).length;

  const blockedCount =
    calendarSlots.filter(
      (slot) =>
        slot.status ===
        "BLOCKED"
    ).length;

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-purple-300">
              Appointment operations
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Calendar
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
              Manage bookings,
              availability, blocked time,
              and the working schedule
              from one place.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <DashboardTabs
              value={calendarView}
              onChange={(value) =>
                setCalendarView(
                  value as CalendarView
                )
              }
              items={[
                {
                  value: "day",
                  label: "Day",
                },
                {
                  value: "week",
                  label: "Week",
                },
                {
                  value: "month",
                  label: "Month",
                },
              ]}
            />

            <button
              type="button"
              onClick={() =>
                void openBookingSheet()
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 text-sm font-semibold text-white transition hover:bg-purple-400"
            >
              <Plus className="h-4 w-4" />
              New Booking
            </button>
          </div>
        </header>

        {bookingSuccess && (
          <div
            role="status"
            className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

              <span>
                {bookingSuccess}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setBookingSuccess("")
              }
              aria-label="Dismiss message"
              className="text-emerald-300 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <CalendarMetric
            title="Available"
            value={availableCount}
            icon={CheckCircle2}
            valueClassName="text-emerald-300"
          />

          <CalendarMetric
            title="Booked"
            value={bookedCount}
            icon={CalendarDays}
            valueClassName="text-sky-300"
          />

          <CalendarMetric
            title="Blocked"
            value={blockedCount}
            icon={Ban}
            valueClassName="text-red-300"
          />
        </section>

        <section className="grid items-start gap-8 xl:grid-cols-[1fr_2fr]">
          <div className="space-y-8">
            <CardShell>
              <CardHeader>
                <CardTitle className="text-xl">
                  Calendar date
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Select the date used
                  for the current calendar
                  view.
                </p>
              </CardHeader>

              <CardContent>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) =>
                    setSelectedDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500 [color-scheme:dark]"
                />
              </CardContent>
            </CardShell>

            <CardShell>
              <CardHeader>
                <CardTitle className="text-xl">
                  Manual block
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Mark a period as
                  unavailable for appointments.
                </p>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Start time
                    </span>

                    <input
                      type="time"
                      value={
                        blockStartTime
                      }
                      onChange={(event) =>
                        setBlockStartTime(
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-purple-500 [color-scheme:dark]"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      End time
                    </span>

                    <input
                      type="time"
                      value={
                        blockEndTime
                      }
                      onChange={(event) =>
                        setBlockEndTime(
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-purple-500 [color-scheme:dark]"
                    />
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Reason
                  </span>

                  <input
                    type="text"
                    value={blockReason}
                    onChange={(event) =>
                      setBlockReason(
                        event.target.value
                      )
                    }
                    placeholder="Lunch, personal appointment, unavailable..."
                    className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500"
                  />
                </label>

                {blockError && (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                    {blockError}
                  </p>
                )}

                {blockSuccess && (
                  <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                    {blockSuccess}
                  </p>
                )}

                <button
                  type="button"
                  onClick={
                    blockCalendarTime
                  }
                  disabled={
                    blockLoading
                  }
                  className="w-full rounded-xl bg-purple-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {blockLoading
                    ? "Blocking time..."
                    : "Block selected time"}
                </button>
              </CardContent>
            </CardShell>

          </div>

          <CardShell>
            <CardHeader className="flex flex-col gap-4 border-b border-zinc-800 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-xl">
                  Schedule
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Availability, bookings,
                  and blocked periods.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadCalendar()
                }
                disabled={
                  calendarLoading
                }
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:opacity-60"
              >
                {calendarLoading
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </CardHeader>

            <CardContent className="p-6">
              {calendarError && (
                <p className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {calendarError}
                </p>
              )}

              {calendarLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from({
                    length: 6,
                  }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className="h-36 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60"
                      />
                    )
                  )}
                </div>
              ) : calendarSlots.length ===
                0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
                  <CalendarDays className="h-9 w-9 text-zinc-600" />

                  <p className="mt-4 font-medium text-zinc-300">
                    No calendar slots found
                  </p>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                    There are no available,
                    booked, or blocked slots
                    for this date and view.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {calendarSlots.map(
                    (slot) => (
                      <CalendarSlotCard
                        key={
                          slot.slot_id
                        }
                        slot={slot}
                        onUnblock={
                          unblockCalendarSlot
                        }
                        onBook={(selectedSlot) =>
                          void openBookingSheet(
                            selectedSlot
                          )
                        }
                        highlighted={
                          highlightedBookingId != null &&
                          slot.booking_id ===
                            highlightedBookingId
                        }
                      />
                    )
                  )}
                </div>
              )}
            </CardContent>
          </CardShell>
        </section>
      </div>

      <ManualBookingSheet
        open={bookingSheetOpen}
        form={bookingForm}
        customers={
          filteredCustomers
        }
        services={services}
        selectedService={
          selectedService
        }
        availableTimeOptions={
          availableTimeOptions
        }
        bookingSlotsLoading={
          bookingSlotsLoading
        }
        bookingSlotsError={
          bookingSlotsError
        }
        customerSearch={
          customerSearch
        }
        loadingReferenceData={
          referenceDataLoading
        }
        saving={bookingSaving}
        error={bookingError}
        onCustomerSearchChange={
          setCustomerSearch
        }
        onCustomerSelect={
          handleCustomerSelection
        }
        onChange={(field, value) => {
          setBookingForm(
            (current) => ({
              ...current,
              [field]: value,
              ...(field ===
              "appointment_date"
                ? {
                    appointment_time:
                      "",
                  }
                : {}),
            })
          );

          if (
            field ===
            "appointment_date"
          ) {
            void loadBookingDateSlots(
              value
            );
          }
        }}
        onClose={closeBookingSheet}
        onSubmit={
          createManualBooking
        }
      />
    </main>
  );
}

function ManualBookingSheet({
  open,
  form,
  customers,
  services,
  selectedService,
  availableTimeOptions,
  bookingSlotsLoading,
  bookingSlotsError,
  customerSearch,
  loadingReferenceData,
  saving,
  error,
  onCustomerSearchChange,
  onCustomerSelect,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  form: BookingForm;
  customers: Customer[];
  services: Service[];
  selectedService: Service | null;
  availableTimeOptions: {
    value: string;
    label: string;
  }[];
  bookingSlotsLoading: boolean;
  bookingSlotsError: string;
  customerSearch: string;
  loadingReferenceData: boolean;
  saving: boolean;
  error: string;
  onCustomerSearchChange: (
    value: string
  ) => void;
  onCustomerSelect: (
    customerId: string
  ) => void;
  onChange: (
    field: keyof BookingForm,
    value: string
  ) => void;
  onClose: () => void;
  onSubmit: (
    event: React.FormEvent<HTMLFormElement>
  ) => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close booking form"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-zinc-800 bg-[#080808] shadow-2xl">
        <header className="flex items-start justify-between gap-5 border-b border-zinc-800 px-6 py-6">
          <div>
            <p className="text-sm font-medium text-purple-300">
              Appointment operations
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-white">
              New Booking
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Create an appointment for
              an existing or new customer.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-400 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
                {error}
              </div>
            )}

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h3 className="font-semibold text-white">
                Existing customer
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Search and select a
                customer to fill in their
                contact details.
              </p>

              <div className="relative mt-4">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

                <input
                  type="search"
                  value={
                    customerSearch
                  }
                  onChange={(event) =>
                    onCustomerSearchChange(
                      event.target.value
                    )
                  }
                  placeholder="Search by name, phone, or email..."
                  className={`${bookingInputClassName} pl-11`}
                />
              </div>

              <select
                value={
                  form.selected_customer_id
                }
                onChange={(event) =>
                  onCustomerSelect(
                    event.target.value
                  )
                }
                disabled={
                  loadingReferenceData
                }
                className={`${bookingInputClassName} mt-3 [color-scheme:dark]`}
              >
                <option value="">
                  {loadingReferenceData
                    ? "Loading customers..."
                    : "Select an existing customer"}
                </option>

                {customers.map(
                  (customer) => (
                    <option
                      key={
                        getCustomerId(
                          customer
                        )
                      }
                      value={
                        getCustomerId(
                          customer
                        )
                      }
                    >
                      {getCustomerName(
                        customer
                      )}
                      {customer.phone_number
                        ? ` — ${customer.phone_number}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </section>

            <section className="space-y-5">
              <div>
                <h3 className="font-semibold text-white">
                  Customer details
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  These fields can also be
                  used to create a new
                  customer automatically.
                </p>
              </div>

              <BookingField
                label="Customer name"
                required
              >
                <input
                  type="text"
                  value={
                    form.customer_name
                  }
                  onChange={(event) =>
                    onChange(
                      "customer_name",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Lerato Mokoena"
                  maxLength={120}
                  className={
                    bookingInputClassName
                  }
                />
              </BookingField>

              <div className="grid gap-5 sm:grid-cols-2">
                <BookingField
                  label="Phone number"
                  required
                >
                  <input
                    type="tel"
                    value={
                      form.phone_number
                    }
                    onChange={(event) =>
                      onChange(
                        "phone_number",
                        event.target.value
                      )
                    }
                    placeholder="e.g. 27821234567"
                    maxLength={30}
                    className={
                      bookingInputClassName
                    }
                  />
                </BookingField>

                <BookingField label="Email address">
                  <input
                    type="email"
                    value={
                      form.customer_email
                    }
                    onChange={(event) =>
                      onChange(
                        "customer_email",
                        event.target.value
                      )
                    }
                    placeholder="customer@example.com"
                    maxLength={255}
                    className={
                      bookingInputClassName
                    }
                  />
                </BookingField>
              </div>
            </section>

            <section className="space-y-5 border-t border-zinc-800 pt-6">
              <div>
                <h3 className="font-semibold text-white">
                  Appointment details
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Choose the service, date,
                  and appointment time.
                </p>
              </div>

              <BookingField
                label="Service"
                required
              >
                <select
                  value={
                    form.service_id
                  }
                  onChange={(event) =>
                    onChange(
                      "service_id",
                      event.target.value
                    )
                  }
                  disabled={
                    loadingReferenceData
                  }
                  className={`${bookingInputClassName} [color-scheme:dark]`}
                >
                  <option value="">
                    {loadingReferenceData
                      ? "Loading services..."
                      : "Select a service"}
                  </option>

                  {services.map(
                    (service) => (
                      <option
                        key={
                          getServiceId(
                            service
                          )
                        }
                        value={
                          getServiceId(
                            service
                          )
                        }
                      >
                        {getServiceLabel(
                          service
                        )}
                      </option>
                    )
                  )}
                </select>
              </BookingField>

              {selectedService && (
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-purple-300">
                    Selected service
                  </p>

                  <p className="mt-2 font-semibold text-white">
                    {getServiceName(
                      selectedService
                    )}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    {selectedService.duration_minutes !=
                      null && (
                      <span className="rounded-full bg-black/30 px-3 py-1 text-sky-300">
                        {
                          selectedService.duration_minutes
                        }{" "}
                        minutes
                      </span>
                    )}

                    {selectedService.price !=
                      null && (
                      <span className="rounded-full bg-black/30 px-3 py-1 text-emerald-300">
                        {formatMoney(
                          selectedService.price
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <BookingField
                  label="Appointment date"
                  required
                >
                  <input
                    type="date"
                    min={
                      getTodayInputDate()
                    }
                    value={
                      form.appointment_date
                    }
                    onChange={(event) =>
                      onChange(
                        "appointment_date",
                        event.target.value
                      )
                    }
                    className={`${bookingInputClassName} [color-scheme:dark]`}
                  />
                </BookingField>

                <BookingField
                  label="Available time"
                  required
                  description="Only open calendar slots are shown."
                >
                  <select
                    value={
                      form.appointment_time
                    }
                    onChange={(event) =>
                      onChange(
                        "appointment_time",
                        event.target.value
                      )
                    }
                    disabled={
                      bookingSlotsLoading ||
                      !form.appointment_date
                    }
                    className={`${bookingInputClassName} [color-scheme:dark]`}
                  >
                    <option value="">
                      {bookingSlotsLoading
                        ? "Loading available times..."
                        : availableTimeOptions.length >
                          0
                        ? "Select an available time"
                        : "No available times"}
                    </option>

                    {availableTimeOptions.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </BookingField>
              </div>

              {bookingSlotsError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {bookingSlotsError}
                </div>
              )}

              {!bookingSlotsLoading &&
                form.appointment_date &&
                availableTimeOptions.length ===
                  0 &&
                !bookingSlotsError && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                    There are no open slots for
                    this date. Choose another
                    date.
                  </div>
                )}

              <BookingField
                label="Internal notes"
                description="Optional notes about the customer or appointment."
              >
                <textarea
                  value={
                    form.customer_notes
                  }
                  onChange={(event) =>
                    onChange(
                      "customer_notes",
                      event.target.value
                    )
                  }
                  placeholder="Add preferences or booking notes..."
                  maxLength={2000}
                  rows={5}
                  className={`${bookingInputClassName} resize-none`}
                />
              </BookingField>
            </section>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-zinc-800 px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                loadingReferenceData ||
                bookingSlotsLoading ||
                !form.appointment_time
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Booking
                </>
              ) : (
                <>
                  <CalendarDays className="h-4 w-4" />
                  Create Booking
                </>
              )}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}

function BookingField({
  label,
  required = false,
  description,
  children,
}: {
  label: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-200">
        {label}

        {required && (
          <span className="ml-1 text-purple-300">
            *
          </span>
        )}
      </span>

      {description && (
        <span className="mt-1 block text-xs leading-5 text-zinc-500">
          {description}
        </span>
      )}

      <span className="mt-2 block">
        {children}
      </span>
    </label>
  );
}

const bookingInputClassName =
  "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10";

function CalendarSlotCard({
  slot,
  onUnblock,
  onBook,
  highlighted = false,
}: {
  slot: CalendarSlot;
  onUnblock: (
    slotId: number
  ) => void;
  onBook: (
    slot: CalendarSlot
  ) => void;
  highlighted?: boolean;
}) {
  const styles =
    statusStyles(slot.status);

  return (
    <article
      className={`rounded-2xl border p-5 transition ${styles.container} ${
        highlighted
          ? "ring-2 ring-purple-400 ring-offset-2 ring-offset-black shadow-[0_0_28px_rgba(168,85,247,0.35)]"
          : ""
      }`}
    >
      {highlighted && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-purple-400/30 bg-purple-500/15 px-3 py-2 text-xs font-medium text-purple-200">
          <CheckCircle2 className="h-4 w-4" />
          Newly created booking
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">
            {formatSlotDate(
              slot.slot_datetime
            )}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <Clock3
              className={`h-4 w-4 ${styles.icon}`}
            />

            <p className="text-xl font-semibold">
              {formatSlotTime(
                slot.slot_datetime
              )}
            </p>
          </div>
        </div>

        <Badge
          className={styles.badge}
        >
          {slot.status}
        </Badge>
      </div>

      {slot.status === "BOOKED" && (
        <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3">
            <UserRound className="h-4 w-4 text-zinc-400" />

            <p className="text-sm font-medium">
              {slot.customer_name ||
                "Booked customer"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Scissors className="h-4 w-4 text-zinc-400" />

            <p className="text-sm text-zinc-300">
              {slot.service_name ||
                "Service"}
            </p>
          </div>
        </div>
      )}

      {slot.status === "BLOCKED" && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-sm text-zinc-300">
            {slot.blocked_reason ||
              "Blocked time"}
          </p>

          <button
            type="button"
            onClick={() =>
              onUnblock(
                slot.slot_id
              )
            }
            className="mt-4 rounded-full border border-red-500/40 px-4 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/10"
          >
            Remove block
          </button>
        </div>
      )}

      {slot.status === "AVAILABLE" && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-sm text-zinc-300">
            This slot is open for
            booking.
          </p>

          <button
            type="button"
            onClick={() =>
              onBook(slot)
            }
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-4 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/10"
          >
            <Plus className="h-3.5 w-3.5" />
            Book this slot
          </button>
        </div>
      )}
    </article>
  );
}

function CalendarMetric({
  title,
  value,
  icon: Icon,
  valueClassName =
    "text-white",
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{
    className?: string;
  }>;
  valueClassName?: string;
}) {
  return (
    <CardShell>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-zinc-400">
            {title}
          </p>

          <p
            className={`mt-3 text-3xl font-semibold ${valueClassName}`}
          >
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10">
          <Icon className="h-5 w-5 text-purple-300" />
        </div>
      </CardContent>
    </CardShell>
  );
}

function DashboardTabs({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (
    value: string
  ) => void;
  items: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <Tabs
      value={value}
      onValueChange={onChange}
    >
      <TabsList className="gap-1 rounded-xl border border-zinc-700 bg-zinc-900 p-1">
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className="rounded-lg px-4 py-1.5 text-zinc-300 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function CardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-3xl border border-zinc-700 bg-[#080808] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      {children}
    </Card>
  );
}