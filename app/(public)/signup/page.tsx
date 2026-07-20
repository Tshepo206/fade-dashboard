"use client";

import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type SignupForm = {
  ownerName: string;
  businessName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const EMPTY_FORM: SignupForm = {
  ownerName: "",
  businessName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<SignupForm>(EMPTY_FORM);

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  function updateField(
    field: keyof SignupForm,
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
    if (!form.ownerName.trim()) {
      return "Enter your full name.";
    }

    if (!form.businessName.trim()) {
      return "Enter your business name.";
    }

    if (!form.email.trim()) {
      return "Enter your email address.";
    }

    if (form.password.length < 8) {
      return "Your password must contain at least 8 characters.";
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      return "The passwords do not match.";
    }

    return "";
  }

  async function handleSignup(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const supabase =
        createClient();

      const normalizedEmail =
        form.email
          .trim()
          .toLowerCase();

      const redirectUrl =
        `${window.location.origin}/login`;

      const {
        data,
        error: signupError,
      } =
        await supabase.auth.signUp({
          email: normalizedEmail,
          password: form.password,
          options: {
            emailRedirectTo:
              redirectUrl,
            data: {
              owner_name:
                form.ownerName.trim(),
              business_name:
                form.businessName.trim(),
            },
          },
        });

      if (signupError) {
        throw signupError;
      }

      if (!data.user) {
        throw new Error(
          "GoodKeeper could not create your account."
        );
      }

      /*
       * When email confirmation is disabled,
       * Supabase returns a session immediately.
       */
      if (data.session) {
        router.replace(
          "/onboarding"
        );

        router.refresh();
        return;
      }

      setSuccessMessage(
        `We sent a confirmation link to ${normalizedEmail}. Confirm your email, then log in to finish setting up your workspace.`
      );

      setForm(EMPTY_FORM);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Account creation failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-5 py-8 text-white">
      <div className="pointer-events-none absolute left-1/2 top-[-20rem] h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-purple-600/15 blur-[130px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.35)]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="font-semibold text-white">
                GoodKeeper
              </p>

              <p className="text-xs text-zinc-500">
                Business operating system
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-12">
          <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-zinc-800 bg-[#080808] shadow-[0_0_0_1px_rgba(255,255,255,0.03)] lg:grid-cols-[0.95fr_1.05fr]">
            <div className="hidden border-r border-zinc-800 bg-gradient-to-br from-purple-500/15 via-black to-black p-12 lg:flex lg:flex-col lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Create your workspace
                </div>

                <h1 className="mt-8 max-w-md text-4xl font-semibold tracking-tight">
                  Give your service business a smarter way to operate.
                </h1>

                <p className="mt-5 max-w-md text-base leading-8 text-zinc-400">
                  Create your GoodKeeper
                  account and bring bookings,
                  customers, finances and
                  reporting into one workspace.
                </p>
              </div>

              <div className="mt-16 grid gap-4">
                <FeatureItem
                  title="Your own workspace"
                  description="Your customers, bookings and finances stay separate from every other business."
                />

                <FeatureItem
                  title="AI-powered operations"
                  description="Manage appointments and bookkeeping through the GoodKeeper assistant."
                />

                <FeatureItem
                  title="Business visibility"
                  description="Understand performance, customer value and financial activity."
                />
              </div>
            </div>

            <div className="p-7 sm:p-10 lg:p-12">
              <div className="mx-auto max-w-md">
                <p className="text-sm font-medium text-purple-300">
                  Create an account
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                  Start using GoodKeeper
                </h2>

                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Enter your details to create
                  your account and business
                  workspace.
                </p>

                <form
                  onSubmit={
                    handleSignup
                  }
                  className="mt-8 space-y-5"
                >
                  <SignupField
                    label="Your name"
                    value={
                      form.ownerName
                    }
                    onChange={(value) =>
                      updateField(
                        "ownerName",
                        value
                      )
                    }
                    placeholder="Tshepo Khoza"
                    icon={UserRound}
                    disabled={loading}
                    autoComplete="name"
                  />

                  <SignupField
                    label="Business name"
                    value={
                      form.businessName
                    }
                    onChange={(value) =>
                      updateField(
                        "businessName",
                        value
                      )
                    }
                    placeholder="KG Barber"
                    icon={Building2}
                    disabled={loading}
                    autoComplete="organization"
                  />

                  <SignupField
                    label="Email address"
                    value={form.email}
                    onChange={(value) =>
                      updateField(
                        "email",
                        value
                      )
                    }
                    placeholder="you@example.com"
                    icon={Mail}
                    type="email"
                    disabled={loading}
                    autoComplete="email"
                  />

                  <PasswordField
                    label="Password"
                    value={
                      form.password
                    }
                    onChange={(value) =>
                      updateField(
                        "password",
                        value
                      )
                    }
                    visible={
                      showPassword
                    }
                    onToggle={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    placeholder="At least 8 characters"
                    disabled={loading}
                    autoComplete="new-password"
                  />

                  <PasswordField
                    label="Confirm password"
                    value={
                      form.confirmPassword
                    }
                    onChange={(value) =>
                      updateField(
                        "confirmPassword",
                        value
                      )
                    }
                    visible={
                      showConfirmPassword
                    }
                    onToggle={() =>
                      setShowConfirmPassword(
                        (current) =>
                          !current
                      )
                    }
                    placeholder="Repeat your password"
                    disabled={loading}
                    autoComplete="new-password"
                  />

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

                      <span>
                        {successMessage}
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>

                <p className="mt-7 text-center text-sm text-zinc-500">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-purple-300 transition hover:text-purple-200"
                  >
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} GoodKeeper
        </footer>
      </div>
    </main>
  );
}

function SignupField({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
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
  type?: "text" | "email";
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
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={
            autoComplete
          }
          className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
  disabled,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  placeholder: string;
  disabled: boolean;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-300">
        {label}
      </span>

      <div className="relative mt-2">
        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

        <input
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={
            autoComplete
          }
          className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-zinc-200 disabled:cursor-not-allowed"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </label>
  );
}

function FeatureItem({
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
