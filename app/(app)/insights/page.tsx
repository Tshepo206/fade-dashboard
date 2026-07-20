"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  BrainCircuit,
  RefreshCw,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
  WalletCards,
} from "lucide-react";

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

type InsightPeriod = "today" | "week" | "month";

type Recommendation = {
  type: string;
  title: string;
  message: string;
};

type RecommendationResponse = {
  recommendations?: Recommendation[];
};

type InsightCategory =
  | "all"
  | "revenue"
  | "customers"
  | "operations";

function normaliseInsightType(value: string) {
  return value.trim().toLowerCase();
}

function getInsightCategory(type: string): Exclude<InsightCategory, "all"> {
  const normalisedType = normaliseInsightType(type);

  if (
    normalisedType.includes("customer") ||
    normalisedType.includes("retention") ||
    normalisedType.includes("client") ||
    normalisedType.includes("loyalty")
  ) {
    return "customers";
  }

  if (
    normalisedType.includes("revenue") ||
    normalisedType.includes("sales") ||
    normalisedType.includes("profit") ||
    normalisedType.includes("pricing") ||
    normalisedType.includes("income")
  ) {
    return "revenue";
  }

  return "operations";
}

function getCategoryLabel(category: Exclude<InsightCategory, "all">) {
  if (category === "revenue") {
    return "Revenue";
  }

  if (category === "customers") {
    return "Customers";
  }

  return "Operations";
}

function getCategoryStyles(category: Exclude<InsightCategory, "all">) {
  if (category === "revenue") {
    return {
      iconContainer: "bg-emerald-500/10",
      icon: "text-emerald-300",
      badge: "bg-emerald-500/15 text-emerald-200",
    };
  }

  if (category === "customers") {
    return {
      iconContainer: "bg-blue-500/10",
      icon: "text-blue-300",
      badge: "bg-blue-500/15 text-blue-200",
    };
  }

  return {
    iconContainer: "bg-purple-500/10",
    icon: "text-purple-300",
    badge: "bg-purple-500/15 text-purple-200",
  };
}

function getCategoryIcon(category: Exclude<InsightCategory, "all">) {
  if (category === "revenue") {
    return TrendingUp;
  }

  if (category === "customers") {
    return UserRoundCheck;
  }

  return BrainCircuit;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const responseText = await response.text();

    throw new Error(
      responseText.trim().startsWith("<")
        ? "The AI insight service returned a web page instead of data. Check that the FastAPI backend is running and NEXT_PUBLIC_API_BASE_URL points to the backend."
        : "The AI insight service returned an invalid response."
    );
  }

  return response.json() as Promise<T>;
}

export default function InsightsPage() {
  const [period, setPeriod] = useState<InsightPeriod>("month");
  const [category, setCategory] = useState<InsightCategory>("all");

  const [recommendations, setRecommendations] = useState<
    Recommendation[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/dashboard/ai-recommendations?period=${period}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await parseJsonResponse<RecommendationResponse>(response);

      if (!response.ok) {
        throw new Error("Could not load AI business insights.");
      }

      setRecommendations(data.recommendations || []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load AI business insights.";

      setError(message);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const categorisedRecommendations = useMemo(() => {
    return recommendations.map((recommendation) => ({
      ...recommendation,
      category: getInsightCategory(recommendation.type),
    }));
  }, [recommendations]);

  const filteredRecommendations = useMemo(() => {
    if (category === "all") {
      return categorisedRecommendations;
    }

    return categorisedRecommendations.filter(
      (recommendation) => recommendation.category === category
    );
  }, [categorisedRecommendations, category]);

  const revenueInsightCount = categorisedRecommendations.filter(
    (recommendation) => recommendation.category === "revenue"
  ).length;

  const customerInsightCount = categorisedRecommendations.filter(
    (recommendation) => recommendation.category === "customers"
  ).length;

  const operationalInsightCount = categorisedRecommendations.filter(
    (recommendation) => recommendation.category === "operations"
  ).length;

  const primaryInsight = categorisedRecommendations[0] || null;

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-purple-300">
              GoodKeeper intelligence
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              AI Insights
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
              Turn business activity into practical recommendations for
              revenue, operations, and customer retention.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadInsights}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                className={[
                  "h-4 w-4",
                  loading ? "animate-spin" : "",
                ].join(" ")}
              />

              Refresh insights
            </button>

            <PeriodTabs
              value={period}
              onChange={(value) => {
                setPeriod(value);
                setCategory("all");
              }}
            />
          </div>
        </header>

        {error && (
          <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
            {error}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InsightMetric
            title="Total Insights"
            value={String(recommendations.length)}
            description={`Recommendations for this ${period}`}
            icon={Sparkles}
            loading={loading}
          />

          <InsightMetric
            title="Revenue Insights"
            value={String(revenueInsightCount)}
            description="Sales, pricing, and profitability"
            icon={TrendingUp}
            loading={loading}
          />

          <InsightMetric
            title="Customer Insights"
            value={String(customerInsightCount)}
            description="Retention and customer behaviour"
            icon={UserRoundCheck}
            loading={loading}
          />

          <InsightMetric
            title="Operational Insights"
            value={String(operationalInsightCount)}
            description="Workflow and business efficiency"
            icon={BrainCircuit}
            loading={loading}
          />
        </section>

        {primaryInsight && !loading && (
          <section>
            <CardShell>
              <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
                <div className="flex max-w-3xl items-start gap-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-500 text-white shadow-lg shadow-purple-500/20">
                    <Bot className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-medium text-purple-300">
                        Priority recommendation
                      </p>

                      <Badge className="bg-purple-500/15 text-purple-200">
                        GoodKeeper AI
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
              </CardContent>
            </CardShell>
          </section>
        )}

        <section className="grid items-start gap-8 xl:grid-cols-[2fr_1fr]">
          <CardShell>
            <CardHeader className="border-b border-zinc-800">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <CardTitle className="text-xl">
                    Business Recommendations
                  </CardTitle>

                  <p className="mt-1 text-sm text-zinc-400">
                    Recommendations generated from GoodKeeper business data.
                  </p>
                </div>

                <CategoryTabs
                  value={category}
                  onChange={setCategory}
                />
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <InsightLoadingState />
              ) : filteredRecommendations.length === 0 ? (
                <InsightEmptyState category={category} />
              ) : (
                <div className="space-y-4">
                  {filteredRecommendations.map(
                    (recommendation, index) => (
                      <InsightCard
                        key={`${recommendation.type}-${recommendation.title}-${index}`}
                        recommendation={recommendation}
                      />
                    )
                  )}
                </div>
              )}
            </CardContent>
          </CardShell>

          <div className="space-y-8">
            <CardShell>
              <CardHeader>
                <CardTitle className="text-xl">
                  Business Coaching
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Guidance designed to help the owner improve performance.
                </p>
              </CardHeader>

              <CardContent>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10">
                    <BrainCircuit className="h-5 w-5 text-purple-300" />
                  </div>

                  <p className="mt-4 text-sm font-medium text-zinc-200">
                    AI business coach
                  </p>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    GoodKeeper will use revenue, customer, appointment, and
                    expense patterns to provide practical business coaching.
                  </p>
                </div>
              </CardContent>
            </CardShell>

            <CardShell>
              <CardHeader>
                <CardTitle className="text-xl">
                  Revenue Intelligence
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Planned financial insight capabilities.
                </p>
              </CardHeader>

              <CardContent>
                <FutureInsightList
                  items={[
                    "Identify underperforming services",
                    "Highlight peak revenue periods",
                    "Recommend pricing opportunities",
                    "Detect unusual expense movements",
                    "Compare revenue growth over time",
                  ]}
                />
              </CardContent>
            </CardShell>

            <CardShell>
              <CardHeader>
                <CardTitle className="text-xl">
                  Customer Retention
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Planned customer relationship insights.
                </p>
              </CardHeader>

              <CardContent>
                <FutureInsightList
                  items={[
                    "Customers due for a return visit",
                    "High-value customers becoming inactive",
                    "Rebooking opportunities",
                    "Favourite service recommendations",
                    "Customer loyalty trends",
                  ]}
                />
              </CardContent>
            </CardShell>
          </div>
        </section>
      </div>
    </main>
  );
}

function InsightCard({
  recommendation,
}: {
  recommendation: Recommendation & {
    category: Exclude<InsightCategory, "all">;
  };
}) {
  const Icon = getCategoryIcon(recommendation.category);
  const styles = getCategoryStyles(recommendation.category);

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700">
      <div className="flex items-start gap-4">
        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            styles.iconContainer,
          ].join(" ")}
        >
          <Icon
            className={[
              "h-5 w-5",
              styles.icon,
            ].join(" ")}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-medium text-white">
                {recommendation.title}
              </h3>

              <Badge className={styles.badge}>
                {getCategoryLabel(recommendation.category)}
              </Badge>
            </div>
          </div>

          <p className="mt-3 text-sm leading-7 text-zinc-400">
            {recommendation.message}
          </p>
        </div>
      </div>
    </article>
  );
}

function InsightMetric({
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
        <div>
          <p className="text-sm text-zinc-400">{title}</p>

          {loading ? (
            <div className="mt-4 h-9 w-20 animate-pulse rounded-lg bg-zinc-800" />
          ) : (
            <p className="mt-4 text-3xl font-semibold tracking-tight">
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

function FutureInsightList({
  items,
}: {
  items: string[];
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item}
          className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-purple-300" />

          <span className="text-sm text-zinc-300">
            {item}
          </span>
        </div>
      ))}
    </div>
  );
}

function InsightLoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60"
        />
      ))}
    </div>
  );
}

function InsightEmptyState({
  category,
}: {
  category: InsightCategory;
}) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
      <Bot className="h-9 w-9 text-zinc-600" />

      <p className="mt-4 font-medium text-zinc-300">
        No insights available
      </p>

      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        {category === "all"
          ? "GoodKeeper insights will appear here as more business activity is recorded."
          : `No ${category} insights were found for the selected period.`}
      </p>
    </div>
  );
}

function CategoryTabs({
  value,
  onChange,
}: {
  value: InsightCategory;
  onChange: (value: InsightCategory) => void;
}) {
  const items: {
    value: InsightCategory;
    label: string;
  }[] = [
    {
      value: "all",
      label: "All",
    },
    {
      value: "revenue",
      label: "Revenue",
    },
    {
      value: "customers",
      label: "Customers",
    },
    {
      value: "operations",
      label: "Operations",
    },
  ];

  return (
    <div className="flex max-w-full overflow-x-auto rounded-xl border border-zinc-700 bg-zinc-900 p-1">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={[
            "whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition",
            value === item.value
              ? "bg-purple-500 text-white"
              : "text-zinc-400 hover:text-white",
          ].join(" ")}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function PeriodTabs({
  value,
  onChange,
}: {
  value: InsightPeriod;
  onChange: (value: InsightPeriod) => void;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(newValue) =>
        onChange(newValue as InsightPeriod)
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