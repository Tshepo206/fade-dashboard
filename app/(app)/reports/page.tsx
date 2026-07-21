"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarRange,
  Download,
  FileText,
  LineChart,
  Scissors,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

type ReportPeriod = "week" | "month";

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

type TrendResponse = {
  trends?: Trend[];
};

type ServiceResponse = {
  services?: ServiceRevenue[];
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

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [trends, setTrends] = useState<Trend[]>([]);
  const [services, setServices] = useState<ServiceRevenue[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [trendData, serviceData] = await Promise.all([
        apiRequest<TrendResponse>(
          `/dashboard/revenue-trends?period=${period}`,
          {
            cache: "no-store",
          }
        ),
        apiRequest<ServiceResponse>(
          `/dashboard/revenue-by-service?period=${period}`,
          {
            cache: "no-store",
          }
        ),
      ]);

      setTrends(trendData.trends || []);
      setServices(serviceData.services || []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load report data.";

      setError(message);
      setTrends([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  function downloadMonthlyReport() {
    window.open(
      `${API_BASE_URL}/dashboard/monthly-report/pdf`,
      "_blank"
    );
  }

  const totalRevenue = trends.reduce(
    (total, item) => total + Number(item.revenue || 0),
    0
  );

  const totalExpenses = trends.reduce(
    (total, item) => total + Number(item.expenses || 0),
    0
  );

  const totalProfit = trends.reduce(
    (total, item) => total + Number(item.profit || 0),
    0
  );

  const topService = useMemo(() => {
    if (services.length === 0) {
      return null;
    }

    return [...services].sort(
      (first, second) =>
        Number(second.revenue || 0) -
        Number(first.revenue || 0)
    )[0];
  }, [services]);

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-purple-300">
              Business reporting
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Reports
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
              Review historical business performance, revenue by service, and
              downloadable monthly reports.
            </p>
          </div>

          <PeriodTabs
            value={period}
            onChange={setPeriod}
          />
        </header>

        {error && (
          <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
            {error}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ReportMetric
            title="Revenue"
            value={formatMoney(totalRevenue)}
            description={`Recorded revenue for the selected ${period}`}
            icon={TrendingUp}
            loading={loading}
          />

          <ReportMetric
            title="Expenses"
            value={formatMoney(totalExpenses)}
            description="Recorded business expenses"
            icon={BarChart3}
            loading={loading}
          />

          <ReportMetric
            title="Profit"
            value={formatMoney(totalProfit)}
            description="Revenue less expenses"
            icon={LineChart}
            loading={loading}
          />

          <ReportMetric
            title="Top Service"
            value={topService?.service_name || "No data"}
            description={
              topService
                ? formatMoney(topService.revenue)
                : "No service revenue recorded"
            }
            icon={Scissors}
            loading={loading}
          />
        </section>

        <section className="grid items-start gap-8 xl:grid-cols-[2fr_1fr]">
          <CardShell>
            <CardHeader className="flex flex-col gap-5 border-b border-zinc-800 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-xl">
                  Historical Performance
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Revenue, expenses, and profit over time.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-400">
                <CalendarRange className="h-4 w-4 text-purple-300" />
                {period === "week" ? "Weekly view" : "Monthly view"}
              </div>
            </CardHeader>

            <CardContent className="h-[420px] p-6">
              {loading ? (
                <div className="h-full animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60" />
              ) : trends.length === 0 ? (
                <ReportEmptyState
                  title="No historical data"
                  description="Revenue trend data will appear here when transactions are available."
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
                Monthly Business Report
              </CardTitle>

              <p className="mt-1 text-sm text-zinc-400">
                Download a PDF summary of revenue, profit, customers, services,
                and AI commentary.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10">
                  <FileText className="h-5 w-5 text-purple-300" />
                </div>

                <p className="mt-4 text-sm font-medium text-zinc-200">
                  GoodKeeper monthly report
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  The current report includes financial performance, customer
                  activity, service performance, and AI-generated commentary.
                </p>
              </div>

              <button
                type="button"
                onClick={downloadMonthlyReport}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-400"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </button>
            </CardContent>
          </CardShell>
        </section>

        <section>
          <CardShell>
            <CardHeader className="border-b border-zinc-800">
              <CardTitle className="text-xl">
                Revenue by Service
              </CardTitle>

              <p className="mt-1 text-sm text-zinc-400">
                Understand which services are driving business revenue.
              </p>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-36 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60"
                    />
                  ))}
                </div>
              ) : services.length === 0 ? (
                <ReportEmptyState
                  title="No service data"
                  description="Service-level revenue will appear here once transactions are recorded against services."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {services.map((service) => (
                    <ServiceReportCard
                      key={service.service_name}
                      service={service}
                      totalRevenue={services.reduce(
                        (total, currentService) =>
                          total +
                          Number(currentService.revenue || 0),
                        0
                      )}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </CardShell>
        </section>

        <section className="grid gap-8 md:grid-cols-2">
          <CardShell>
            <CardHeader>
              <CardTitle className="text-xl">
                Historical Reporting
              </CardTitle>

              <p className="mt-1 text-sm text-zinc-400">
                Planned reporting expansion.
              </p>
            </CardHeader>

            <CardContent>
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-5">
                <p className="text-sm font-medium text-zinc-300">
                  Coming in the next reporting phase
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  GoodKeeper will support custom date ranges, prior-month
                  comparisons, year-to-date performance, and year-over-year
                  reporting.
                </p>
              </div>
            </CardContent>
          </CardShell>

          <CardShell>
            <CardHeader>
              <CardTitle className="text-xl">
                Additional Exports
              </CardTitle>

              <p className="mt-1 text-sm text-zinc-400">
                Planned report-delivery options.
              </p>
            </CardHeader>

            <CardContent>
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-5">
                <p className="text-sm font-medium text-zinc-300">
                  Future export formats
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  CSV, Excel, scheduled email reports, and accountant-ready
                  reporting packs can be added after historical reporting is
                  implemented.
                </p>
              </div>
            </CardContent>
          </CardShell>
        </section>
      </div>
    </main>
  );
}

function ServiceReportCard({
  service,
  totalRevenue,
}: {
  service: ServiceRevenue;
  totalRevenue: number;
}) {
  const percentage =
    totalRevenue > 0
      ? Math.round(
          (Number(service.revenue || 0) / totalRevenue) * 100
        )
      : 0;

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-white">
            {service.service_name}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            {service.transactions} transactions
          </p>
        </div>

        <div className="text-right">
          <p className="font-semibold text-white">
            {formatMoney(service.revenue)}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {percentage}% of revenue
          </p>
        </div>
      </div>

      <div className="mt-5 h-2 rounded-full bg-zinc-800">
        <div
          className="h-2 rounded-full bg-purple-500"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </article>
  );
}

function ReportMetric({
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
      <CardContent className="flex items-start justify-between gap-5 p-6">
        <div className="min-w-0">
          <p className="text-sm text-zinc-400">{title}</p>

          {loading ? (
            <div className="mt-4 h-9 w-28 animate-pulse rounded-lg bg-zinc-800" />
          ) : (
            <p className="mt-4 truncate text-3xl font-semibold tracking-tight">
              {value}
            </p>
          )}

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

function ReportEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
      <LineChart className="h-9 w-9 text-zinc-600" />

      <p className="mt-4 font-medium text-zinc-300">
        {title}
      </p>

      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function PeriodTabs({
  value,
  onChange,
}: {
  value: ReportPeriod;
  onChange: (value: ReportPeriod) => void;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(newValue) =>
        onChange(newValue as ReportPeriod)
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