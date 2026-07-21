"use client";

import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Bot,
  CalendarDays,
  CalendarRange,
  CreditCard,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
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
import { apiRequest } from "@/lib/api";
import { getCurrentWorkspace } from "@/lib/workspace";


type DashboardPeriod = "today" | "week" | "month";
type TrendPeriod = "week" | "month";

type Summary = {
  success?: boolean;
  period?: string;
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

type Recommendation = {
  type: string;
  title: string;
  message: string;
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

type TrendResponse = {
  trends?: Trend[];
};

type RecommendationResponse = {
  recommendations?: Recommendation[];
};

type CalendarResponse = {
  slots?: CalendarSlot[];
};

const emptySummary: Summary = {
  revenue: 0,
  expenses: 0,
  profit: 0,
  cash: 0,
  card: 0,
  transactions: 0,
};

function getTodayInputDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatMoney(value: number) {
  return `R${Number(value || 0).toLocaleString("en-ZA", {
    maximumFractionDigits: 0,
  })}`;
}

function formatShortDate(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("en-ZA", {
    weekday: "short",
  });
}

function formatAppointmentTime(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAppointmentDate(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function DashboardPage() {
  const [period, setPeriod] =
    useState<DashboardPeriod>("today");

  const [trendPeriod, setTrendPeriod] =
    useState<TrendPeriod>("week");

  const [summary, setSummary] =
    useState<Summary>(emptySummary);

  const [trends, setTrends] = useState<Trend[]>([]);

  const [recommendations, setRecommendations] = useState<
    Recommendation[]
  >([]);

  const [todaySlots, setTodaySlots] = useState<CalendarSlot[]>([]);
  const [weekSlots, setWeekSlots] = useState<CalendarSlot[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workspaceName, setWorkspaceName] = useState("GoodKeeper");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const today = getTodayInputDate();

    try {
      const [
        summaryData,
        trendData,
        recommendationData,
        todayCalendarData,
        weekCalendarData,
      ] = await Promise.all([
        apiRequest<Summary>(
          `/dashboard/summary?period=${period}`
        ),
        apiRequest<TrendResponse>(
          `/dashboard/revenue-trends?period=${trendPeriod}`
        ),
        apiRequest<RecommendationResponse>(
          `/dashboard/ai-recommendations?period=${period}`
        ),
        apiRequest<CalendarResponse>(
          `/dashboard/calendar?view=day&target_date=${today}`
        ),
        apiRequest<CalendarResponse>(
          `/dashboard/calendar?view=week&target_date=${today}`
        ),
      ]);

      setSummary({
        revenue: Number(summaryData.revenue || 0),
        expenses: Number(summaryData.expenses || 0),
        profit: Number(summaryData.profit || 0),
        cash: Number(summaryData.cash || 0),
        card: Number(summaryData.card || 0),
        transactions: Number(summaryData.transactions || 0),
        success: summaryData.success,
        period: summaryData.period,
      });

      setTrends(trendData.trends || []);
      setRecommendations(
        recommendationData.recommendations || []
      );
      setTodaySlots(todayCalendarData.slots || []);
      setWeekSlots(weekCalendarData.slots || []);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Could not load Dashboard information.";

      setError(message);
      setSummary(emptySummary);
      setTrends([]);
      setRecommendations([]);
      setTodaySlots([]);
      setWeekSlots([]);
    } finally {
      setLoading(false);
    }
  }, [period, trendPeriod]);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const workspace = await getCurrentWorkspace();

        if (workspace.business_name) {
          setWorkspaceName(workspace.business_name);
        }
      } catch (workspaceError) {
        console.error(
          "Workspace loading failed:",
          workspaceError
        );
      }
    }

    void loadWorkspace();
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const todayAppointments = useMemo(() => {
    return todaySlots
      .filter((slot) => slot.status === "BOOKED")
      .sort(
        (first, second) =>
          new Date(first.slot_datetime).getTime() -
          new Date(second.slot_datetime).getTime()
      );
  }, [todaySlots]);

  const upcomingAppointments = useMemo(() => {
    const currentTime = Date.now();

    return weekSlots
      .filter(
        (slot) =>
          slot.status === "BOOKED" &&
          new Date(slot.slot_datetime).getTime() >= currentTime
      )
      .sort(
        (first, second) =>
          new Date(first.slot_datetime).getTime() -
          new Date(second.slot_datetime).getTime()
      )
      .slice(0, 6);
  }, [weekSlots]);

  const primaryInsight = recommendations[0] || null;

  const cashPercentage =
    summary.revenue > 0
      ? Math.round((summary.cash / summary.revenue) * 100)
      : 0;

  const cardPercentage =
    summary.revenue > 0
      ? Math.round((summary.card / summary.revenue) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-purple-300">
              GoodKeeper business overview
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              {workspaceName} Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
              A high-level view of financial performance, payments,
              appointments, and business intelligence.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void loadDashboard()}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                className={[
                  "h-4 w-4",
                  loading ? "animate-spin" : "",
                ].join(" ")}
              />

              Refresh
            </button>

            <DashboardPeriodTabs
              value={period}
              onChange={setPeriod}
            />
          </div>
        </header>

        {error && (
          <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
            {error}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Revenue"
            value={formatMoney(summary.revenue)}
            description={`${summary.transactions} recorded transactions`}
            icon={TrendingUp}
            loading={loading}
          />

          <MetricCard
            title="Expenses"
            value={formatMoney(summary.expenses)}
            description="Recorded business expenses"
            icon={TrendingDown}
            loading={loading}
          />

          <MetricCard
            title="Profit"
            value={formatMoney(summary.profit)}
            description="Revenue less expenses"
            icon={WalletCards}
            loading={loading}
          />

          <MetricCard
            title="Cash"
            value={formatMoney(summary.cash)}
            description={`${cashPercentage}% of recorded revenue`}
            icon={Banknote}
            loading={loading}
          />

          <MetricCard
            title="Card"
            value={formatMoney(summary.card)}
            description={`${cardPercentage}% of recorded revenue`}
            icon={CreditCard}
            loading={loading}
          />
        </section>

        <section className="grid items-start gap-8 xl:grid-cols-[2fr_1fr]">
          <CardShell>
            <CardHeader className="flex flex-col gap-5 border-b border-zinc-800 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-xl">
                  Revenue Trend
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Revenue, expenses, and profit over time.
                </p>
              </div>

              <TrendPeriodTabs
                value={trendPeriod}
                onChange={setTrendPeriod}
              />
            </CardHeader>

            <CardContent className="h-[360px] p-6">
              {loading ? (
                <DashboardLoadingBlock />
              ) : trends.length === 0 ? (
                <DashboardEmptyState
                  title="No trend data"
                  description="Revenue performance will appear here as transactions are recorded."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#27272a"
                    />

                    <XAxis
                      dataKey="date"
                      stroke="#71717a"
                      fontSize={12}
                      tickFormatter={formatShortDate}
                    />

                    <YAxis
                      stroke="#71717a"
                      fontSize={12}
                    />

                    <Tooltip
                      formatter={(value) =>
                        formatMoney(Number(value || 0))
                      }
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
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />

                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke="#c084fc"
                      fill="transparent"
                      strokeWidth={2}
                    />

                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="#f87171"
                      fill="transparent"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </CardShell>

          <CardShell>
            <CardHeader>
              <CardTitle className="text-xl">
                Payment Split
              </CardTitle>

              <p className="mt-1 text-sm text-zinc-400">
                Cash and card revenue for the selected period.
              </p>
            </CardHeader>

            <CardContent className="space-y-7">
              <PaymentRow
                label="Cash"
                amount={summary.cash}
                total={summary.revenue}
              />

              <PaymentRow
                label="Card"
                amount={summary.card}
                total={summary.revenue}
              />

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                <p className="text-sm text-zinc-400">
                  Total collected
                </p>

                {loading ? (
                  <div className="mt-3 h-9 w-32 animate-pulse rounded-lg bg-zinc-800" />
                ) : (
                  <p className="mt-3 text-3xl font-semibold">
                    {formatMoney(summary.revenue)}
                  </p>
                )}

                <p className="mt-2 text-xs leading-5 text-zinc-600">
                  Based on recorded GoodKeeper transactions.
                </p>
              </div>

              <Link
                href="/transactions"
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-purple-500/50 hover:text-white"
              >
                View transactions
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </CardShell>
        </section>

        <section className="grid items-start gap-8 xl:grid-cols-2">
          <AppointmentPanel
            title="Today’s Appointments"
            description="Bookings scheduled for today."
            appointments={todayAppointments}
            loading={loading}
            emptyMessage="There are no appointments scheduled for today."
            showDate={false}
          />

          <AppointmentPanel
            title="Upcoming Appointments"
            description="The next confirmed bookings."
            appointments={upcomingAppointments}
            loading={loading}
            emptyMessage="There are no upcoming appointments."
            showDate
          />
        </section>

        <section>
          <CardShell>
            <CardContent className="p-6 md:p-8">
              {loading ? (
                <div className="h-40 animate-pulse rounded-2xl bg-zinc-900" />
              ) : primaryInsight ? (
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex max-w-4xl items-start gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-500 text-white shadow-lg shadow-purple-500/20">
                      <Bot className="h-6 w-6" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm font-medium text-purple-300">
                          GoodKeeper AI Summary
                        </p>

                        <Badge className="bg-purple-500/15 text-purple-200">
                          {period}
                        </Badge>
                      </div>

                      <h2 className="mt-3 text-xl font-semibold md:text-2xl">
                        {primaryInsight.title}
                      </h2>

                      <p className="mt-3 text-sm leading-7 text-zinc-400">
                        {primaryInsight.message}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/insights"
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-400"
                  >
                    View all insights
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <DashboardEmptyState
                  title="No AI summary available"
                  description="GoodKeeper will provide a business summary when more activity has been recorded."
                />
              )}
            </CardContent>
          </CardShell>
        </section>
      </div>
    </main>
  );
}

function AppointmentPanel({
  title,
  description,
  appointments,
  loading,
  emptyMessage,
  showDate,
}: {
  title: string;
  description: string;
  appointments: CalendarSlot[];
  loading: boolean;
  emptyMessage: string;
  showDate: boolean;
}) {
  return (
    <CardShell>
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-zinc-800">
        <div>
          <CardTitle className="text-xl">
            {title}
          </CardTitle>

          <p className="mt-1 text-sm text-zinc-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
          {showDate ? (
            <CalendarRange className="h-5 w-5 text-purple-300" />
          ) : (
            <CalendarDays className="h-5 w-5 text-purple-300" />
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60"
              />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
            <CalendarDays className="h-8 w-8 text-zinc-600" />

            <p className="mt-4 text-sm text-zinc-500">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <AppointmentRow
                key={
                  appointment.booking_id ||
                  appointment.slot_id
                }
                appointment={appointment}
                showDate={showDate}
              />
            ))}
          </div>
        )}

        <Link
          href="/calendar"
          className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-purple-500/50 hover:text-white"
        >
          Open calendar
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </CardShell>
  );
}

function AppointmentRow({
  appointment,
  showDate,
}: {
  appointment: CalendarSlot;
  showDate: boolean;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex min-w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-purple-500/10 px-3 py-3 text-center">
        <p className="text-sm font-semibold text-purple-200">
          {formatAppointmentTime(
            appointment.slot_datetime
          )}
        </p>

        {showDate && (
          <p className="mt-1 text-[10px] text-purple-300/60">
            {formatAppointmentDate(
              appointment.slot_datetime
            )}
          </p>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white">
          {appointment.customer_name || "Booked customer"}
        </p>

        <p className="mt-1 truncate text-sm text-zinc-500">
          {appointment.service_name || "Service not specified"}
        </p>
      </div>

      <Badge className="bg-blue-500/15 text-blue-200">
        Booked
      </Badge>
    </article>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
}) {
  return (
    <CardShell>
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div className="min-w-0">
          <p className="text-sm text-zinc-400">
            {title}
          </p>

          {loading ? (
            <div className="mt-4 h-9 w-28 animate-pulse rounded-lg bg-zinc-800" />
          ) : (
            <p className="mt-4 text-3xl font-semibold tracking-tight">
              {value}
            </p>
          )}

          <p className="mt-2 text-xs leading-5 text-zinc-600">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
          <Icon className="h-5 w-5 text-purple-300" />
        </div>
      </CardContent>
    </CardShell>
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
  const percentage =
    total > 0
      ? Math.round((amount / total) * 100)
      : 0;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4 text-sm">
        <span className="text-zinc-300">
          {label}
        </span>

        <span className="font-medium text-white">
          {formatMoney(amount)}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-purple-500 transition-all"
          style={{
            width: `${Math.min(percentage, 100)}%`,
          }}
        />
      </div>

      <p className="mt-2 text-xs text-zinc-600">
        {percentage}% of revenue
      </p>
    </div>
  );
}

function DashboardPeriodTabs({
  value,
  onChange,
}: {
  value: DashboardPeriod;
  onChange: (value: DashboardPeriod) => void;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(newValue) =>
        onChange(newValue as DashboardPeriod)
      }
    >
      <TabsList className="gap-1 rounded-xl border border-zinc-700 bg-zinc-900 p-1">
        <TabsTrigger
          value="today"
          className="rounded-lg px-4 py-1.5 text-zinc-300 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
        >
          Today
        </TabsTrigger>

        <TabsTrigger
          value="week"
          className="rounded-lg px-4 py-1.5 text-zinc-300 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
        >
          Week
        </TabsTrigger>

        <TabsTrigger
          value="month"
          className="rounded-lg px-4 py-1.5 text-zinc-300 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
        >
          Month
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function TrendPeriodTabs({
  value,
  onChange,
}: {
  value: TrendPeriod;
  onChange: (value: TrendPeriod) => void;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(newValue) =>
        onChange(newValue as TrendPeriod)
      }
    >
      <TabsList className="gap-1 rounded-xl border border-zinc-700 bg-zinc-900 p-1">
        <TabsTrigger
          value="week"
          className="rounded-lg px-4 py-1.5 text-zinc-300 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
        >
          Week
        </TabsTrigger>

        <TabsTrigger
          value="month"
          className="rounded-lg px-4 py-1.5 text-zinc-300 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
        >
          Month
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function DashboardLoadingBlock() {
  return (
    <div className="h-full animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60" />
  );
}

function DashboardEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
      <TrendingUp className="h-8 w-8 text-zinc-600" />

      <p className="mt-4 font-medium text-zinc-300">
        {title}
      </p>

      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {description}
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
    <Card className="rounded-3xl border border-zinc-700 bg-[#080808] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      {children}
    </Card>
  );
}