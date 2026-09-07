"use client";

import { useEffect, useState } from "react";

import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  LockKeyhole,
  Pencil,
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

import { getCurrentWorkspace } from "@/lib/workspace";


const MONTHLY_PRICE = 699;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;


type BillingSubscription = {
  id: string;
  business_id: string;
  provider: string | null;
  plan_name: string | null;
  plan_code: string | null;
  customer_email: string | null;
  customer_code: string | null;
  subscription_code: string | null;
  email_token: string | null;
  status: string | null;
  amount: number | null;
  currency: string | null;
  next_payment_date: string | null;
  trial_start: string | null;
  trial_end: string | null;
  billing_start_date: string | null;
  authorization_code: string | null;
  cancelled_at: string | null;
  card_brand: string | null;
  card_last4: string | null;
  last_payment_reference: string | null;
  last_payment_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};


type BillingProfile = {
  business_id: string;
  billing_name: string;
  billing_email: string;
  billing_phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string;
  company_registration_number: string | null;
  vat_number: string | null;
};


type BillingProfileForm = {
  billing_name: string;
  billing_email: string;
  billing_phone: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  company_registration_number: string;
  vat_number: string;
};


const EMPTY_PROFILE_FORM: BillingProfileForm = {
  billing_name: "",
  billing_email: "",
  billing_phone: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  province: "",
  postal_code: "",
  country: "ZA",
  company_registration_number: "",
  vat_number: "",
};


function formatMoney(value: number) {
  return `R${value.toLocaleString("en-ZA", {
    maximumFractionDigits: 0,
  })}`;
}


function formatDate(
  value: string | null | undefined
) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


function formatStatus(
  value: string | null | undefined
) {
  if (!value) {
    return "Not active";
  }

  if (value.toLowerCase() === "trialing") {
    return "Free trial";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}


export default function BillingPage() {
  const [businessId, setBusinessId] =
    useState<string | null>(null);

  const [subscription, setSubscription] =
    useState<BillingSubscription | null>(null);

  const [billingProfile, setBillingProfile] =
    useState<BillingProfile | null>(null);

  const [profileForm, setProfileForm] =
    useState<BillingProfileForm>(
      EMPTY_PROFILE_FORM
    );

  const [
    isLoadingSubscription,
    setIsLoadingSubscription,
  ] = useState(true);

  const [
    isLoadingCheckout,
    setIsLoadingCheckout,
  ] = useState(false);

  const [
    isEditingBilling,
    setIsEditingBilling,
  ] = useState(false);

  const [
    isSavingBilling,
    setIsSavingBilling,
  ] = useState(false);

  const [
    isOpeningManage,
    setIsOpeningManage,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);


  const status =
    subscription?.status?.toLowerCase();

  const isActive =
    status === "active";

  const isTrialing =
    status === "trialing";

  const hasAccess =
    isActive || isTrialing;


  const monthlyAmount =
    subscription?.amount != null
      ? subscription.amount / 100
      : MONTHLY_PRICE;


  const paymentMethod =
    subscription?.card_last4
      ? `${
          subscription.card_brand?.toUpperCase() ||
          "CARD"
        } •••• ${subscription.card_last4}`
      : "Not added";


  const nextBillingDate =
    subscription?.next_payment_date ||
    subscription?.billing_start_date ||
    null;


  useEffect(() => {
    async function loadBillingData() {
      if (!API_BASE_URL) {
        setError(
          "Billing API is not configured."
        );
        setIsLoadingSubscription(false);
        return;
      }

      try {
        setError(null);

        const workspace =
          await getCurrentWorkspace();

        if (!workspace?.business_id) {
          throw new Error(
            "No active workspace was found."
          );
        }

        setBusinessId(
          workspace.business_id
        );

        const [
          subscriptionResponse,
          profileResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE_URL}/billing/subscription/${workspace.business_id}`,
            {
              cache: "no-store",
            }
          ),

          fetch(
            `${API_BASE_URL}/billing/profile/${workspace.business_id}`,
            {
              cache: "no-store",
            }
          ),
        ]);

        const subscriptionData =
          await subscriptionResponse.json();

        if (!subscriptionResponse.ok) {
          throw new Error(
            subscriptionData.detail ||
              "Unable to load subscription."
          );
        }

        setSubscription(
          subscriptionData.subscription ?? null
        );

        if (profileResponse.ok) {
          const profileData =
            await profileResponse.json();

          const profile =
            profileData.profile ?? null;

          setBillingProfile(profile);

          if (profile) {
            setProfileForm({
              billing_name:
                profile.billing_name || "",
              billing_email:
                profile.billing_email || "",
              billing_phone:
                profile.billing_phone || "",
              address_line_1:
                profile.address_line_1 || "",
              address_line_2:
                profile.address_line_2 || "",
              city:
                profile.city || "",
              province:
                profile.province || "",
              postal_code:
                profile.postal_code || "",
              country:
                profile.country || "ZA",
              company_registration_number:
                profile.company_registration_number ||
                "",
              vat_number:
                profile.vat_number || "",
            });
          }
        }
      } catch (err) {
        console.error(
          "[Billing] Failed to load billing data:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load billing information."
        );
      } finally {
        setIsLoadingSubscription(false);
      }
    }

    loadBillingData();
  }, []);


  async function handleAddPaymentMethod() {
    if (!API_BASE_URL || !businessId) {
      setError(
        "Billing is not configured."
      );
      return;
    }

    setIsLoadingCheckout(true);
    setError(null);

    try {
      const email =
        billingProfile?.billing_email ||
        subscription?.customer_email;

      if (!email) {
        throw new Error(
          "Please add a billing email before starting checkout."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/billing/initialize-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            business_id: businessId,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.authorization_url
      ) {
        throw new Error(
          data.detail ||
            "Unable to start checkout."
        );
      }

      window.location.href =
        data.authorization_url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start checkout."
      );
    } finally {
      setIsLoadingCheckout(false);
    }
  }


  async function handleManageSubscription() {
    if (!API_BASE_URL || !businessId) {
      setError(
        "Billing is not configured."
      );
      return;
    }

    setIsOpeningManage(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/billing/manage-subscription/${businessId}`,
        {
          method: "POST",
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.link) {
        throw new Error(
          data.detail ||
            "Subscription management is not available yet."
        );
      }

      window.location.href =
        data.link;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to open subscription management."
      );
    } finally {
      setIsOpeningManage(false);
    }
  }


  async function handleSaveBillingProfile() {
    if (!API_BASE_URL || !businessId) {
      setError(
        "Billing is not configured."
      );
      return;
    }

    if (
      !profileForm.billing_name.trim()
    ) {
      setError(
        "Billing name is required."
      );
      return;
    }

    if (
      !profileForm.billing_email.trim()
    ) {
      setError(
        "Billing email is required."
      );
      return;
    }

    setIsSavingBilling(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/billing/profile/${businessId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            profileForm
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to save billing details."
        );
      }

      setBillingProfile(
        data.profile
      );

      setIsEditingBilling(false);

      setSuccessMessage(
        "Billing details updated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save billing details."
      );
    } finally {
      setIsSavingBilling(false);
    }
  }


  function updateProfileField(
    field: keyof BillingProfileForm,
    value: string
  ) {
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }));
  }


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
            Manage your GoodKeeper
            subscription, payment method,
            billing details, and billing
            activity.
          </p>
        </header>


        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}


        {successMessage && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            {successMessage}
          </div>
        )}


        <section className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-6 md:p-8">

          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

            <div className="flex max-w-3xl items-start gap-5">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-500 text-white">
                <Sparkles className="h-6 w-6" />
              </div>

              <div>

                <div className="flex flex-wrap items-center gap-3">

                  <p className="text-sm font-medium text-purple-200">
                    GoodKeeper Standard
                  </p>

                  <span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1 text-xs font-medium text-purple-200">
                    {isLoadingSubscription
                      ? "Loading"
                      : isTrialing
                        ? "30-day free trial"
                        : isActive
                          ? "Active"
                          : "Inactive"}
                  </span>

                </div>

                <h2 className="mt-3 text-xl font-semibold md:text-2xl">

                  {isLoadingSubscription
                    ? "Loading your billing information..."
                    : isTrialing
                      ? "Your 30-day GoodKeeper trial is active."
                      : isActive
                        ? "Your GoodKeeper subscription is active."
                        : "Activate your GoodKeeper subscription."}

                </h2>

                <p className="mt-3 text-sm leading-7 text-zinc-300">

                  {isTrialing
                    ? `Enjoy full GoodKeeper access during your free trial. Your R699 monthly subscription begins on ${formatDate(
                        subscription?.billing_start_date
                      )}.`
                    : isActive
                      ? `Your workspace is subscribed to GoodKeeper Standard at ${formatMoney(
                          monthlyAmount
                        )} per month.`
                      : `GoodKeeper Standard is ${formatMoney(
                          MONTHLY_PRICE
                        )} per month.`}

                </p>

              </div>

            </div>


            <div className="rounded-2xl border border-purple-400/20 bg-black/30 px-5 py-4">

              <p className="text-xs font-medium uppercase tracking-wide text-purple-200/70">
                Current access
              </p>

              <div
                className={`mt-2 flex items-center gap-2 text-sm font-medium ${
                  hasAccess
                    ? "text-emerald-300"
                    : "text-zinc-400"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />

                {isLoadingSubscription
                  ? "Loading"
                  : isTrialing
                    ? "Trial active"
                    : isActive
                      ? "Active"
                      : "Inactive"}
              </div>

            </div>

          </div>

        </section>


        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <BillingMetric
            title="Current Plan"
            value={
              subscription?.plan_name ||
              "GoodKeeper Standard"
            }
            description="Core operations and business intelligence"
            icon={Sparkles}
          />


          <BillingMetric
            title={
              isTrialing
                ? "Price After Trial"
                : "Monthly Price"
            }
            value={
              formatMoney(monthlyAmount)
            }
            description={
              isTrialing
                ? "Charged after your free trial"
                : "Monthly subscription"
            }
            icon={ReceiptText}
          />


          <BillingMetric
            title="Subscription Status"
            value={
              isLoadingSubscription
                ? "Loading..."
                : formatStatus(
                    subscription?.status
                  )
            }
            description={
              isTrialing
                ? `Trial ends ${formatDate(
                    subscription?.trial_end
                  )}`
                : isActive
                  ? "Your subscription is active"
                  : "No active subscription"
            }
            icon={CalendarClock}
          />


          <BillingMetric
            title="Payment Method"
            value={
              isLoadingSubscription
                ? "Loading..."
                : paymentMethod
            }
            description={
              subscription?.card_last4
                ? "Securely stored by payment provider"
                : "No payment method added"
            }
            icon={CreditCard}
          />

        </section>


        <section className="grid items-start gap-8 xl:grid-cols-[1.35fr_1fr]">

          <div className="space-y-8">

            <CardShell>

              <CardHeader className="border-b border-zinc-800">

                <CardTitle className="text-xl">
                  Subscription Overview
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Current subscription details
                  for this workspace.
                </p>

              </CardHeader>


              <CardContent className="space-y-4 p-6">

                <BillingDetail
                  label="Plan"
                  value={
                    subscription?.plan_name ||
                    "GoodKeeper Standard"
                  }
                />

                <BillingDetail
                  label="Billing cycle"
                  value="Monthly"
                />

                <BillingDetail
                  label={
                    isTrialing
                      ? "Monthly amount after trial"
                      : "Monthly amount"
                  }
                  value={formatMoney(
                    monthlyAmount
                  )}
                />


                {isTrialing && (
                  <>
                    <BillingDetail
                      label="Trial ends"
                      value={formatDate(
                        subscription?.trial_end
                      )}
                    />

                    <BillingDetail
                      label="First billing date"
                      value={formatDate(
                        subscription?.billing_start_date
                      )}
                    />
                  </>
                )}


                {!isTrialing && (
                  <BillingDetail
                    label="Next payment date"
                    value={formatDate(
                      nextBillingDate
                    )}
                  />
                )}


                <BillingDetail
                  label="Subscription status"
                  value={formatStatus(
                    subscription?.status
                  )}
                />


                <BillingDetail
                  label="Payment method"
                  value={paymentMethod}
                />


                <div className="flex flex-wrap gap-3 pt-2">

                  {!subscription?.card_last4 ? (
                    <button
                      type="button"
                      onClick={
                        handleAddPaymentMethod
                      }
                      disabled={
                        isLoadingCheckout
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CreditCard className="h-4 w-4" />

                      {isLoadingCheckout
                        ? "Opening checkout..."
                        : "Add Payment Method"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={
                        handleManageSubscription
                      }
                      disabled={
                        isOpeningManage
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CreditCard className="h-4 w-4" />

                      {isOpeningManage
                        ? "Opening..."
                        : "Update Payment Method"}
                    </button>
                  )}


                    {subscription?.subscription_code && (
                    <button
                      type="button"
                      onClick={
                        handleManageSubscription
                      }
                      disabled={
                        isOpeningManage
                      }
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Manage Subscription
                    </button>
                  )}

                </div>


                <p className="text-xs leading-5 text-zinc-600">
                  Payments are processed securely
                  by our payment provider.
                  GoodKeeper never stores complete
                  card numbers or CVV values.
                </p>

              </CardContent>

            </CardShell>


            <CardShell>

              <CardHeader className="border-b border-zinc-800">

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <CardTitle className="text-xl">
                      Billing Details
                    </CardTitle>

                    <p className="mt-1 text-sm text-zinc-400">
                      Details used for your
                      GoodKeeper account and
                      billing records.
                    </p>
                  </div>

                  {!isEditingBilling && (
                    <button
                      type="button"
                      onClick={() =>
                        setIsEditingBilling(
                          true
                        )
                      }
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  )}

                </div>

              </CardHeader>


              <CardContent className="p-6">

                {isEditingBilling ? (
                  <div className="space-y-5">

                    <div className="grid gap-4 md:grid-cols-2">

                      <BillingInput
                        label="Billing name"
                        required
                        value={
                          profileForm.billing_name
                        }
                        onChange={(value) =>
                          updateProfileField(
                            "billing_name",
                            value
                          )
                        }
                      />

                      <BillingInput
                        label="Billing email"
                        required
                        type="email"
                        value={
                          profileForm.billing_email
                        }
                        onChange={(value) =>
                          updateProfileField(
                            "billing_email",
                            value
                          )
                        }
                      />

                      <BillingInput
                        label="Billing phone"
                        value={
                          profileForm.billing_phone
                        }
                        onChange={(value) =>
                          updateProfileField(
                            "billing_phone",
                            value
                          )
                        }
                      />

                      <BillingInput
                        label="Company registration number"
                        value={
                          profileForm.company_registration_number
                        }
                        onChange={(value) =>
                          updateProfileField(
                            "company_registration_number",
                            value
                          )
                        }
                      />

                      <BillingInput
                        label="VAT number"
                        value={
                          profileForm.vat_number
                        }
                        onChange={(value) =>
                          updateProfileField(
                            "vat_number",
                            value
                          )
                        }
                      />

                    </div>


                    <BillingInput
                      label="Address line 1"
                      value={
                        profileForm.address_line_1
                      }
                      onChange={(value) =>
                        updateProfileField(
                          "address_line_1",
                          value
                        )
                      }
                    />


                    <BillingInput
                      label="Address line 2"
                      value={
                        profileForm.address_line_2
                      }
                      onChange={(value) =>
                        updateProfileField(
                          "address_line_2",
                          value
                        )
                      }
                    />


                    <div className="grid gap-4 md:grid-cols-2">

                      <BillingInput
                        label="City"
                        value={
                          profileForm.city
                        }
                        onChange={(value) =>
                          updateProfileField(
                            "city",
                            value
                          )
                        }
                      />

                      <BillingInput
                        label="Province"
                        value={
                          profileForm.province
                        }
                        onChange={(value) =>
                          updateProfileField(
                            "province",
                            value
                          )
                        }
                      />

                      <BillingInput
                        label="Postal code"
                        value={
                          profileForm.postal_code
                        }
                        onChange={(value) =>
                          updateProfileField(
                            "postal_code",
                            value
                          )
                        }
                      />

                      <BillingInput
                        label="Country"
                        value={
                          profileForm.country
                        }
                        onChange={(value) =>
                          updateProfileField(
                            "country",
                            value
                          )
                        }
                      />

                    </div>


                    <div className="flex flex-wrap gap-3 pt-2">

                      <button
                        type="button"
                        onClick={
                          handleSaveBillingProfile
                        }
                        disabled={
                          isSavingBilling
                        }
                        className="rounded-xl bg-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:opacity-50"
                      >
                        {isSavingBilling
                          ? "Saving..."
                          : "Save Billing Details"}
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          setIsEditingBilling(
                            false
                          )
                        }
                        disabled={
                          isSavingBilling
                        }
                        className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800"
                      >
                        Cancel
                      </button>

                    </div>

                  </div>
                ) : (
                  <div className="space-y-4">

                    <BillingDetail
                      label="Billing name"
                      value={
                        billingProfile?.billing_name ||
                        "Not added"
                      }
                    />

                    <BillingDetail
                      label="Billing email"
                      value={
                        billingProfile?.billing_email ||
                        "Not added"
                      }
                    />

                    <BillingDetail
                      label="Billing phone"
                      value={
                        billingProfile?.billing_phone ||
                        "Not added"
                      }
                    />

                    <BillingDetail
                      label="Address"
                      value={
                        [
                          billingProfile?.address_line_1,
                          billingProfile?.address_line_2,
                          billingProfile?.city,
                          billingProfile?.province,
                          billingProfile?.postal_code,
                        ]
                          .filter(Boolean)
                          .join(", ") ||
                        "Not added"
                      }
                    />

                    <BillingDetail
                      label="VAT number"
                      value={
                        billingProfile?.vat_number ||
                        "Not added"
                      }
                    />

                  </div>
                )}

              </CardContent>

            </CardShell>

          </div>


          <div className="space-y-8">

            <CardShell>

              <CardHeader>

                <CardTitle className="text-xl">
                  Payment Security
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  How your card payments are
                  handled.
                </p>

              </CardHeader>


              <CardContent className="space-y-4">

                <SecurityItem
                  icon={LockKeyhole}
                  title="Secure checkout"
                  description="Card details are collected by a certified payment provider."
                />

                <SecurityItem
                  icon={ShieldCheck}
                  title="No raw card storage"
                  description="GoodKeeper never stores complete card numbers or CVV values."
                />

                <SecurityItem
                  icon={CreditCard}
                  title="Card reference only"
                  description="Only safe details such as card brand and last four digits are displayed."
                />

              </CardContent>

            </CardShell>


            <CardShell>

              <CardHeader>

                <CardTitle className="text-xl">
                  Billing History
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Your latest GoodKeeper
                  subscription payment.
                </p>

              </CardHeader>


              <CardContent>

                {subscription?.last_payment_reference ? (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">

                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          GoodKeeper Standard
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          Subscription payment
                        </p>
                      </div>

                      <p className="text-sm font-semibold text-white">
                        {formatMoney(
                          monthlyAmount
                        )}
                      </p>

                    </div>


                    <div className="mt-5 space-y-3 border-t border-zinc-800 pt-4">

                      <BillingHistoryDetail
                        label="Payment date"
                        value={formatDate(
                          subscription.last_payment_at
                        )}
                      />

                      <BillingHistoryDetail
                        label="Reference"
                        value={
                          subscription.last_payment_reference
                        }
                      />

                      <BillingHistoryDetail
                        label="Payment method"
                        value={
                          paymentMethod
                        }
                      />

                      <BillingHistoryDetail
                        label="Status"
                        value="Successful"
                      />

                    </div>

                  </div>
                ) : (
                  <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">

                    <FileText className="h-9 w-9 text-zinc-600" />

                    <p className="mt-4 font-medium text-zinc-300">
                      No billing history
                    </p>

                    <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                      Payment records will
                      appear here after your
                      first subscription payment.
                    </p>

                  </div>
                )}

              </CardContent>

            </CardShell>

          </div>

        </section>

      </div>
    </main>
  );
}


function BillingInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-medium text-zinc-400">
        {label}
        {required && (
          <span className="ml-1 text-purple-300">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500"
      />

    </label>
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
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <CardShell>

      <CardContent className="flex min-h-44 items-start justify-between gap-5 p-6">

        <div className="min-w-0">

          <p className="text-sm text-zinc-400">
            {title}
          </p>

          <p className="mt-4 break-words text-xl font-semibold leading-snug tracking-tight">
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

      <span className="text-sm text-zinc-500">
        {label}
      </span>

      <span className="break-all text-sm font-medium text-zinc-200 sm:text-right">
        {value}
      </span>

    </div>
  );
}


function BillingHistoryDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

      <span className="text-xs text-zinc-500">
        {label}
      </span>

      <span className="break-all text-xs font-medium text-zinc-300 sm:text-right">
        {value}
      </span>

    </div>
  );
}


function SecurityItem({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
        <Icon className="h-4 w-4 text-purple-300" />
      </div>

      <div>

        <p className="text-sm font-medium text-zinc-200">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
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