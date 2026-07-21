"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Filter,
  ReceiptText,
  Search,
  Sparkles,
  WalletCards,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiRequest } from "@/lib/api";

const TRANSACTIONS_PER_PAGE = 8;

type TransactionFilter =
  | "all"
  | "income"
  | "expense";

type TransactionPeriod =
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "quarter"
  | "year"
  | "last_year"
  | "custom";

type Transaction = {
  id?: number | string;
  entry_id?: number;
  booking_id?: number | null;
  transaction_timestamp: string;
  debit_amount: number;
  credit_amount: number;
  narrative: string;
  customer_name: string | null;
  service_name?: string | null;
  payment_method: string | null;
  account_type?: string | null;
};

type TransactionSummary = {
  revenue?: number;
  income?: number;
  expenses?: number;
  profit?: number;
  net_movement?: number;
  cash?: number;
  card?: number;
  other_payments?: number;
  transactions?: number;
  transaction_count?: number;
  income_transactions?: number;
  expense_transactions?: number;
  cash_transactions?: number;
  card_transactions?: number;
  other_payment_transactions?: number;
};

type TransactionsResponse = {
  success?: boolean;
  period?: TransactionPeriod;
  start_date?: string;
  end_date?: string;
  start_datetime?: string;
  end_datetime?: string;
  count?: number;
  summary?: TransactionSummary;
  transactions?: Transaction[];
  detail?: string;
  error?: string | null;
};

const PERIOD_OPTIONS: Array<{
  value: TransactionPeriod;
  label: string;
}> = [
  {
    value: "last_7_days",
    label: "Last 7 Days",
  },
  {
    value: "last_30_days",
    label: "Last 30 Days",
  },
  {
    value: "this_month",
    label: "This Month",
  },
  {
    value: "last_month",
    label: "Last Month",
  },
  {
    value: "quarter",
    label: "This Quarter",
  },
  {
    value: "year",
    label: "This Year",
  },
  {
    value: "last_year",
    label: "Last Year",
  },
  {
    value: "custom",
    label: "Custom Range",
  },
];

function getTodayInputDate() {
  const now = new Date();
  const timezoneOffset =
    now.getTimezoneOffset() * 60_000;

  return new Date(
    now.getTime() - timezoneOffset
  )
    .toISOString()
    .slice(0, 10);
}

function getMonthStartInputDate() {
  const today = new Date();
  const monthStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );
  const timezoneOffset =
    monthStart.getTimezoneOffset() * 60_000;

  return new Date(
    monthStart.getTime() - timezoneOffset
  )
    .toISOString()
    .slice(0, 10);
}

function formatMoney(value: number) {
  return `R${Number(
    value || 0
  ).toLocaleString("en-ZA", {
    maximumFractionDigits: 0,
  })}`;
}

function formatTransactionDate(
  value: string
) {
  const parsedDate = new Date(value);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return value;
  }

  return parsedDate.toLocaleString(
    "en-ZA",
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatDateRange(
  startDate?: string,
  endDate?: string
) {
  if (!startDate || !endDate) {
    return "Selected period";
  }

  const start = new Date(
    `${startDate}T00:00:00`
  );
  const end = new Date(
    `${endDate}T00:00:00`
  );

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return `${startDate} to ${endDate}`;
  }

  return `${start.toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  )} – ${end.toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  )}`;
}

function normaliseText(
  value:
    | string
    | number
    | null
    | undefined
) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getTransactionAmount(
  transaction: Transaction
) {
  const credit = Number(
    transaction.credit_amount || 0
  );
  const debit = Number(
    transaction.debit_amount || 0
  );

  return credit > 0 ? credit : debit;
}

function isIncomeTransaction(
  transaction: Transaction
) {
  return (
    Number(
      transaction.credit_amount || 0
    ) > 0
  );
}

export default function TransactionsPage() {
  const [
    transactions,
    setTransactions,
  ] = useState<Transaction[]>([]);

  const [summary, setSummary] =
    useState<TransactionSummary>({});

  const [period, setPeriod] =
    useState<TransactionPeriod>(
      "last_30_days"
    );

  const [customStartDate, setCustomStartDate] =
    useState(
      getMonthStartInputDate()
    );

  const [customEndDate, setCustomEndDate] =
    useState(getTodayInputDate());

  const [appliedStartDate, setAppliedStartDate] =
    useState<string | undefined>();

  const [appliedEndDate, setAppliedEndDate] =
    useState<string | undefined>();

  const [responseStartDate, setResponseStartDate] =
    useState<string | undefined>();

  const [responseEndDate, setResponseEndDate] =
    useState<string | undefined>();

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    transactionFilter,
    setTransactionFilter,
  ] =
    useState<TransactionFilter>("all");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadTransactions =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const query = new URLSearchParams({
          period,
          limit: "2000",
        });

        if (period === "custom") {
          if (
            !appliedStartDate ||
            !appliedEndDate
          ) {
            throw new Error(
              "Select a start date and end date, then click Apply Range."
            );
          }

          query.set(
            "start_date",
            appliedStartDate
          );
          query.set(
            "end_date",
            appliedEndDate
          );
        }

        const data =
          await apiRequest<TransactionsResponse>(
            `/dashboard/transactions?${query.toString()}`,
            {
              cache: "no-store",
            }
          );

        if (!data.success) {
          throw new Error(
            data.detail ||
              data.error ||
              "Could not load transaction history."
          );
        }

        setTransactions(
          data.transactions || []
        );
        setSummary(data.summary || {});
        setResponseStartDate(
          data.start_date
        );
        setResponseEndDate(
          data.end_date
        );
      } catch (requestError) {
        setTransactions([]);
        setSummary({});
        setResponseStartDate(undefined);
        setResponseEndDate(undefined);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Could not load transaction history."
        );
      } finally {
        setLoading(false);
      }
    }, [
      period,
      appliedStartDate,
      appliedEndDate,
    ]);

  useEffect(() => {
    if (
      period !== "custom" ||
      (appliedStartDate &&
        appliedEndDate)
    ) {
      void loadTransactions();
    }
  }, [
    period,
    appliedStartDate,
    appliedEndDate,
    loadTransactions,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    transactionFilter,
    period,
  ]);

  function handlePeriodChange(
    newPeriod: TransactionPeriod
  ) {
    setPeriod(newPeriod);

    if (newPeriod !== "custom") {
      setAppliedStartDate(undefined);
      setAppliedEndDate(undefined);
    }
  }

  function applyCustomRange() {
    setError("");

    if (
      !customStartDate ||
      !customEndDate
    ) {
      setError(
        "Select both a start date and an end date."
      );
      return;
    }

    if (
      customStartDate >
      customEndDate
    ) {
      setError(
        "The end date must be on or after the start date."
      );
      return;
    }

    setAppliedStartDate(
      customStartDate
    );
    setAppliedEndDate(customEndDate);
  }

  const filteredTransactions =
    useMemo(() => {
      const query = normaliseText(
        searchTerm
      );

      return transactions.filter(
        (transaction) => {
          const income =
            isIncomeTransaction(
              transaction
            );

          const matchesFilter =
            transactionFilter ===
              "all" ||
            (transactionFilter ===
              "income" && income) ||
            (transactionFilter ===
              "expense" && !income);

          if (!matchesFilter) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchableText = [
            transaction.narrative,
            transaction.customer_name,
            transaction.service_name,
            transaction.payment_method,
            transaction.account_type,
            formatTransactionDate(
              transaction.transaction_timestamp
            ),
            String(
              getTransactionAmount(
                transaction
              )
            ),
          ]
            .map(normaliseText)
            .join(" ");

          return searchableText.includes(
            query
          );
        }
      );
    }, [
      transactions,
      searchTerm,
      transactionFilter,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredTransactions.length /
        TRANSACTIONS_PER_PAGE
    )
  );

  const paginatedTransactions =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        TRANSACTIONS_PER_PAGE;

      return filteredTransactions.slice(
        startIndex,
        startIndex +
          TRANSACTIONS_PER_PAGE
      );
    }, [
      filteredTransactions,
      currentPage,
    ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const firstDisplayedTransaction =
    filteredTransactions.length === 0
      ? 0
      : (currentPage - 1) *
          TRANSACTIONS_PER_PAGE +
        1;

  const lastDisplayedTransaction =
    Math.min(
      currentPage *
        TRANSACTIONS_PER_PAGE,
      filteredTransactions.length
    );

  const selectedPeriodLabel =
    PERIOD_OPTIONS.find(
      (option) =>
        option.value === period
    )?.label || "Selected Period";

  const revenue = Number(
    summary.revenue ??
      summary.income ??
      0
  );

  const expenses = Number(
    summary.expenses || 0
  );

  const profit = Number(
    summary.profit ??
      summary.net_movement ??
      revenue - expenses
  );

  const transactionCount = Number(
    summary.transaction_count ??
      summary.transactions ??
      transactions.length
  );

  const cashAmount = Number(
    summary.cash || 0
  );

  const cardAmount = Number(
    summary.card || 0
  );

  const otherAmount = Number(
    summary.other_payments || 0
  );

  const cashCount = Number(
    summary.cash_transactions || 0
  );

  const cardCount = Number(
    summary.card_transactions || 0
  );

  const otherCount = Number(
    summary.other_payment_transactions ||
      0
  );

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-purple-300">
              Bookkeeping activity
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Transactions
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400 md:text-base">
              Review historical revenue,
              expenses, profit, payment
              methods, and transaction
              activity.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block min-w-[210px]">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Financial period
              </span>

              <select
                value={period}
                onChange={(event) =>
                  handlePeriodChange(
                    event.target
                      .value as TransactionPeriod
                  )
                }
                className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-white outline-none transition focus:border-purple-500 [color-scheme:dark]"
              >
                {PERIOD_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </label>

            <button
              type="button"
              onClick={() =>
                void loadTransactions()
              }
              disabled={loading}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </header>

        {period === "custom" && (
          <section className="rounded-3xl border border-zinc-700 bg-[#080808] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] lg:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <CalendarRange className="h-5 w-5 text-purple-300" />

                  <h2 className="text-lg font-semibold">
                    Custom Date Range
                  </h2>
                </div>

                <p className="mt-2 text-sm text-zinc-500">
                  Select the exact period you
                  want to review.
                </p>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-[1fr_1fr_auto] lg:max-w-3xl">
                <label>
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Start date
                  </span>

                  <input
                    type="date"
                    value={customStartDate}
                    max={customEndDate}
                    onChange={(event) =>
                      setCustomStartDate(
                        event.target.value
                      )
                    }
                    className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-white outline-none transition focus:border-purple-500 [color-scheme:dark]"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    End date
                  </span>

                  <input
                    type="date"
                    value={customEndDate}
                    min={customStartDate}
                    onChange={(event) =>
                      setCustomEndDate(
                        event.target.value
                      )
                    }
                    className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-white outline-none transition focus:border-purple-500 [color-scheme:dark]"
                  />
                </label>

                <button
                  type="button"
                  onClick={applyCustomRange}
                  className="h-12 self-end rounded-xl bg-purple-500 px-5 text-sm font-semibold text-white transition hover:bg-purple-400"
                >
                  Apply Range
                </button>
              </div>
            </div>
          </section>
        )}

        {error && (
          <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
            {error}
          </section>
        )}

        <section className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-300">
              {selectedPeriodLabel}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              {formatDateRange(
                responseStartDate,
                responseEndDate
              )}
            </p>
          </div>

          <Badge className="w-fit bg-purple-500/15 text-purple-200">
            {transactionCount} transactions
          </Badge>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Revenue"
            value={formatMoney(revenue)}
            description={`${Number(
              summary.income_transactions || 0
            )} income transactions`}
            icon={ArrowUpRight}
            loading={loading}
            valueClassName="text-emerald-300"
          />

          <MetricCard
            title="Expenses"
            value={formatMoney(expenses)}
            description={`${Number(
              summary.expense_transactions || 0
            )} expense transactions`}
            icon={ArrowDownRight}
            loading={loading}
            valueClassName="text-red-300"
          />

          <MetricCard
            title="Profit"
            value={formatMoney(profit)}
            description="Revenue less expenses"
            icon={WalletCards}
            loading={loading}
            valueClassName={
              profit >= 0
                ? "text-sky-300"
                : "text-red-300"
            }
          />

          <MetricCard
            title="Transactions"
            value={String(
              transactionCount
            )}
            description={`${cashCount} cash · ${cardCount} card`}
            icon={ReceiptText}
            loading={loading}
          />
        </section>

        <section className="grid items-start gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <CardShell>
            <CardHeader className="border-b border-zinc-800 p-0">
              <div className="flex flex-col gap-5 p-5 lg:p-6">
                <div>
                  <CardTitle className="text-2xl">
                    Transaction History
                  </CardTitle>

                  <p className="mt-1 text-sm leading-6 text-zinc-400">
                    Recorded income and expense
                    entries for the selected
                    period.
                  </p>
                </div>

                <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(
                          event.target.value
                        )
                      }
                      placeholder="Search customer, service, payment method, or narrative..."
                      className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500"
                    />
                  </div>

                  <div className="flex h-12 w-full shrink-0 items-center gap-1 overflow-x-auto rounded-xl border border-zinc-700 bg-zinc-900 p-1 lg:w-auto">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center text-zinc-500">
                      <Filter className="h-4 w-4" />
                    </div>

                    <FilterButton
                      label="All"
                      active={
                        transactionFilter ===
                        "all"
                      }
                      onClick={() =>
                        setTransactionFilter(
                          "all"
                        )
                      }
                    />

                    <FilterButton
                      label="Income"
                      active={
                        transactionFilter ===
                        "income"
                      }
                      onClick={() =>
                        setTransactionFilter(
                          "income"
                        )
                      }
                    />

                    <FilterButton
                      label="Expenses"
                      active={
                        transactionFilter ===
                        "expense"
                      }
                      onClick={() =>
                        setTransactionFilter(
                          "expense"
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <TransactionLoadingState />
              ) : filteredTransactions.length ===
                0 ? (
                <TransactionEmptyState
                  hasSearch={Boolean(
                    searchTerm.trim()
                  )}
                  filter={transactionFilter}
                />
              ) : (
                <>
                  <div className="space-y-4 p-5 lg:p-6">
                    {paginatedTransactions.map(
                      (
                        transaction,
                        index
                      ) => (
                        <TransactionRow
                          key={
                            transaction.entry_id ??
                            transaction.id ??
                            `${transaction.transaction_timestamp}-${index}`
                          }
                          transaction={transaction}
                        />
                      )
                    )}
                  </div>

                  <PaginationFooter
                    currentPage={currentPage}
                    totalPages={totalPages}
                    firstItem={
                      firstDisplayedTransaction
                    }
                    lastItem={
                      lastDisplayedTransaction
                    }
                    totalItems={
                      filteredTransactions.length
                    }
                    onPrevious={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(
                            1,
                            page - 1
                          )
                      )
                    }
                    onNext={() =>
                      setCurrentPage(
                        (page) =>
                          Math.min(
                            totalPages,
                            page + 1
                          )
                      )
                    }
                    onPageChange={
                      setCurrentPage
                    }
                  />
                </>
              )}
            </CardContent>
          </CardShell>

          <div className="space-y-8">
            <CardShell>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Payment Overview
                </CardTitle>

                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Revenue received by payment
                  method for this period.
                </p>
              </CardHeader>

              <CardContent className="space-y-5">
                <PaymentSummaryRow
                  label="Cash"
                  amount={cashAmount}
                  count={cashCount}
                  icon={Banknote}
                  amountClassName="text-emerald-300"
                />

                <PaymentSummaryRow
                  label="Card"
                  amount={cardAmount}
                  count={cardCount}
                  icon={CreditCard}
                  amountClassName="text-sky-300"
                />

                <PaymentSummaryRow
                  label="Other payments"
                  amount={otherAmount}
                  count={otherCount}
                  icon={WalletCards}
                  amountClassName="text-purple-300"
                />
              </CardContent>
            </CardShell>

            <CardShell>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Voice Bookkeeping
                </CardTitle>

                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Transactions recorded through
                  the GoodKeeper assistant.
                </p>
              </CardHeader>

              <CardContent>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10">
                    <Sparkles className="h-6 w-6 text-purple-300" />
                  </div>

                  <p className="mt-6 font-medium text-white">
                    WhatsApp voice transactions
                  </p>

                  <p className="mt-3 text-sm leading-7 text-zinc-500">
                    Income and expense entries
                    captured through WhatsApp
                    appear automatically in this
                    history.
                  </p>
                </div>
              </CardContent>
            </CardShell>

            <CardShell>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Manual Transactions
                </CardTitle>

                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Planned transaction-management
                  capability.
                </p>
              </CardHeader>

              <CardContent>
                <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 p-6">
                  <p className="font-medium text-zinc-300">
                    Coming in a future phase
                  </p>

                  <p className="mt-3 text-sm leading-7 text-zinc-500">
                    The owner will be able to add,
                    edit, categorise, and correct
                    transactions directly from
                    this page.
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

function TransactionRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  const income =
    isIncomeTransaction(transaction);

  const amount =
    getTransactionAmount(transaction);

  const transactionType =
    transaction.account_type?.trim() ||
    (income ? "Income" : "Expense");

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700 hover:bg-zinc-900/70">
      <div className="flex flex-col gap-5">
        <div className="flex min-w-0 items-start justify-between gap-5">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div
              className={[
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                income
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-red-500/10 text-red-300",
              ].join(" ")}
            >
              {income ? (
                <ArrowUpRight className="h-5 w-5" />
              ) : (
                <ArrowDownRight className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="whitespace-normal break-normal text-base font-medium leading-6 text-white">
                {transaction.narrative ||
                  transactionType}
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                {formatTransactionDate(
                  transaction.transaction_timestamp
                )}
              </p>

              {transaction.service_name && (
                <p className="mt-2 text-sm text-zinc-400">
                  {transaction.service_name}
                </p>
              )}
            </div>
          </div>

          <p
            className={[
              "shrink-0 whitespace-nowrap text-lg font-semibold",
              income
                ? "text-emerald-300"
                : "text-red-300",
            ].join(" ")}
          >
            {income ? "+" : "-"}
            {formatMoney(amount)}
          </p>
        </div>

        <div className="grid gap-4 border-t border-zinc-800 pt-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(180px,auto)]">
          <TransactionDetail
            label="Customer"
            value={
              transaction.customer_name ||
              "Not applicable"
            }
          />

          <TransactionDetail
            label="Payment"
            value={
              transaction.payment_method ||
              "Unspecified"
            }
          />

          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-zinc-600">
              Type
            </p>

            <Badge
              className={
                income
                  ? "mt-2 max-w-full whitespace-normal break-normal bg-emerald-500/15 text-emerald-200"
                  : "mt-2 max-w-full whitespace-normal break-normal bg-red-500/15 text-red-200"
              }
            >
              {transactionType}
            </Badge>
          </div>
        </div>
      </div>
    </article>
  );
}

function TransactionDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-zinc-600">
        {label}
      </p>

      <p className="mt-2 whitespace-normal break-normal text-sm leading-6 text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function PaginationFooter({
  currentPage,
  totalPages,
  firstItem,
  lastItem,
  totalItems,
  onPrevious,
  onNext,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  firstItem: number;
  lastItem: number;
  totalItems: number;
  onPrevious: () => void;
  onNext: () => void;
  onPageChange: (
    page: number
  ) => void;
}) {
  const pageNumbers =
    getVisiblePageNumbers(
      currentPage,
      totalPages
    );

  return (
    <div className="flex flex-col gap-4 border-t border-zinc-800 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
      <p className="text-sm text-zinc-500">
        Showing{" "}
        <span className="font-medium text-zinc-300">
          {firstItem}
        </span>
        {" – "}
        <span className="font-medium text-zinc-300">
          {lastItem}
        </span>{" "}
        of{" "}
        <span className="font-medium text-zinc-300">
          {totalItems}
        </span>{" "}
        transactions
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="flex h-10 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">
            Previous
          </span>
        </button>

        {pageNumbers.map(
          (pageNumber, index) => {
            if (
              pageNumber === "ellipsis"
            ) {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-10 min-w-8 items-center justify-center text-sm text-zinc-600"
                >
                  …
                </span>
              );
            }

            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() =>
                  onPageChange(
                    pageNumber
                  )
                }
                aria-label={`Go to page ${pageNumber}`}
                aria-current={
                  currentPage ===
                  pageNumber
                    ? "page"
                    : undefined
                }
                className={[
                  "flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-medium transition",
                  currentPage ===
                  pageNumber
                    ? "bg-purple-500 text-white"
                    : "border border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-white",
                ].join(" ")}
              >
                {pageNumber}
              </button>
            );
          }
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={
            currentPage === totalPages
          }
          aria-label="Next page"
          className="flex h-10 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="hidden sm:inline">
            Next
          </span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function getVisiblePageNumbers(
  currentPage: number,
  totalPages: number
): Array<number | "ellipsis"> {
  if (totalPages <= 5) {
    return Array.from(
      {
        length: totalPages,
      },
      (_, index) => index + 1
    );
  }

  if (currentPage <= 3) {
    return [
      1,
      2,
      3,
      4,
      "ellipsis",
      totalPages,
    ];
  }

  if (
    currentPage >=
    totalPages - 2
  ) {
    return [
      1,
      "ellipsis",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-purple-500 text-white"
          : "text-zinc-400 hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
  valueClassName = "text-white",
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  loading: boolean;
  valueClassName?: string;
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
            <p
              className={`mt-4 text-3xl font-semibold tracking-tight ${valueClassName}`}
            >
              {value}
            </p>
          )}

          <p className="mt-3 text-xs leading-5 text-zinc-600">
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

function PaymentSummaryRow({
  label,
  amount,
  count,
  icon: Icon,
  amountClassName,
}: {
  label: string;
  amount: number;
  count: number;
  icon: React.ComponentType<{
    className?: string;
  }>;
  amountClassName: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-5 last:border-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900">
          <Icon className="h-4 w-4 text-purple-300" />
        </div>

        <div>
          <p className="text-sm text-zinc-300">
            {label}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            {count} transactions
          </p>
        </div>
      </div>

      <span
        className={`font-semibold ${amountClassName}`}
      >
        {formatMoney(amount)}
      </span>
    </div>
  );
}

function TransactionLoadingState() {
  return (
    <div className="space-y-4 p-5 lg:p-6">
      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60"
        />
      ))}
    </div>
  );
}

function TransactionEmptyState({
  hasSearch,
  filter,
}: {
  hasSearch: boolean;
  filter: TransactionFilter;
}) {
  let description =
    "Transactions recorded through GoodKeeper will appear here.";

  if (hasSearch) {
    description =
      "No transactions match your current search.";
  } else if (
    filter === "income"
  ) {
    description =
      "There are no income transactions for this period.";
  } else if (
    filter === "expense"
  ) {
    description =
      "There are no expense transactions for this period.";
  }

  return (
    <div className="p-5 lg:p-6">
      <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
        <ReceiptText className="h-9 w-9 text-zinc-600" />

        <p className="mt-4 font-medium text-zinc-300">
          No transactions found
        </p>

        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
          {description}
        </p>
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