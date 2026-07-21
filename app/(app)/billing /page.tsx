"use client";

import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MONTHLY_PRICE = 700;

function formatMoney(value: number) {
  return `R${value.toLocaleString("en-ZA", {
    maximumFractionDigits: 0,
  })}`;
}

export default function BillingPage() {
  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <header>
          <p className="text-sm font-medium text-purple-300">
            Workspace subscription
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Billing
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            Review your future GoodKeeper subscription, payment method, and
            billing history.
          </p>
        </header>

        <section className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-6 md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex max-w-3xl items-start gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-500 text-white">
                <Sparkles className="h-6 w-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-medium text-purple-200">
                    Billing is coming soon
                  </p>

                  <span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1 text-xs font-medium text-purple-200">
                    Preview
                  </span>
                </div>

                <h2 className="mt-3 text-xl font-semibold md:text-2xl">
                  Your GoodKeeper workspace is currently active.
                </h2>

                <p className="mt-3 text-sm leading-7 text-zinc-300">
                  No payment details are required yet. This page is ready for
                  the future subscription and card-payment integration.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-purple-400/20 bg-black/30 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-purple-200/70">
                Current access
              </p>

              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Active
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <BillingMetric
            title="Current Plan"
            value="GoodKeeper Standard"
            description="Core operations and business intelligence"
            icon={Sparkles}
          />

          <BillingMetric
            title="Monthly Price"
            value={formatMoney(MONTHLY_PRICE)}
            description="Planned monthly subscription"
            icon={ReceiptText}
          />

          <BillingMetric
            title="Subscription Status"
            value="Coming Soon"
            description="Billing has not been activated"
            icon={CalendarClock}
          />

          <BillingMetric
            title="Payment Method"
            value="Not Added"
            description="No card details are stored"
            icon={CreditCard}
          />
        </section>

        <section className="grid items-start gap-8 xl:grid-cols-[1.35fr_1fr]">
          <CardShell>
            <CardHeader className="border-b border-zinc-800">
              <CardTitle className="text-xl">Subscription Overview</CardTitle>

              <p className="mt-1 text-sm text-zinc-400">
                The planned subscription details for this workspace.
              </p>
            </CardHeader>

            <CardContent className="space-y-4 p-6">
              <BillingDetail label="Plan" value="GoodKeeper Standard" />
              <BillingDetail label="Billing cycle" value="Monthly" />
              <BillingDetail
                label="Monthly amount"
                value={formatMoney(MONTHLY_PRICE)}
              />
              <BillingDetail label="Next payment date" value="Not scheduled" />
              <BillingDetail
                label="Subscription status"
                value="Billing not yet activated"
              />

              <div className="pt-2">
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 py-3 text-sm font-semibold text-white opacity-50 sm:w-auto"
                >
                  <CreditCard className="h-4 w-4" />
                  Add Payment Method
                </button>

                <p className="mt-3 text-xs leading-5 text-zinc-600">
                  Card collection will be enabled after a secure payment
                  provider is connected.
                </p>
              </div>
            </CardContent>
          </CardShell>

          <div className="space-y-8">
            <CardShell>
              <CardHeader>
                <CardTitle className="text-xl">Payment Security</CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  How future card payments will be handled.
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <SecurityItem
                  icon={LockKeyhole}
                  title="Secure checkout"
                  description="Card details will be collected by a certified payment provider."
                />

                <SecurityItem
                  icon={ShieldCheck}
                  title="No raw card storage"
                  description="GoodKeeper will never store complete card numbers or CVV values."
                />

                <SecurityItem
                  icon={CreditCard}
                  title="Card reference only"
                  description="Only safe details such as card brand and last four digits will be displayed."
                />
              </CardContent>
            </CardShell>

            <CardShell>
              <CardHeader>
                <CardTitle className="text-xl">Billing History</CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Future invoices and subscription payments.
                </p>
              </CardHeader>

              <CardContent>
                <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
                  <FileText className="h-9 w-9 text-zinc-600" />

                  <p className="mt-4 font-medium text-zinc-300">
                    No billing history
                  </p>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                    Invoices and payment records will appear here after billing
                    is activated.
                  </p>
                </div>
              </CardContent>
            </CardShell>
          </div>
        </section>
      </div>
    </main>
  );
}

function BillingMetric({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <CardShell>
      <CardContent className="flex min-h-44 items-start justify-between gap-5 p-6">
        <div className="min-w-0">
          <p className="text-sm text-zinc-400">{title}</p>
          <p className="mt-4 break-words text-2xl font-semibold tracking-tight">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-zinc-600">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10">
          <Icon className="h-5 w-5 text-purple-300" />
        </div>
      </CardContent>
    </CardShell>
  );
}

function BillingDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-medium text-zinc-200">{value}</span>
    </div>
  );
}

function SecurityItem({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
        <Icon className="h-4 w-4 text-purple-300" />
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-200">{title}</p>
        <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
      </div>
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