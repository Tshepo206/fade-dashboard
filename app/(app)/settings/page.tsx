"use client";

import {
  Building2,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Save,
  Scissors,
  Smartphone,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiRequest } from "@/lib/api";

type Service = {
  id?: number;
  service_id?: number;
  name?: string | null;
  service_name?: string | null;
  price?: number | null;
  price_zar?: number | null;
  duration_minutes?: number | null;
  is_active?: boolean | null;
};

type ServicesResponse = {
  success?: boolean;
  services?: Service[];
  detail?: string;
};

type BusinessProfile = {
  businessName: string;
  ownerName: string;
  phoneNumber: string;
  emailAddress: string;
  currency: string;
  timezone: string;
  address: string;
};

const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  businessName: "KG Barber",
  ownerName: "",
  phoneNumber: "",
  emailAddress: "",
  currency: "ZAR",
  timezone: "Africa/Johannesburg",
  address: "",
};

const WORKSPACE_OVERVIEW = {
  operatingHours: "08:00 – 17:00",
  appointmentSlots: "30 minutes",
  whatsappBookings: "Enabled",
};

const BUSINESS_PROFILE_STORAGE_KEY =
  "goodkeeper-business-profile";

function getServiceId(service: Service) {
  return String(
    service.service_id ??
      service.id ??
      ""
  );
}

function getServiceName(service: Service) {
  return (
    service.service_name?.trim() ||
    service.name?.trim() ||
    "Unnamed service"
  );
}

function formatMoney(value?: number | null) {
  return `R${Number(
    value || 0
  ).toLocaleString("en-ZA", {
    maximumFractionDigits: 0,
  })}`;
}

function getCurrencyLabel(value: string) {
  const labels: Record<string, string> = {
    ZAR: "South African Rand (ZAR)",
    USD: "US Dollar (USD)",
    GBP: "British Pound (GBP)",
    EUR: "Euro (EUR)",
  };

  return labels[value] || value;
}

function getTimezoneLabel(value: string) {
  const labels: Record<string, string> = {
    "Africa/Johannesburg": "Johannesburg",
    "Africa/Cape_Town": "Cape Town",
    UTC: "UTC",
  };

  return labels[value] || value;
}

export default function SettingsPage() {
  const [
    businessProfile,
    setBusinessProfile,
  ] = useState<BusinessProfile>(
    DEFAULT_BUSINESS_PROFILE
  );

  const [
    savedBusinessProfile,
    setSavedBusinessProfile,
  ] = useState<BusinessProfile>(
    DEFAULT_BUSINESS_PROFILE
  );

  const [
    profileSavedMessage,
    setProfileSavedMessage,
  ] = useState("");

  const [services, setServices] =
    useState<Service[]>([]);

  const [
    servicesLoading,
    setServicesLoading,
  ] = useState(true);

  const [
    servicesError,
    setServicesError,
  ] = useState("");

  const loadServices =
    useCallback(async () => {
      setServicesLoading(true);
      setServicesError("");

      try {
        const data =
          await apiRequest<ServicesResponse>(
            "/dashboard/services",
            {
              cache: "no-store",
            }
          );

        if (!data.success) {
          throw new Error(
            data.detail ||
              "Could not load services."
          );
        }

        setServices(
          [...(data.services || [])].sort(
            (first, second) =>
              getServiceName(
                first
              ).localeCompare(
                getServiceName(second)
              )
          )
        );
      } catch (requestError) {
        setServices([]);

        setServicesError(
          requestError instanceof Error
            ? requestError.message
            : "Could not load services."
        );
      } finally {
        setServicesLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  useEffect(() => {
    const storedProfile =
      window.localStorage.getItem(
        BUSINESS_PROFILE_STORAGE_KEY
      );

    if (!storedProfile) {
      return;
    }

    try {
      const parsedProfile =
        JSON.parse(
          storedProfile
        ) as BusinessProfile;

      const mergedProfile = {
        ...DEFAULT_BUSINESS_PROFILE,
        ...parsedProfile,
      };

      setBusinessProfile(
        mergedProfile
      );

      setSavedBusinessProfile(
        mergedProfile
      );
    } catch {
      window.localStorage.removeItem(
        BUSINESS_PROFILE_STORAGE_KEY
      );
    }
  }, []);

  useEffect(() => {
    if (!profileSavedMessage) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        setProfileSavedMessage("");
      }, 4000);

    return () =>
      window.clearTimeout(timeoutId);
  }, [profileSavedMessage]);

  const hasProfileChanges =
    useMemo(
      () =>
        JSON.stringify(
          businessProfile
        ) !==
        JSON.stringify(
          savedBusinessProfile
        ),
      [
        businessProfile,
        savedBusinessProfile,
      ]
    );

  function updateBusinessProfile<
    K extends keyof BusinessProfile,
  >(
    field: K,
    value: BusinessProfile[K]
  ) {
    setBusinessProfile(
      (current) => ({
        ...current,
        [field]: value,
      })
    );

    setProfileSavedMessage("");
  }

  function saveBusinessProfile() {
    window.localStorage.setItem(
      BUSINESS_PROFILE_STORAGE_KEY,
      JSON.stringify(
        businessProfile
      )
    );

    setSavedBusinessProfile(
      businessProfile
    );

    setProfileSavedMessage(
      "Business profile saved on this device."
    );
  }

  function discardBusinessProfileChanges() {
    setBusinessProfile(
      savedBusinessProfile
    );

    setProfileSavedMessage("");
  }

  const activeServices =
    useMemo(
      () =>
        services.filter(
          (service) =>
            service.is_active !== false
        ).length,
      [services]
    );

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <header>
          <p className="text-sm font-medium text-purple-300">
            Business configuration
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Settings
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            Review the business profile,
            workspace information, and
            services available to customers.
          </p>
        </header>

        {profileSavedMessage && (
          <section className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {profileSavedMessage}
          </section>
        )}

        <section className="grid items-start gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-8">
            <CardShell>
              <CardHeader className="border-b border-zinc-800">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                      <Building2 className="h-5 w-5 text-purple-300" />
                    </div>

                    <div>
                      <CardTitle className="text-xl">
                        Business Profile
                      </CardTitle>

                      <p className="mt-1 text-sm text-zinc-400">
                        Update the business information shown throughout GoodKeeper.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={
                        discardBusinessProfileChanges
                      }
                      disabled={
                        !hasProfileChanges
                      }
                      className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Discard
                    </button>

                    <button
                      type="button"
                      onClick={
                        saveBusinessProfile
                      }
                      disabled={
                        !hasProfileChanges
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Save className="h-4 w-4" />
                      Save Profile
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid gap-5 p-6 md:grid-cols-2">
                <BusinessProfileField
                  label="Business name"
                  value={
                    businessProfile.businessName
                  }
                  onChange={(value) =>
                    updateBusinessProfile(
                      "businessName",
                      value
                    )
                  }
                  placeholder="KG Barber"
                />

                <BusinessProfileField
                  label="Owner name"
                  value={
                    businessProfile.ownerName
                  }
                  onChange={(value) =>
                    updateBusinessProfile(
                      "ownerName",
                      value
                    )
                  }
                  placeholder="Business owner"
                />

                <BusinessProfileField
                  label="Phone number"
                  value={
                    businessProfile.phoneNumber
                  }
                  onChange={(value) =>
                    updateBusinessProfile(
                      "phoneNumber",
                      value
                    )
                  }
                  placeholder="+27..."
                  type="tel"
                />

                <BusinessProfileField
                  label="Email address"
                  value={
                    businessProfile.emailAddress
                  }
                  onChange={(value) =>
                    updateBusinessProfile(
                      "emailAddress",
                      value
                    )
                  }
                  placeholder="owner@example.com"
                  type="email"
                />

                <BusinessProfileSelect
                  label="Reporting currency"
                  value={
                    businessProfile.currency
                  }
                  onChange={(value) =>
                    updateBusinessProfile(
                      "currency",
                      value
                    )
                  }
                  options={[
                    {
                      value: "ZAR",
                      label: "South African Rand (ZAR)",
                    },
                    {
                      value: "USD",
                      label: "US Dollar (USD)",
                    },
                    {
                      value: "GBP",
                      label: "British Pound (GBP)",
                    },
                    {
                      value: "EUR",
                      label: "Euro (EUR)",
                    },
                  ]}
                />

                <BusinessProfileSelect
                  label="Timezone"
                  value={
                    businessProfile.timezone
                  }
                  onChange={(value) =>
                    updateBusinessProfile(
                      "timezone",
                      value
                    )
                  }
                  options={[
                    {
                      value: "Africa/Johannesburg",
                      label: "Johannesburg",
                    },
                    {
                      value: "Africa/Cape_Town",
                      label: "Cape Town",
                    },
                    {
                      value: "UTC",
                      label: "UTC",
                    },
                  ]}
                />

                <div className="md:col-span-2">
                  <BusinessProfileField
                    label="Business address"
                    value={
                      businessProfile.address
                    }
                    onChange={(value) =>
                      updateBusinessProfile(
                        "address",
                        value
                      )
                    }
                    placeholder="Street address"
                  />
                </div>
              </CardContent>
            </CardShell>

            <CardShell>
              <CardHeader className="border-b border-zinc-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                      <Scissors className="h-5 w-5 text-purple-300" />
                    </div>

                    <div>
                      <CardTitle className="text-xl">
                        Services
                      </CardTitle>

                      <p className="mt-1 text-sm text-zinc-400">
                        Current services, prices,
                        durations, and availability.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void loadServices()
                    }
                    disabled={servicesLoading}
                    aria-label="Refresh services"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-400 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw
                      className={[
                        "h-4 w-4",
                        servicesLoading
                          ? "animate-spin"
                          : "",
                      ].join(" ")}
                    />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {servicesError && (
                  <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
                    {servicesError}
                  </div>
                )}

                {servicesLoading ? (
                  <ServicesLoadingState />
                ) : services.length ===
                  0 ? (
                  <ServicesEmptyState />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {services.map(
                      (service) => (
                        <ServiceRow
                          key={
                            getServiceId(
                              service
                            )
                          }
                          service={
                            service
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </CardShell>
          </div>

          <CardShell>
            <CardHeader>
              <CardTitle className="text-xl">
                Workspace Overview
              </CardTitle>

              <p className="mt-1 text-sm text-zinc-400">
                A quick summary of the
                GoodKeeper workspace.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <WorkspaceDetail
                icon={Building2}
                label="Business"
                value={
                  businessProfile.businessName ||
                  "Not configured"
                }
              />

              <WorkspaceDetail
                icon={Clock3}
                label="Operating hours"
                value={
                  WORKSPACE_OVERVIEW.operatingHours
                }
              />

              <WorkspaceDetail
                icon={Scissors}
                label="Appointment slots"
                value={
                  WORKSPACE_OVERVIEW.appointmentSlots
                }
              />

              <WorkspaceDetail
                icon={Smartphone}
                label="WhatsApp bookings"
                value={
                  WORKSPACE_OVERVIEW.whatsappBookings
                }
              />

              <WorkspaceDetail
                icon={Scissors}
                label="Active services"
                value={String(
                  activeServices
                )}
              />

              <WorkspaceDetail
                icon={Building2}
                label="Currency"
                value={getCurrencyLabel(
                  businessProfile.currency
                )}
              />

              <WorkspaceDetail
                icon={Clock3}
                label="Timezone"
                value={getTimezoneLabel(
                  businessProfile.timezone
                )}
              />
            </CardContent>
          </CardShell>
        </section>
      </div>
    </main>
  );
}

function BusinessProfileField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel";
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-600">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
      />
    </label>
  );
}

function BusinessProfileSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-600">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500 [color-scheme:dark]"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function WorkspaceDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
        <Icon className="h-4 w-4 text-purple-300" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-600">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-zinc-200">
          {value}
        </p>
      </div>
    </div>
  );
}

function ServiceRow({
  service,
}: {
  service: Service;
}) {
  const active =
    service.is_active !== false;

  return (
    <article className="flex items-center justify-between gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10">
          <Scissors className="h-5 w-5 text-purple-300" />
        </div>

        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-200">
            {getServiceName(
              service
            )}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            {service.duration_minutes !=
            null
              ? `${service.duration_minutes} minutes`
              : "Duration not set"}
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-semibold text-emerald-300">
          {formatMoney(
            service.price_zar ??
              service.price
          )}
        </p>

        <div className="mt-2 flex items-center justify-end gap-2">
          <span
            className={[
              "h-2 w-2 rounded-full",
              active
                ? "bg-emerald-400"
                : "bg-zinc-600",
            ].join(" ")}
          />

          <span className="text-xs text-zinc-500">
            {active
              ? "Active"
              : "Inactive"}
          </span>
        </div>
      </div>
    </article>
  );
}

function ServicesLoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60"
        />
      ))}
    </div>
  );
}

function ServicesEmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
      <Scissors className="h-9 w-9 text-zinc-600" />

      <p className="mt-4 font-medium text-zinc-300">
        No services found
      </p>

      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        Services returned by GoodKeeper
        will appear here.
      </p>
    </div>
  );
}

function CardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border border-zinc-700 bg-[#080808] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      {children}
    </Card>
  );
}