"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  Landmark,
  RefreshCw,
  Upload,
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

type ReconciliationPeriod = "today" | "week" | "month";

type ReconciliationSummary = {
  expected_cash: number;
  expected_card: number;
  expected_total: number;
  unreconciled_amount: number;
  status: string;
};

type ReconciliationResponse = {
  reconciliation?: ReconciliationSummary;
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
  matches: ReconciliationMatch[];
  unmatched_bank: UnmatchedBankItem[];
  unmatched_ledger: UnmatchedLedgerItem[];
};

type BankTransaction = {
  date?: string;
  description?: string;
  amount?: number;
  reference?: string;
};

type LedgerTransaction = {
  transaction_timestamp?: string;
  narrative?: string;
  amount?: number;
  customer_name?: string | null;
  payment_method?: string | null;
};

type ReconciliationMatch = {
  bank_transaction?: BankTransaction;
  ledger_transaction?: LedgerTransaction;
  suggested_action?: string;
};

type UnmatchedBankItem = {
  bank_transaction?: BankTransaction;
  suggested_action?: string;
};

type UnmatchedLedgerItem = {
  ledger_transaction?: LedgerTransaction;
  suggested_action?: string;
};

type ResultView = "matched" | "missing-from-goodkeeper" | "missing-from-bank";

function formatMoney(value: number) {
  return `R${Number(value || 0).toLocaleString("en-ZA", {
    maximumFractionDigits: 0,
  })}`;
}

function formatPercentage(value: number) {
  return `${Number(value || 0).toLocaleString("en-ZA", {
    maximumFractionDigits: 1,
  })}%`;
}

function formatDate(value?: string) {
  if (!value) {
    return "Date unavailable";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const responseText = await response.text();

    throw new Error(
      responseText.trim().startsWith("<")
        ? "The reconciliation service returned a web page instead of data. Check that the FastAPI backend is running and NEXT_PUBLIC_API_BASE_URL points to the backend."
        : "The reconciliation service returned an invalid response."
    );
  }

  return response.json() as Promise<T>;
}

export default function ReconciliationPage() {
  const [period, setPeriod] =
    useState<ReconciliationPeriod>("month");

  const [summary, setSummary] =
    useState<ReconciliationSummary | null>(null);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const [bankFile, setBankFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadResult, setUploadResult] =
    useState<BankReconciliationResult | null>(null);

  const [resultView, setResultView] =
    useState<ResultView>("matched");

  const loadReconciliationSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/dashboard/bank-reconciliation?period=${period}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await parseJsonResponse<ReconciliationResponse>(response);

      if (!response.ok) {
        throw new Error("Could not load reconciliation information.");
      }

      setSummary(data.reconciliation || null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load reconciliation information.";

      setSummaryError(message);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadReconciliationSummary();
  }, [loadReconciliationSummary]);

  async function uploadBankStatement() {
    setUploadError("");
    setUploadResult(null);

    if (!bankFile) {
      setUploadError("Choose a CSV or PDF bank statement first.");
      return;
    }

    const fileExtension =
      bankFile.name.split(".").pop()?.toLowerCase() || "";

    if (!["csv", "pdf"].includes(fileExtension)) {
      setUploadError("Only CSV and PDF bank statements are supported.");
      return;
    }

    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", bankFile);

      const response = await fetch(
        `${API_BASE_URL}/dashboard/bank-reconciliation/upload?period=${period}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data =
        await parseJsonResponse<BankReconciliationResult>(response);

      if (!response.ok || !data.success) {
        throw new Error(
          "Bank statement reconciliation could not be completed."
        );
      }

      setUploadResult(data);
      setResultView("matched");

      await loadReconciliationSummary();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Bank statement reconciliation failed.";

      setUploadError(message);
    } finally {
      setUploadLoading(false);
    }
  }

  const reconciliationStatus = useMemo(() => {
    const currentStatus = summary?.status?.trim();

    if (currentStatus) {
      return currentStatus;
    }

    return summary?.unreconciled_amount
      ? "Review required"
      : "Pending reconciliation";
  }, [summary]);

  const reconciliationComplete =
    Number(summary?.unreconciled_amount || 0) === 0 &&
    Number(summary?.expected_total || 0) > 0;

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-purple-300">
              Financial controls
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Reconciliation
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
              Compare GoodKeeper bookkeeping records with bank activity and
              investigate unmatched transactions.
            </p>
          </div>

          <PeriodTabs
            value={period}
            onChange={(value) => {
              setPeriod(value);
              setUploadResult(null);
            }}
          />
        </header>

        {summaryError && (
          <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
            {summaryError}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ReconciliationMetric
            title="Expected Cash"
            value={formatMoney(summary?.expected_cash || 0)}
            description="Cash recorded in GoodKeeper"
            icon={WalletCards}
            loading={summaryLoading}
          />

          <ReconciliationMetric
            title="Expected Card"
            value={formatMoney(summary?.expected_card || 0)}
            description="Card payments recorded"
            icon={Landmark}
            loading={summaryLoading}
          />

          <ReconciliationMetric
            title="Expected Total"
            value={formatMoney(summary?.expected_total || 0)}
            description="Total amount expected"
            icon={FileSearch}
            loading={summaryLoading}
          />

          <ReconciliationMetric
            title="Unreconciled"
            value={formatMoney(summary?.unreconciled_amount || 0)}
            description="Amount requiring investigation"
            icon={AlertTriangle}
            loading={summaryLoading}
          />
        </section>

        <section className="grid items-start gap-8 xl:grid-cols-[1fr_1.5fr]">
          <div className="space-y-8">
            <CardShell>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">
                      Reconciliation Summary
                    </CardTitle>

                    <p className="mt-1 text-sm text-zinc-400">
                      Current expected collections for the selected period.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadReconciliationSummary}
                    disabled={summaryLoading}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-400 transition hover:text-white disabled:opacity-50"
                    aria-label="Refresh reconciliation summary"
                  >
                    <RefreshCw
                      className={[
                        "h-4 w-4",
                        summaryLoading ? "animate-spin" : "",
                      ].join(" ")}
                    />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <SummaryRow
                  label="Expected cash"
                  value={formatMoney(summary?.expected_cash || 0)}
                />

                <SummaryRow
                  label="Expected card"
                  value={formatMoney(summary?.expected_card || 0)}
                />

                <SummaryRow
                  label="Expected total"
                  value={formatMoney(summary?.expected_total || 0)}
                />

                <SummaryRow
                  label="Unreconciled amount"
                  value={formatMoney(
                    summary?.unreconciled_amount || 0
                  )}
                />

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-600">
                    Status
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    {reconciliationComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-300" />
                    )}

                    <Badge
                      className={
                        reconciliationComplete
                          ? "bg-emerald-500/15 text-emerald-200"
                          : "bg-amber-500/15 text-amber-200"
                      }
                    >
                      {reconciliationStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </CardShell>

            <CardShell>
              <CardHeader>
                <CardTitle className="text-xl">
                  Upload Bank Statement
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Upload a CSV or PDF statement for smart matching.
                </p>
              </CardHeader>

              <CardContent className="space-y-5">
                <label className="block cursor-pointer rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-6 transition hover:border-purple-500/50 hover:bg-purple-500/5">
                  <input
                    type="file"
                    accept=".csv,.pdf"
                    onChange={(event) => {
                      setBankFile(event.target.files?.[0] || null);
                      setUploadError("");
                      setUploadResult(null);
                    }}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10">
                      <Upload className="h-5 w-5 text-purple-300" />
                    </div>

                    <p className="mt-4 text-sm font-medium text-zinc-200">
                      Select bank statement
                    </p>

                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Supported formats: CSV and PDF
                    </p>

                    {bankFile && (
                      <div className="mt-4 rounded-xl border border-zinc-700 bg-black/50 px-4 py-3">
                        <p className="max-w-64 truncate text-sm text-zinc-300">
                          {bankFile.name}
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          {(bankFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    )}
                  </div>
                </label>

                {uploadError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm leading-6 text-red-200">
                    {uploadError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={uploadBankStatement}
                  disabled={uploadLoading || !bankFile}
                  className="w-full rounded-xl bg-purple-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadLoading
                    ? "Reconciling statement..."
                    : "Upload and reconcile"}
                </button>
              </CardContent>
            </CardShell>
          </div>

          <CardShell>
            <CardHeader className="border-b border-zinc-800">
              <CardTitle className="text-xl">
                Smart Bank Reconciliation
              </CardTitle>

              <p className="mt-1 text-sm text-zinc-400">
                Review matched and unmatched transactions after uploading a
                bank statement.
              </p>
            </CardHeader>

            <CardContent className="p-6">
              {!uploadResult ? (
                <ReconciliationEmptyState />
              ) : (
                <ReconciliationResults
                  result={uploadResult}
                  view={resultView}
                  onViewChange={setResultView}
                />
              )}
            </CardContent>
          </CardShell>
        </section>
      </div>
    </main>
  );
}

function ReconciliationResults({
  result,
  view,
  onViewChange,
}: {
  result: BankReconciliationResult;
  view: ResultView;
  onViewChange: (value: ResultView) => void;
}) {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResultMetric
          label="Match Rate"
          value={formatPercentage(result.match_rate)}
        />

        <ResultMetric
          label="Matched"
          value={String(result.matched_count)}
        />

        <ResultMetric
          label="Missing from GoodKeeper"
          value={String(result.unmatched_bank_count)}
        />

        <ResultMetric
          label="Missing from Bank"
          value={String(result.unmatched_ledger_count)}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <ResultMetric
          label="Bank Statement Total"
          value={formatMoney(result.total_bank_amount)}
        />

        <ResultMetric
          label="Matched Amount"
          value={formatMoney(result.total_matched_amount)}
        />
      </section>

      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-1 rounded-xl border border-zinc-700 bg-zinc-900 p-1 sm:min-w-0">
          <ResultViewButton
            active={view === "matched"}
            onClick={() => onViewChange("matched")}
            label="Matched"
            count={result.matches.length}
          />

          <ResultViewButton
            active={view === "missing-from-goodkeeper"}
            onClick={() => onViewChange("missing-from-goodkeeper")}
            label="Missing from GoodKeeper"
            count={result.unmatched_bank.length}
          />

          <ResultViewButton
            active={view === "missing-from-bank"}
            onClick={() => onViewChange("missing-from-bank")}
            label="Missing from Bank"
            count={result.unmatched_ledger.length}
          />
        </div>
      </div>

      {view === "matched" && (
        <ResultList
          items={result.matches}
          emptyText="No matched transactions were found."
          renderItem={(item, index) => (
            <MatchedResultItem
              key={index}
              item={item as ReconciliationMatch}
            />
          )}
        />
      )}

      {view === "missing-from-goodkeeper" && (
        <ResultList
          items={result.unmatched_bank}
          emptyText="No bank transactions are missing from GoodKeeper."
          renderItem={(item, index) => (
            <UnmatchedBankResultItem
              key={index}
              item={item as UnmatchedBankItem}
            />
          )}
        />
      )}

      {view === "missing-from-bank" && (
        <ResultList
          items={result.unmatched_ledger}
          emptyText="No GoodKeeper transactions are missing from the bank."
          renderItem={(item, index) => (
            <UnmatchedLedgerResultItem
              key={index}
              item={item as UnmatchedLedgerItem}
            />
          )}
        />
      )}
    </div>
  );
}

function MatchedResultItem({
  item,
}: {
  item: ReconciliationMatch;
}) {
  const bankTransaction = item.bank_transaction;
  const ledgerTransaction = item.ledger_transaction;

  return (
    <ResultItemShell>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-medium text-white">
            {ledgerTransaction?.narrative ||
              bankTransaction?.description ||
              "Matched transaction"}
          </p>

          <Badge className="bg-emerald-500/15 text-emerald-200">
            Matched
          </Badge>
        </div>

        <p className="mt-2 text-sm text-zinc-500">
          {ledgerTransaction?.customer_name ||
            bankTransaction?.description ||
            "No customer information"}
        </p>

        <p className="mt-1 text-xs text-zinc-600">
          {formatDate(
            ledgerTransaction?.transaction_timestamp ||
              bankTransaction?.date
          )}
        </p>
      </div>

      <p className="font-semibold text-emerald-300">
        {formatMoney(
          Number(
            bankTransaction?.amount ||
              ledgerTransaction?.amount ||
              0
          )
        )}
      </p>
    </ResultItemShell>
  );
}

function UnmatchedBankResultItem({
  item,
}: {
  item: UnmatchedBankItem;
}) {
  const transaction = item.bank_transaction;

  return (
    <ResultItemShell>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-medium text-white">
            {transaction?.description || "Bank transaction"}
          </p>

          <Badge className="bg-amber-500/15 text-amber-200">
            Missing from GoodKeeper
          </Badge>
        </div>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {item.suggested_action ||
            "Review this transaction and add it to GoodKeeper if required."}
        </p>

        <p className="mt-1 text-xs text-zinc-600">
          {formatDate(transaction?.date)}
        </p>
      </div>

      <p className="font-semibold text-amber-300">
        {formatMoney(Number(transaction?.amount || 0))}
      </p>
    </ResultItemShell>
  );
}

function UnmatchedLedgerResultItem({
  item,
}: {
  item: UnmatchedLedgerItem;
}) {
  const transaction = item.ledger_transaction;

  return (
    <ResultItemShell>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-medium text-white">
            {transaction?.narrative || "GoodKeeper transaction"}
          </p>

          <Badge className="bg-red-500/15 text-red-200">
            Missing from Bank
          </Badge>
        </div>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {item.suggested_action ||
            "Review whether this transaction was deposited or paid."}
        </p>

        <p className="mt-1 text-xs text-zinc-600">
          {formatDate(transaction?.transaction_timestamp)}
        </p>
      </div>

      <p className="font-semibold text-red-300">
        {formatMoney(Number(transaction?.amount || 0))}
      </p>
    </ResultItemShell>
  );
}

function ResultList<T>({
  items,
  emptyText,
  renderItem,
}: {
  items: T[];
  emptyText: string;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
        <p className="text-sm text-zinc-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.slice(0, 20).map((item, index) =>
        renderItem(item, index)
      )}
    </div>
  );
}

function ResultItemShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:flex-row sm:items-start sm:justify-between">
      {children}
    </article>
  );
}

function ResultViewButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition",
        active
          ? "bg-purple-500 text-white"
          : "text-zinc-400 hover:text-white",
      ].join(" ")}
    >
      <span>{label}</span>

      <span
        className={[
          "rounded-full px-2 py-0.5 text-[10px]",
          active ? "bg-white/15 text-white" : "bg-zinc-800 text-zinc-500",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  );
}

function ReconciliationMetric({
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

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10">
          <Icon className="h-5 w-5 text-purple-300" />
        </div>
      </CardContent>
    </CardShell>
  );
}

function ResultMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-600">
        {label}
      </p>

      <p className="mt-3 text-2xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 pb-4 last:border-b-0 last:pb-0">
      <span className="text-sm text-zinc-400">{label}</span>

      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function ReconciliationEmptyState() {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
        <Landmark className="h-7 w-7 text-purple-300" />
      </div>

      <p className="mt-5 font-medium text-zinc-300">
        No statement reconciled yet
      </p>

      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
        Upload a bank statement to compare bank activity with GoodKeeper
        transactions. Matched items and exceptions will appear here.
      </p>
    </div>
  );
}

function PeriodTabs({
  value,
  onChange,
}: {
  value: ReconciliationPeriod;
  onChange: (value: ReconciliationPeriod) => void;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(newValue) =>
        onChange(newValue as ReconciliationPeriod)
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