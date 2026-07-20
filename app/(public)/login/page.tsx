"use client";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Enter your email address."
      );

      return;
    }

    if (!password) {
      setError(
        "Enter your password."
      );

      return;
    }

    setLoading(true);

    try {
      const supabase =
        createClient();

      const {
        data,
        error: signInError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email: normalizedEmail,
            password,
          }
        );

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error(
          "We could not sign you in."
        );
      }

      const {
        data: membership,
        error: membershipError,
      } = await supabase
        .from("business_users")
        .select("business_id")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError) {
        throw membershipError;
      }

      router.replace(
        membership
          ? "/dashboard"
          : "/onboarding"
      );

      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Login failed. Please try again."
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
          <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-zinc-800 bg-[#080808] shadow-[0_0_0_1px_rgba(255,255,255,0.03)] lg:grid-cols-[1.05fr_0.95fr]">
            <div className="hidden border-r border-zinc-800 bg-gradient-to-br from-purple-500/15 via-black to-black p-12 lg:flex lg:flex-col lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Welcome back
                </div>

                <h1 className="mt-8 max-w-md text-4xl font-semibold tracking-tight">
                  Your business, customers and finances in one place.
                </h1>

                <p className="mt-5 max-w-md text-base leading-8 text-zinc-400">
                  Sign in to manage bookings,
                  customers, bookkeeping,
                  reconciliation, reports and
                  AI-powered insights.
                </p>
              </div>

              <div className="mt-16 grid gap-4">
                <FeatureItem
                  title="Manage appointments"
                  description="Review availability, bookings and blocked time."
                />

                <FeatureItem
                  title="Track performance"
                  description="Understand revenue, expenses and customer value."
                />

                <FeatureItem
                  title="Stay organised"
                  description="Keep your business activity in one secure workspace."
                />
              </div>
            </div>

            <div className="p-7 sm:p-10 lg:p-12">
              <div className="mx-auto max-w-md">
                <p className="text-sm font-medium text-purple-300">
                  Account access
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                  Log in to GoodKeeper
                </h2>

                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Enter the email address and
                  password linked to your
                  workspace.
                </p>

                <form
                  onSubmit={
                    handleLogin
                  }
                  className="mt-8 space-y-5"
                >
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-300">
                      Email address
                    </span>

                    <div className="relative mt-2">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(
                          event
                        ) => {
                          setEmail(
                            event.target
                              .value
                          );

                          setError("");
                        }}
                        placeholder="you@example.com"
                        disabled={loading}
                        className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-zinc-300">
                        Password
                      </span>

                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-purple-300 transition hover:text-purple-200"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <div className="relative mt-2">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        autoComplete="current-password"
                        value={
                          password
                        }
                        onChange={(
                          event
                        ) => {
                          setPassword(
                            event.target
                              .value
                          );

                          setError("");
                        }}
                        placeholder="Enter your password"
                        disabled={loading}
                        className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (
                              current
                            ) =>
                              !current
                          )
                        }
                        disabled={loading}
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-zinc-200 disabled:cursor-not-allowed"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </label>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200"
                    >
                      {error}
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
                        Signing in...
                      </>
                    ) : (
                      "Log In"
                    )}
                  </button>
                </form>

                <p className="mt-7 text-center text-sm text-zinc-500">
                  New to GoodKeeper?{" "}
                  <Link
                    href="/signup"
                    className="font-semibold text-purple-300 transition hover:text-purple-200"
                  >
                    Create an account
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
