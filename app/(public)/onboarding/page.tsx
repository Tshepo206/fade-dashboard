"use client";

import {
  Building2,
  CheckCircle2,
  Loader2,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

type OnboardingForm = {
  businessName: string;
  ownerName: string;
  currency: string;
  timezone: string;
};

const EMPTY_FORM: OnboardingForm = {
  businessName: "",
  ownerName: "",
  currency: "ZAR",
  timezone: "Africa/Johannesburg",
};

export default function OnboardingPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<OnboardingForm>(EMPTY_FORM);

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    async function loadCurrentUser() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const metadata = user.user_metadata ?? {};

      setForm({
        businessName:
          typeof metadata.business_name === "string"
            ? metadata.business_name
            : "",
        ownerName:
          typeof metadata.owner_name === "string"
            ? metadata.owner_name
            : "",
        currency: "ZAR",
        timezone: "Africa/Johannesburg",
      });

      setLoadingProfile(false);
    }

    void loadCurrentUser();
  }, [router]);

  function updateField(
    field: keyof OnboardingForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccessMessage("");
  }

  function validateForm() {
    if (!form.businessName.trim()) {
      return "Enter your business name.";
    }

    if (!form.ownerName.trim()) {
      return "Enter the owner name.";
    }

    return "";
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const supabase = createClient();

      const {
        data: businessId,
        error: workspaceError,
      } = await supabase.rpc(
        "create_business_workspace",
        {
          p_business_name:
            form.businessName.trim(),
          p_owner_name:
            form.ownerName.trim(),
          p_currency: form.currency,
          p_timezone: form.timezone,
        }
      );

      if (workspaceError) {
        throw workspaceError;
      }

      if (!businessId) {
        throw new Error(
          "The workspace could not be created."
        );
      }

      setSuccessMessage(
        "Your GoodKeeper workspace has been created."
      );

      window.setTimeout(() => {
        router.replace("/dashboard");
        router.refresh();
      }, 700);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Workspace creation failed. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadingProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your account...
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-5 py-10 text-white">
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-purple-600/15 blur-[130px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-zinc-800 bg-[#080808] shadow-[0_0_0_1px_rgba(255,255,255,0.03)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden border-r border-zinc-800 bg-gradient-to-br from-purple-500/15 via-black to-black p-12 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-200">
                <Sparkles className="h-3.5 w-3.5" />
                Workspace setup
              </div>

              <h1 className="mt-8 max-w-md text-4xl font-semibold tracking-tight">
                Let&apos;s set up your GoodKeeper workspace.
              </h1>

              <p className="mt-5 max-w-md text-base leading-8 text-zinc-400">
                Your business will receive its own
                customers, bookings, services,
                financial records, and reporting
                workspace.
              </p>
            </div>

            <div className="mt-16 space-y-4">
              <SetupFeature
                title="Private business data"
                description="Your workspace is separated from every other GoodKeeper business."
              />

              <SetupFeature
                title="Starter services"
                description="GoodKeeper creates three starter services that you can price later."
              />

              <SetupFeature
                title="Ready for daily operations"
                description="After setup, you will be taken directly to your business dashboard."
              />
            </div>
          </div>

          <div className="p-7 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-lg">
              <p className="text-sm font-medium text-purple-300">
                Create your workspace
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Tell us about your business
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                You can update these details later
                from GoodKeeper settings.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >
                <OnboardingField
                  label="Business name"
                  value={form.businessName}
                  onChange={(value) =>
                    updateField(
                      "businessName",
                      value
                    )
                  }
                  placeholder="Mike's Barbers"
                  icon={Building2}
                  disabled={saving}
                  autoComplete="organization"
                />

                <OnboardingField
                  label="Owner name"
                  value={form.ownerName}
                  onChange={(value) =>
                    updateField(
                      "ownerName",
                      value
                    )
                  }
                  placeholder="Mike Johnson"
                  icon={UserRound}
                  disabled={saving}
                  autoComplete="name"
                />

                <label className="block">
                  <span className="text-sm font-medium text-zinc-300">
                    Reporting currency
                  </span>

                  <select
                    value={form.currency}
                    onChange={(event) =>
                      updateField(
                        "currency",
                        event.target.value
                      )
                    }
                    disabled={saving}
                    className="mt-2 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 [color-scheme:dark]"
                  >
                    <option value="ZAR">
                      South African Rand (ZAR)
                    </option>
                    <option value="USD">
                      US Dollar (USD)
                    </option>
                    <option value="GBP">
                      British Pound (GBP)
                    </option>
                    <option value="EUR">
                      Euro (EUR)
                    </option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-300">
                    Timezone
                  </span>

                  <select
                    value={form.timezone}
                    onChange={(event) =>
                      updateField(
                        "timezone",
                        event.target.value
                      )
                    }
                    disabled={saving}
                    className="mt-2 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 [color-scheme:dark]"
                  >
                    <option value="Africa/Johannesburg">
                      Johannesburg
                    </option>
                    <option value="Africa/Harare">
                      Harare
                    </option>
                    <option value="Africa/Gaborone">
                      Gaborone
                    </option>
                    <option value="Africa/Windhoek">
                      Windhoek
                    </option>
                    <option value="UTC">
                      UTC
                    </option>
                  </select>
                </label>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200"
                  >
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-200">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating workspace...
                    </>
                  ) : (
                    "Create Workspace"
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function OnboardingField({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  disabled,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  disabled: boolean;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-300">
        {label}
      </span>

      <div className="relative mt-2">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

        <input
          type="text"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
    </label>
  );
}

function SetupFeature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
      <p className="font-medium text-zinc-200">
        {title}
      </p>

      <p className="mt-1 text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  );
}