"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE_URL ="https://fade-ai-api-2csg3.sevalla.app";

type Summary = {
  revenue: number;
  expenses: number;
  profit: number;
  cash: number;
  card: number;
  transactions: number;
};

type Trend = {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
};

type ServiceRevenue = {
  service_name: string;
  revenue: number;
  transactions: number;
};

type Customer = {
  customer_name: string;
  revenue: number;
  visits: number;
};

type Recommendation = {
  type: string;
  title: string;
  message: string;
};

type Booking = {
  id: number;
  customer_name: string;
  service_name: string;
  appointment_timestamp: string;
  status: string;
};

type CalendarSlot = {
  slot_id: number;
  slot_datetime: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED" | string;
  booking_id: number | null;
  blocked_reason: string | null;
  customer_name: string | null;
  service_name: string | null;
};

type Transaction = {
  transaction_timestamp: string;
  debit_amount: number;
  credit_amount: number;
  narrative: string;
  customer_name: string | null;
  payment_method: string | null;
};

type Reconciliation = {
  expected_cash: number;
  expected_card: number;
  expected_total: number;
  unreconciled_amount: number;
  status: string;
};

type BankReconciliationResult = {
  success: boolean;
  period: string;
  bank_transactions_count: number;
  ledger_transactions_checked: number;
  matched_count: number;
  unmatched_bank_count: number;
  unmatched_ledger_count: number;
  match_rate: number;
  total_bank_amount: number;
  total_matched_amount: number;
  matches: any[];
  unmatched_bank: any[];
  unmatched_ledger: any[];
};

function formatMoney(value: number) {
  return `R${Number(value || 0).toLocaleString("en-ZA", {
    maximumFractionDigits: 0,
  })}`;
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-ZA", {
    weekday: "short",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTodayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [trendPeriod, setTrendPeriod] = useState<"week" | "month">("week");
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">(
    "day"
  );
  const [selectedDate, setSelectedDate] = useState(getTodayInputDate());
  const [calendarSlots, setCalendarSlots] = useState<CalendarSlot[]>([]);
  const [blockStartTime, setBlockStartTime] = useState("14:00");
  const [blockEndTime, setBlockEndTime] = useState("16:00");
  const [blockReason, setBlockReason] = useState("");
  const [blockLoading, setBlockLoading] = useState(false);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [services, setServices] = useState<ServiceRevenue[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reconciliation, setReconciliation] = useState<Reconciliation | null>(
    null
  );

  const [bankFile, setBankFile] = useState<File | null>(null);
  const [bankUploadLoading, setBankUploadLoading] = useState(false);
  const [bankUploadError, setBankUploadError] = useState("");
  const [bankResult, setBankResult] =
    useState<BankReconciliationResult | null>(null);

  async function loadDashboard() {
    const [
      summaryRes,
      trendRes,
      serviceRes,
      customerRes,
      aiRes,
      bookingRes,
      transactionRes,
      reconciliationRes,
    ] = await Promise.all([
      fetch(`${API_BASE_URL}/dashboard/summary?period=${period}`),
      fetch(`${API_BASE_URL}/dashboard/revenue-trends?period=${trendPeriod}`),
      fetch(`${API_BASE_URL}/dashboard/revenue-by-service?period=${period}`),
      fetch(`${API_BASE_URL}/dashboard/top-customers?period=month&limit=5`),
      fetch(`${API_BASE_URL}/dashboard/ai-recommendations?period=${period}`),
      fetch(
        `${API_BASE_URL}/dashboard/calendar?view=${calendarView}&target_date=${selectedDate}`
      ),
      fetch(`${API_BASE_URL}/dashboard/transactions?limit=6`),
      fetch(`${API_BASE_URL}/dashboard/bank-reconciliation?period=${period}`),
    ]);

    const summaryData = await summaryRes.json();
    const trendData = await trendRes.json();
    const serviceData = await serviceRes.json();
    const customerData = await customerRes.json();
    const aiData = await aiRes.json();
    const bookingData = await bookingRes.json();
    const transactionData = await transactionRes.json();
    const reconciliationData = await reconciliationRes.json();

    setSummary(summaryData);
    setTrends(trendData.trends || []);
    setServices(serviceData.services || []);
    setCustomers(customerData.customers || []);
    setRecommendations(aiData.recommendations || []);
    setCalendarSlots(bookingData.slots || []);
    setTransactions(transactionData.transactions || []);
    setReconciliation(reconciliationData.reconciliation || null);
  }

  useEffect(() => {
    loadDashboard();
  }, [period, trendPeriod, calendarView, selectedDate]);

  const totalRevenue = summary?.revenue || 0;

  function downloadMonthlyReport() {
    window.open(`${API_BASE_URL}/dashboard/monthly-report/pdf`, "_blank");
  }

  async function uploadBankStatement() {
    if (!bankFile) {
      setBankUploadError("Please choose a CSV or PDF bank statement first.");
      return;
    }

    setBankUploadLoading(true);
    setBankUploadError("");
    setBankResult(null);

    try {
      const formData = new FormData();
      formData.append("file", bankFile);

      const response = await fetch(
        `${API_BASE_URL}/dashboard/bank-reconciliation/upload?period=month`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Bank reconciliation failed.");
      }

      setBankResult(data);
    } catch (error: any) {
      setBankUploadError(error.message || "Bank reconciliation failed.");
    } finally {
      setBankUploadLoading(false);
    }
  }

  async function blockCalendarTime() {
    setBlockLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/calendar/block`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_datetime: `${selectedDate}T${blockStartTime}:00`,
          end_datetime: `${selectedDate}T${blockEndTime}:00`,
          reason: blockReason || "",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not block time.");
      }

      await loadDashboard();
    } catch (error) {
      console.error("Dashboard block failed:", error);
    } finally {
      setBlockLoading(false);
    }
  }

  async function unblockCalendarSlot(slotId: number) {
    const confirmed = window.confirm("Unblock this time slot?");

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/dashboard/calendar/unblock/${slotId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not unblock slot.");
      }

      await loadDashboard();
    } catch (error) {
      console.error("Unblock failed:", error);
    }
  }

  return (
    <main className="min-h-screen bg-black font-sans text-white">
      <div className="mx-auto max-w-7xl space-y-12 px-6 py-10 md:px-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-400">
              Fade AI Business Intelligence
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              KG Barber Workstation
            </h1>
            <p className="mt-2 text-zinc-400">
              Revenue, bookings, payments, and AI business insights.
            </p>
          </div>

          <DashboardTabs
            value={period}
            onChange={(value) => setPeriod(value as "today" | "week" | "month")}
            items={[
              { value: "today", label: "Today" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
        </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard title="Revenue" value={formatMoney(summary?.revenue || 0)} />
          <MetricCard title="Expenses" value={formatMoney(summary?.expenses || 0)} />
          <MetricCard title="Profit" value={formatMoney(summary?.profit || 0)} />
          <MetricCard title="Cash" value={formatMoney(summary?.cash || 0)} />
          <MetricCard title="Card" value={formatMoney(summary?.card || 0)} />
        </section>

        <section className="grid gap-8 xl:grid-cols-[2fr_1fr]">
          <CardShell>
            <CardHeader className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-xl">Revenue Trend</CardTitle>
                <p className="mt-1 text-sm text-zinc-400">
                  Revenue and profit over time.
                </p>
              </div>

              <DashboardTabs
                value={trendPeriod}
                onChange={(value) => setTrendPeriod(value as "week" | "month")}
                items={[
                  { value: "week", label: "Week" },
                  { value: "month", label: "Month" },
                ]}
              />
            </CardHeader>

            <CardContent className="h-[300px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={formatShortDate}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "#111111",
                      border: "1px solid #3f3f46",
                      borderRadius: "14px",
                      color: "#ffffff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ffffff"
                    fill="#ffffff"
                    fillOpacity={0.14}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#c084fc"
                    fill="transparent"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </CardShell>

          <CardShell>
            <CardHeader>
              <CardTitle className="text-xl">Payment Split</CardTitle>
              <p className="mt-1 text-sm text-zinc-400">
                Cash and card sales.
              </p>
            </CardHeader>

            <CardContent className="space-y-8">
              <PaymentRow
                label="Cash"
                amount={summary?.cash || 0}
                total={totalRevenue}
              />
              <PaymentRow
                label="Card"
                amount={summary?.card || 0}
                total={totalRevenue}
              />

              <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-5">
                <p className="text-sm text-zinc-400">Total collected</p>
                <p className="mt-3 text-3xl font-semibold">
                  {formatMoney(totalRevenue)}
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Based on recorded voice transactions.
                </p>
              </div>
            </CardContent>
          </CardShell>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
          <CardShell>
            <CardHeader>
              <CardTitle className="text-xl">Revenue by Service</CardTitle>
              <p className="mt-1 text-sm text-zinc-400">
                Which services are making the most money.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {services.map((service) => (
                <ServiceRow
                  key={service.service_name}
                  service={service}
                  total={totalRevenue}
                />
              ))}
            </CardContent>
          </CardShell>

          <CardShell>
            <CardHeader>
              <CardTitle className="text-xl">Top Customers</CardTitle>
              <p className="mt-1 text-sm text-zinc-400">
                Highest-value customers this month.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {customers.map((customer, index) => (
                <div
                  key={customer.customer_name}
                  className="flex items-center gap-4 rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
                    {customer.customer_name.slice(0, 1)}
                  </div>

                  <div className="flex-1">
                    <p className="font-medium">{customer.customer_name}</p>
                    <p className="text-sm text-zinc-400">
                      {customer.visits} visits
                    </p>
                  </div>

                  <div className="text-right">
                    <Badge className="bg-purple-500/20 text-purple-200">
                      #{index + 1}
                    </Badge>
                    <p className="mt-1 font-semibold">
                      {formatMoney(customer.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </CardShell>
        </section>

        <section className="grid items-start gap-8 xl:grid-cols-3">
          <CardShell>
            <CardHeader>
              <CardTitle className="text-xl">Fade AI</CardTitle>
              <p className="mt-1 text-sm text-zinc-400">
                Recommendations for the business.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {recommendations.slice(0, 4).map((item) => (
                <div
                  key={`${item.type}-${item.title}`}
                  className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4"
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {item.message}
                  </p>
                </div>
              ))}
            </CardContent>
          </CardShell>

          <CardShell>
            <CardHeader>
              <CardTitle className="text-xl">Reconciliation</CardTitle>
              <p className="mt-1 text-sm text-zinc-400">
                Expected money collected.
              </p>
            </CardHeader>

            <CardContent className="space-y-5">
              <ReconRow
                label="Expected Cash"
                value={formatMoney(reconciliation?.expected_cash || 0)}
              />
              <ReconRow
                label="Expected Card"
                value={formatMoney(reconciliation?.expected_card || 0)}
              />
              <ReconRow
                label="Expected Total"
                value={formatMoney(reconciliation?.expected_total || 0)}
              />
              <ReconRow
                label="Unreconciled"
                value={formatMoney(reconciliation?.unreconciled_amount || 0)}
              />

              <Badge className="bg-amber-500/20 text-amber-200">
                {reconciliation?.status || "Pending reconciliation"}
              </Badge>
            </CardContent>
          </CardShell>

          <CardShell>
            <CardHeader className="space-y-5">
              <div>
                <CardTitle className="text-xl">Calendar</CardTitle>
                <p className="mt-1 text-sm text-zinc-400">
                  Availability, bookings, and blocked slots.
                </p>
              </div>

              <DashboardTabs
                value={calendarView}
                onChange={(value) =>
                  setCalendarView(value as "day" | "week" | "month")
                }
                items={[
                  { value: "day", label: "Day" },
                  { value: "week", label: "Week" },
                  { value: "month", label: "Month" },
                ]}
              />
            </CardHeader>

            <CardContent className="space-y-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white [color-scheme:dark]"
              />

              <div className="grid gap-3 rounded-2xl border border-zinc-700 bg-zinc-900/60 p-4">
                <p className="text-sm font-medium text-zinc-200">
                  Manual block
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="time"
                    value={blockStartTime}
                    onChange={(event) => setBlockStartTime(event.target.value)}
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white [color-scheme:dark]"
                  />

                  <input
                    type="time"
                    value={blockEndTime}
                    onChange={(event) => setBlockEndTime(event.target.value)}
                    className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white [color-scheme:dark]"
                  />
                </div>

                <input
                  type="text"
                  value={blockReason}
                  onChange={(event) => setBlockReason(event.target.value)}
                  placeholder="Reason"
                  className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
                />

                <button
                  onClick={blockCalendarTime}
                  disabled={blockLoading}
                  className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-400 disabled:opacity-60"
                >
                  {blockLoading ? "Blocking..." : "Block time"}
                </button>
              </div>

              <div className="grid gap-3">
                {calendarSlots.length === 0 && (
                  <p className="text-sm text-zinc-400">
                    No slots found for this date.
                  </p>
                )}

                {calendarSlots.map((slot) => {
                  const time = new Date(slot.slot_datetime).toLocaleTimeString(
                    "en-ZA",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );

                  const statusClass =
                    slot.status === "BLOCKED"
                      ? "border-red-500/40 bg-red-500/10 text-red-200"
                      : slot.status === "BOOKED"
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-200"
                      : "border-green-500/40 bg-green-500/10 text-green-200";

                  return (
                    <div
                      key={slot.slot_id}
                      className={`rounded-2xl border p-4 ${statusClass}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium">{time}</p>
                        <Badge className="bg-black/30 text-white">
                          {slot.status}
                        </Badge>
                      </div>

                      {slot.status === "BOOKED" && (
                        <div className="mt-2">
                          <p className="text-sm font-medium opacity-95">
                            {slot.customer_name || "Booked customer"}
                          </p>
                          <p className="text-xs opacity-75">
                            {slot.service_name || "Service"}
                          </p>
                        </div>
                      )}

                      {slot.status === "BLOCKED" && (
                        <div className="mt-2 space-y-3">
                          <p className="text-sm opacity-80">Blocked time</p>

                          <button
                            onClick={() => unblockCalendarSlot(slot.slot_id)}
                            className="rounded-full border border-red-500/50 px-3 py-1 text-xs font-medium text-red-200 transition hover:bg-red-500/10"
                          >
                            Remove block
                          </button>
                        </div>
                      )}

                      {slot.status === "AVAILABLE" && (
                        <p className="mt-2 text-sm opacity-80">Available</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </CardShell>
        </section>

        <section className="grid items-start gap-8 xl:grid-cols-[1fr_1.4fr]">
          <CardShell>
            <CardHeader>
              <CardTitle className="text-xl">Monthly Business Report</CardTitle>
              <p className="mt-1 text-sm text-zinc-400">
                Download a PDF summary of revenue, profit, customers, services,
                and AI commentary.
              </p>
            </CardHeader>

            <CardContent>
              <button
                onClick={downloadMonthlyReport}
                className="w-full rounded-2xl bg-purple-500 px-5 py-3 font-medium text-white transition hover:bg-purple-400"
              >
                Download PDF Report
              </button>
            </CardContent>
          </CardShell>

          <CardShell>
            <CardHeader>
              <CardTitle className="text-xl">Smart Bank Reconciliation</CardTitle>
              <p className="mt-1 text-sm text-zinc-400">
                Upload a CSV or PDF bank statement. Fade will match it against
                voice-bookkept transactions.
              </p>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-5">
                <input
                  type="file"
                  accept=".csv,.pdf"
                  onChange={(event) =>
                    setBankFile(event.target.files?.[0] || null)
                  }
                  className="block w-full text-sm text-zinc-400 file:mr-4 file:rounded-xl file:border-0 file:bg-purple-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-purple-400"
                />

                {bankFile && (
                  <p className="mt-3 text-sm text-zinc-300">
                    Selected: {bankFile.name}
                  </p>
                )}
              </div>

              {bankUploadError && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {bankUploadError}
                </p>
              )}

              <button
                onClick={uploadBankStatement}
                disabled={bankUploadLoading}
                className="w-full rounded-2xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bankUploadLoading
                  ? "Reconciling statement..."
                  : "Upload & Reconcile"}
              </button>
            </CardContent>
          </CardShell>
        </section>

        {bankResult && <BankReconciliationResults result={bankResult} />}

        <section>
          <CardShell>
            <CardHeader>
              <CardTitle className="text-xl">Recent Voice Transactions</CardTitle>
              <p className="mt-1 text-sm text-zinc-400">
                Latest income and expense entries.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {transactions.map((transaction, index) => {
                const amount =
                  Number(transaction.credit_amount || 0) ||
                  Number(transaction.debit_amount || 0);

                return (
                  <div
                    key={`${transaction.transaction_timestamp}-${index}`}
                    className="grid gap-4 rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4 md:grid-cols-[2fr_1fr_1fr_1fr]"
                  >
                    <div>
                      <p className="font-medium">{transaction.narrative}</p>
                      <p className="mt-1 text-sm text-zinc-400">
                        {formatDateTime(transaction.transaction_timestamp)}
                      </p>
                    </div>

                    <p className="text-sm text-zinc-400">
                      {transaction.customer_name || "Unknown customer"}
                    </p>

                    <p className="text-sm text-zinc-400">
                      {transaction.payment_method || "No method"}
                    </p>

                    <p className="text-right font-semibold">
                      {formatMoney(amount)}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </CardShell>
        </section>
      </div>
    </main>
  );
}

function BankReconciliationResults({
  result,
}: {
  result: BankReconciliationResult;
}) {
  return (
    <section className="space-y-6">
      <CardShell>
        <CardHeader>
          <CardTitle className="text-xl">Reconciliation Results</CardTitle>
          <p className="mt-1 text-sm text-zinc-400">
            Bank statement compared against Fade voice bookkeeping.
          </p>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-5">
          <ResultMetric label="Match Rate" value={`${result.match_rate}%`} />
          <ResultMetric label="Matched" value={String(result.matched_count)} />
          <ResultMetric
            label="Missing from Fade"
            value={String(result.unmatched_bank_count)}
          />
          <ResultMetric
            label="Missing from Bank"
            value={String(result.unmatched_ledger_count)}
          />
          <ResultMetric
            label="Bank Total"
            value={formatMoney(result.total_bank_amount)}
          />
        </CardContent>
      </CardShell>

      <div className="grid gap-8 xl:grid-cols-3">
        <ResultList
          title="Matched"
          badgeClass="bg-green-500/20 text-green-200"
          items={result.matches}
          emptyText="No matched transactions yet."
          type="matched"
        />

        <ResultList
          title="Missing from Fade"
          badgeClass="bg-amber-500/20 text-amber-200"
          items={result.unmatched_bank}
          emptyText="No missing bank transactions."
          type="bank"
        />

        <ResultList
          title="Missing from Bank"
          badgeClass="bg-red-500/20 text-red-200"
          items={result.unmatched_ledger}
          emptyText="No missing ledger transactions."
          type="ledger"
        />
      </div>
    </section>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ResultList({
  title,
  badgeClass,
  items,
  emptyText,
  type,
}: {
  title: string;
  badgeClass: string;
  items: any[];
  emptyText: string;
  type: "matched" | "bank" | "ledger";
}) {
  return (
    <CardShell>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          <Badge className={badgeClass}>{items.length}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-zinc-400">{emptyText}</p>
        )}

        {items.slice(0, 8).map((item, index) => {
          const bankTx = item.bank_transaction;
          const ledgerTx = item.ledger_transaction;

          if (type === "matched") {
            return (
              <ResultItem
                key={index}
                title={ledgerTx?.narrative || "Matched transaction"}
                amount={bankTx?.amount || ledgerTx?.amount || 0}
                subtitle={ledgerTx?.customer_name || bankTx?.description || ""}
                status="Matched"
              />
            );
          }

          if (type === "bank") {
            return (
              <ResultItem
                key={index}
                title={bankTx?.description || "Bank transaction"}
                amount={bankTx?.amount || 0}
                subtitle={item.suggested_action}
                status="Review"
              />
            );
          }

          return (
            <ResultItem
              key={index}
              title={ledgerTx?.narrative || "Fade transaction"}
              amount={ledgerTx?.amount || 0}
              subtitle={item.suggested_action}
              status="Review"
            />
          );
        })}
      </CardContent>
    </CardShell>
  );
}

function ResultItem({
  title,
  amount,
  subtitle,
  status,
}: {
  title: string;
  amount: number;
  subtitle: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-sm leading-5 text-zinc-400">{subtitle}</p>
        </div>

        <div className="text-right">
          <p className="font-semibold">{formatMoney(amount)}</p>
          <Badge className="mt-2 bg-zinc-800 text-zinc-300">{status}</Badge>
        </div>
      </div>
    </div>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <Card className="rounded-3xl border border-zinc-700 bg-[#080808] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      {children}
    </Card>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="rounded-3xl border border-zinc-700 bg-[#080808] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <CardContent className="p-7">
        <p className="text-sm text-zinc-400">{title}</p>
        <p className="mt-6 text-3xl font-semibold tracking-tight text-white">{value}</p>
      </CardContent>
    </Card>
  );
}

function DashboardTabs({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string }[];
}) {
  return (
    <Tabs value={value} onValueChange={onChange}>
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

function PaymentRow({
  label,
  amount,
  total,
}: {
  label: string;
  amount: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;

  return (
    <div>
      <div className="mb-3 flex justify-between text-sm">
        <span className="text-zinc-300">{label}</span>
        <span className="font-medium">{formatMoney(amount)}</span>
      </div>

      <div className="h-3 rounded-full bg-zinc-800">
        <div
          className="h-3 rounded-full bg-purple-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-zinc-400">{percentage}% of revenue</p>
    </div>
  );
}

function ServiceRow({
  service,
  total,
}: {
  service: ServiceRevenue;
  total: number;
}) {
  const percentage = total > 0 ? Math.round((service.revenue / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-medium">{service.service_name}</p>
          <p className="text-sm text-zinc-400">
            {service.transactions} transactions
          </p>
        </div>

        <div className="text-right">
          <p className="font-semibold">{formatMoney(service.revenue)}</p>
          <p className="text-sm text-zinc-400">{percentage}%</p>
        </div>
      </div>

      <div className="h-3 rounded-full bg-zinc-800">
        <div
          className="h-3 rounded-full bg-purple-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ReconRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-700 pb-4">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}