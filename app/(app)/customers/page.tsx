"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  Sparkles,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
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


const CUSTOMERS_PER_PAGE = 8;

type CustomerPeriod =
  | "today"
  | "week"
  | "month";

type PerformanceCustomer = {
  customer_name: string;
  revenue: number;
  visits: number;
};

type DatabaseCustomer = {
  id?: number;
  client_id?: number;
  first_name?: string | null;
  customer_name?: string | null;
  phone_number?: string | null;
  email?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

type EnrichedCustomer = DatabaseCustomer & {
  visits: number;
  revenue: number;
};

type TopCustomersResponse = {
  success?: boolean;
  customers?: PerformanceCustomer[];
  detail?: string;
};

type CustomerDatabaseResponse = {
  success?: boolean;
  customers?: DatabaseCustomer[];
  detail?: string;
};

type CustomerForm = {
  customer_name: string;
  phone_number: string;
  email: string;
  notes: string;
};

type CreateCustomerResponse = {
  success?: boolean;
  message?: string;
  customer?: DatabaseCustomer;
  detail?: string;
};

const EMPTY_CUSTOMER_FORM: CustomerForm = {
  customer_name: "",
  phone_number: "",
  email: "",
  notes: "",
};

function formatMoney(value: number) {
  return `R${Number(value || 0).toLocaleString(
    "en-ZA",
    {
      maximumFractionDigits: 0,
    }
  )}`;
}

function getCustomerName(
  customer: DatabaseCustomer
) {
  return (
    customer.first_name?.trim() ||
    customer.customer_name?.trim() ||
    "Unnamed customer"
  );
}

function getCustomerInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) =>
      word.charAt(0).toUpperCase()
    )
    .join("");
}

function normalizePhoneNumber(value: string) {
  return value.replace(/[\s()-]/g, "").trim();
}

function normalizeCustomerName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export default function CustomersPage() {
  const [period, setPeriod] =
    useState<CustomerPeriod>("month");

  const [
    performanceCustomers,
    setPerformanceCustomers,
  ] = useState<PerformanceCustomer[]>([]);

  const [
    databaseCustomers,
    setDatabaseCustomers,
  ] = useState<DatabaseCustomer[]>([]);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    isCustomerFormOpen,
    setIsCustomerFormOpen,
  ] = useState(false);

  const [customerForm, setCustomerForm] =
    useState<CustomerForm>(
      EMPTY_CUSTOMER_FORM
    );

  const [
    savingCustomer,
    setSavingCustomer,
  ] = useState(false);

  const [
    customerFormError,
    setCustomerFormError,
  ] = useState("");

  const [
    pageSuccessMessage,
    setPageSuccessMessage,
  ] = useState("");

  const loadCustomerData =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const [databaseData, performanceData] =
          await Promise.all([
            apiRequest<CustomerDatabaseResponse>(
              "/dashboard/customers?limit=500"
            ),
            apiRequest<TopCustomersResponse>(
              `/dashboard/top-customers?period=${period}&limit=50`
            ),
          ]);

        setDatabaseCustomers(
          databaseData.customers ?? []
        );

        setPerformanceCustomers(
          performanceData.customers ?? []
        );
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Could not load customer information.";

        setError(message);
        setDatabaseCustomers([]);
        setPerformanceCustomers([]);
      } finally {
        setLoading(false);
      }
    }, [period]);

  useEffect(() => {
    void loadCustomerData();
  }, [loadCustomerData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (!pageSuccessMessage) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => {
        setPageSuccessMessage("");
      },
      5000
    );

    return () =>
      window.clearTimeout(timeoutId);
  }, [pageSuccessMessage]);

  const handleCreateCustomer = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setCustomerFormError("");

    const customerName =
      customerForm.customer_name.trim();

    const phoneNumber =
      normalizePhoneNumber(
        customerForm.phone_number
      );

    if (!customerName) {
      setCustomerFormError(
        "Please enter the customer's name."
      );
      return;
    }

    if (phoneNumber.length < 8) {
      setCustomerFormError(
        "Please enter a valid phone number."
      );
      return;
    }

    setSavingCustomer(true);

    try {
      const data =
        await apiRequest<CreateCustomerResponse>(
          "/dashboard/customers",
          {
            method: "POST",
            body: JSON.stringify({
              customer_name: customerName,
              phone_number: phoneNumber,
              email:
                customerForm.email.trim() ||
                null,
              notes:
                customerForm.notes.trim() ||
                null,
            }),
          }
        );

      if (!data.success) {
        throw new Error(
          data.detail ||
            data.message ||
            "The customer could not be saved."
        );
      }

      setCustomerForm(
        EMPTY_CUSTOMER_FORM
      );

      setIsCustomerFormOpen(false);

      setPageSuccessMessage(
        data.message ||
          `${customerName} was saved successfully.`
      );

      await loadCustomerData();
    } catch (requestError) {
      setCustomerFormError(
        requestError instanceof Error
          ? requestError.message
          : "The customer could not be saved."
      );
    } finally {
      setSavingCustomer(false);
    }
  };

  const performanceByCustomerName =
    useMemo(() => {
      const performanceMap = new Map<
        string,
        PerformanceCustomer
      >();

      performanceCustomers.forEach(
        (customer) => {
          performanceMap.set(
            normalizeCustomerName(
              customer.customer_name
            ),
            customer
          );
        }
      );

      return performanceMap;
    }, [performanceCustomers]);

  const enrichedCustomers =
    useMemo<EnrichedCustomer[]>(
      () =>
        databaseCustomers.map(
          (customer) => {
            const performance =
              performanceByCustomerName.get(
                normalizeCustomerName(
                  getCustomerName(customer)
                )
              );

            return {
              ...customer,
              visits: Number(
                performance?.visits || 0
              ),
              revenue: Number(
                performance?.revenue || 0
              ),
            };
          }
        ),
      [
        databaseCustomers,
        performanceByCustomerName,
      ]
    );

  const topFiveCustomers =
    useMemo(
      () =>
        [...performanceCustomers]
          .sort(
            (first, second) =>
              Number(
                second.revenue || 0
              ) -
              Number(
                first.revenue || 0
              )
          )
          .slice(0, 5),
      [performanceCustomers]
    );

  const filteredCustomers =
    useMemo(() => {
      const query = searchQuery
        .trim()
        .toLowerCase();

      if (!query) {
        return enrichedCustomers;
      }

      return enrichedCustomers.filter(
        (customer) => {
          const searchableText = [
            getCustomerName(customer),
            customer.phone_number || "",
            customer.email || "",
            customer.notes || "",
            String(customer.visits),
            String(customer.revenue),
          ]
            .join(" ")
            .toLowerCase();

          return searchableText.includes(query);
        }
      );
    }, [
      enrichedCustomers,
      searchQuery,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredCustomers.length /
        CUSTOMERS_PER_PAGE
    )
  );

  const paginatedCustomers =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        CUSTOMERS_PER_PAGE;

      return filteredCustomers.slice(
        startIndex,
        startIndex +
          CUSTOMERS_PER_PAGE
      );
    }, [
      filteredCustomers,
      currentPage,
    ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const firstDisplayedCustomer =
    filteredCustomers.length === 0
      ? 0
      : (currentPage - 1) *
          CUSTOMERS_PER_PAGE +
        1;

  const lastDisplayedCustomer =
    Math.min(
      currentPage * CUSTOMERS_PER_PAGE,
      filteredCustomers.length
    );

  const totalRevenue =
    performanceCustomers.reduce(
      (total, customer) =>
        total +
        Number(customer.revenue || 0),
      0
    );

  const totalVisits =
    performanceCustomers.reduce(
      (total, customer) =>
        total +
        Number(customer.visits || 0),
      0
    );

  const averageCustomerValue =
    databaseCustomers.length > 0
      ? totalRevenue /
        databaseCustomers.length
      : 0;

  const closeCustomerForm = () => {
    if (savingCustomer) {
      return;
    }

    setIsCustomerFormOpen(false);
    setCustomerFormError("");
    setCustomerForm(
      EMPTY_CUSTOMER_FORM
    );
  };

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-purple-300">
              Customer management
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Customers
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
              Manage customer contact details
              and review visits, spending, and
              relationship history.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <PeriodTabs
              value={period}
              onChange={setPeriod}
            />

            <button
              type="button"
              onClick={() => {
                setCustomerFormError("");
                setIsCustomerFormOpen(true);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 text-sm font-semibold text-white transition hover:bg-purple-400"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          </div>
        </header>

        {pageSuccessMessage && (
          <div
            role="status"
            className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

              <span>
                {pageSuccessMessage}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setPageSuccessMessage("")
              }
              aria-label="Dismiss success message"
              className="text-emerald-300 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CustomerMetric
            title="Total Customers"
            value={String(
              databaseCustomers.length
            )}
            description="Customers stored in the database"
            icon={Users}
            loading={loading}
          />

          <CustomerMetric
            title="Customer Revenue"
            value={formatMoney(
              totalRevenue
            )}
            description={`Revenue for the selected ${period}`}
            icon={WalletCards}
            loading={loading}
            valueClassName="text-emerald-300"
          />

          <CustomerMetric
            title="Total Visits"
            value={String(totalVisits)}
            description={`Recorded visits for the selected ${period}`}
            icon={UserRound}
            loading={loading}
            valueClassName="text-sky-300"
          />

          <CustomerMetric
            title="Average Value"
            value={formatMoney(
              averageCustomerValue
            )}
            description="Revenue divided by total customers"
            icon={Sparkles}
            loading={loading}
          />
        </section>

        <section>
          <CardShell>
            <CardHeader className="border-b border-zinc-800">
              <div>
                <CardTitle className="text-xl">
                  Top 5 Customers
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Highest-value customers for the selected {period}.
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-5 lg:p-6">
              {loading ? (
                <TopCustomersLoadingState />
              ) : topFiveCustomers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
                  <Users className="mx-auto h-9 w-9 text-zinc-600" />

                  <p className="mt-4 font-medium text-zinc-300">
                    No customer activity yet
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    Customers with visits and revenue will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  {topFiveCustomers.map(
                    (customer, index) => (
                      <TopCustomerCard
                        key={`${customer.customer_name}-${index}`}
                        customer={customer}
                        rank={index + 1}
                      />
                    )
                  )}
                </div>
              )}
            </CardContent>
          </CardShell>
        </section>

        <section>
          <CardShell>
            <CardHeader className="border-b border-zinc-800">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle className="text-xl">
                    Customer Database
                  </CardTitle>

                  <p className="mt-1 text-sm text-zinc-400">
                    Search all customers,
                    including customers who have
                    not booked or spent yet.
                  </p>
                </div>

                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    placeholder="Search name, phone, email, or notes..."
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {error && (
                <div className="m-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200 lg:m-6">
                  {error}
                </div>
              )}

              {loading ? (
                <CustomerLoadingState />
              ) : filteredCustomers.length ===
                0 ? (
                <CustomerEmptyState
                  hasSearch={Boolean(
                    searchQuery.trim()
                  )}
                />
              ) : (
                <>
                  <div className="space-y-4 p-5 lg:p-6">
                    {paginatedCustomers.map(
                      (customer, index) => (
                        <CustomerRow
                          key={
                            customer.id ??
                            customer.client_id ??
                            `${getCustomerName(
                              customer
                            )}-${index}`
                          }
                          customer={customer}
                        />
                      )
                    )}
                  </div>

                  <PaginationFooter
                    currentPage={
                      currentPage
                    }
                    totalPages={totalPages}
                    firstItem={
                      firstDisplayedCustomer
                    }
                    lastItem={
                      lastDisplayedCustomer
                    }
                    totalItems={
                      filteredCustomers.length
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
        </section>
      </div>

      <CustomerFormSheet
        open={isCustomerFormOpen}
        form={customerForm}
        saving={savingCustomer}
        error={customerFormError}
        onClose={closeCustomerForm}
        onChange={(field, value) => {
          setCustomerForm(
            (currentForm) => ({
              ...currentForm,
              [field]: value,
            })
          );
        }}
        onSubmit={handleCreateCustomer}
      />
    </main>
  );
}

function CustomerFormSheet({
  open,
  form,
  saving,
  error,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: CustomerForm;
  saving: boolean;
  error: string;
  onClose: () => void;
  onChange: (
    field: keyof CustomerForm,
    value: string
  ) => void;
  onSubmit: (
    event: React.FormEvent<HTMLFormElement>
  ) => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close customer form"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-zinc-800 bg-[#080808] shadow-2xl">
        <header className="flex items-start justify-between gap-5 border-b border-zinc-800 px-6 py-6">
          <div>
            <p className="text-sm font-medium text-purple-300">
              Customer management
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-white">
              Add Customer
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Add a customer directly to
              the GoodKeeper customer
              database.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-400 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
                {error}
              </div>
            )}

            <CustomerFormField
              label="Customer name"
              required
            >
              <input
                type="text"
                value={
                  form.customer_name
                }
                onChange={(event) =>
                  onChange(
                    "customer_name",
                    event.target.value
                  )
                }
                placeholder="e.g. Tshepo Khoza"
                maxLength={120}
                autoFocus
                className={
                  customerInputClassName
                }
              />
            </CustomerFormField>

            <CustomerFormField
              label="Phone number"
              required
              description="Include the country code where possible."
            >
              <input
                type="tel"
                value={
                  form.phone_number
                }
                onChange={(event) =>
                  onChange(
                    "phone_number",
                    event.target.value
                  )
                }
                placeholder="e.g. 27821234567"
                maxLength={30}
                className={
                  customerInputClassName
                }
              />
            </CustomerFormField>

            <CustomerFormField label="Email address">
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  onChange(
                    "email",
                    event.target.value
                  )
                }
                placeholder="e.g. customer@example.com"
                maxLength={255}
                className={
                  customerInputClassName
                }
              />
            </CustomerFormField>

            <CustomerFormField
              label="Internal notes"
              description="These notes are visible to the business owner."
            >
              <textarea
                value={form.notes}
                onChange={(event) =>
                  onChange(
                    "notes",
                    event.target.value
                  )
                }
                placeholder="Add preferences, reminders, or other useful information..."
                maxLength={2000}
                rows={6}
                className={`${customerInputClassName} resize-none`}
              />
            </CustomerFormField>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-zinc-800 px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Customer
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Save Customer
                </>
              )}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}

function TopCustomerCard({
  customer,
  rank,
}: {
  customer: PerformanceCustomer;
  rank: number;
}) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-xs font-semibold text-purple-200">
            {getCustomerInitials(
              customer.customer_name
            )}
          </div>

          <h3 className="truncate font-semibold text-white">
            {customer.customer_name}
          </h3>
        </div>

        <Badge className="shrink-0 bg-purple-500/20 text-purple-200">
          #{rank}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-zinc-600">
            Visits
          </p>

          <p className="mt-1 font-semibold text-sky-300">
            {customer.visits}
          </p>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wide text-zinc-600">
            Revenue
          </p>

          <p className="mt-1 font-semibold text-emerald-300">
            {formatMoney(
              customer.revenue
            )}
          </p>
        </div>
      </div>
    </article>
  );
}

function TopCustomersLoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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

function CustomerRow({
  customer,
}: {
  customer: EnrichedCustomer;
}) {
  const name =
    getCustomerName(customer);

  return (
    <article className="grid gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700 xl:grid-cols-[minmax(280px,1.6fr)_100px_130px_minmax(220px,1.1fr)] xl:items-center">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-sm font-semibold text-purple-200">
          {getCustomerInitials(name)}
        </div>

        <div className="min-w-0">
          <p className="truncate font-medium text-white">
            {name}
          </p>

          <div className="mt-2 space-y-2">
            <CustomerContact
              icon={Phone}
              value={
                customer.phone_number ||
                "No phone number"
              }
            />

            <CustomerContact
              icon={Mail}
              value={
                customer.email ||
                "No email address"
              }
            />
          </div>
        </div>
      </div>

      <CustomerDetail
        label="Visits"
        value={String(customer.visits)}
        valueClassName="text-sky-300"
      />

      <CustomerDetail
        label="Revenue"
        value={formatMoney(customer.revenue)}
        valueClassName="text-emerald-300"
      />

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-600">
          Notes
        </p>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-300">
          {customer.notes ||
            "No internal notes recorded."}
        </p>
      </div>
    </article>
  );
}

function CustomerDetail({
  label,
  value,
  valueClassName = "text-zinc-200",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-600">
        {label}
      </p>

      <p className={`mt-2 font-semibold ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

function CustomerContact({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-zinc-300">
      <Icon className="h-4 w-4 shrink-0 text-purple-300" />

      <span className="truncate">
        {value}
      </span>
    </div>
  );
}

const customerInputClassName =
  "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10";

function CustomerFormField({
  label,
  required = false,
  description,
  children,
}: {
  label: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-200">
        {label}

        {required && (
          <span className="ml-1 text-purple-300">
            *
          </span>
        )}
      </span>

      {description && (
        <span className="mt-1 block text-xs leading-5 text-zinc-500">
          {description}
        </span>
      )}

      <span className="mt-2 block">
        {children}
      </span>
    </label>
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
        customers
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={
            currentPage === 1
          }
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
            currentPage ===
            totalPages
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

function CustomerMetric({
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
      <CardContent className="flex items-start justify-between gap-5 p-6">
        <div>
          <p className="text-sm text-zinc-400">
            {title}
          </p>

          {loading ? (
            <div className="mt-4 h-9 w-28 animate-pulse rounded-lg bg-zinc-800" />
          ) : (
            <p className={`mt-4 text-3xl font-semibold tracking-tight ${valueClassName}`}>
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

function CustomerLoadingState() {
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

function CustomerEmptyState({
  hasSearch,
}: {
  hasSearch: boolean;
}) {
  return (
    <div className="p-5 lg:p-6">
      <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
        <Users className="h-9 w-9 text-zinc-600" />

        <p className="mt-4 font-medium text-zinc-300">
          {hasSearch
            ? "No matching customers"
            : "No customers found"}
        </p>

        <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
          {hasSearch
            ? "Try searching with a different name, phone number, email address, or note."
            : "Use Add Customer to create the first customer profile."}
        </p>
      </div>
    </div>
  );
}

function PeriodTabs({
  value,
  onChange,
}: {
  value: CustomerPeriod;
  onChange: (
    value: CustomerPeriod
  ) => void;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(newValue) =>
        onChange(
          newValue as CustomerPeriod
        )
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
    <Card className="overflow-hidden rounded-3xl border border-zinc-700 bg-[#080808] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      {children}
    </Card>
  );
}