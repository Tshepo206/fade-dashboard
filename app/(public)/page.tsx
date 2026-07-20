import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="max-w-3xl text-center">
        <p className="text-sm font-medium text-purple-300">
          GoodKeeper
        </p>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
          Run your service business from one intelligent workspace.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-400 md:text-lg">
          Manage bookings, customers,
          bookkeeping, reconciliation, and
          reporting with an AI-powered
          business operating system.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-xl bg-purple-500 px-6 py-3 font-semibold text-white transition hover:bg-purple-400"
          >
            Create Account
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3 font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800"
          >
            Log In
          </Link>
        </div>
      </section>
    </main>
  );
}