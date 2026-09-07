"use client";

import {
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { getCurrentWorkspace } from "@/lib/workspace";


const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;


type OnboardingForm = {
  businessName: string;
  ownerName: string;
  currency: string;
  timezone: string;
};


type BillingForm = {
  billingName: string;
  billingEmail: string;
  billingPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  companyRegistrationNumber: string;
  vatNumber: string;
};


const EMPTY_FORM: OnboardingForm = {
  businessName: "",
  ownerName: "",
  currency: "ZAR",
  timezone: "Africa/Johannesburg",
};


const EMPTY_BILLING_FORM: BillingForm = {
  billingName: "",
  billingEmail: "",
  billingPhone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  province: "",
  postalCode: "",
  country: "ZA",
  companyRegistrationNumber: "",
  vatNumber: "",
};


export default function OnboardingPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<OnboardingForm>(EMPTY_FORM);

  const [step, setStep] = useState<
    "business" | "billing" | "payment"
  >("business");

  const [billingForm, setBillingForm] =
    useState<BillingForm>(
      EMPTY_BILLING_FORM
    );

  const [businessId, setBusinessId] =
    useState<string | null>(null);

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [openingCheckout, setOpeningCheckout] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  useEffect(() => {
    async function loadCurrentUser() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const metadata =
        user.user_metadata ?? {};

      const businessName =
        typeof metadata.business_name === "string"
          ? metadata.business_name
          : "";

      const ownerName =
        typeof metadata.owner_name === "string"
          ? metadata.owner_name
          : "";

      setForm({
        businessName,
        ownerName,
        currency: "ZAR",
        timezone: "Africa/Johannesburg",
      });

      setBillingForm((current) => ({
        ...current,
        billingName: businessName,
        billingEmail: user.email ?? "",
      }));


      // -----------------------------------------------------
      // Detect return from Paystack
      // -----------------------------------------------------

      const searchParams =
        new URLSearchParams(
          window.location.search
        );

      const paymentReference =
        searchParams.get("reference") ||
        searchParams.get("trxref");


      if (!paymentReference) {
        setLoadingProfile(false);
        return;
      }


      if (!API_BASE_URL) {
        setError(
          "Billing API is not configured."
        );

        setLoadingProfile(false);
        return;
      }


      try {
        setSuccessMessage(
          "Payment method verified. Finishing your GoodKeeper setup..."
        );


        const workspace =
          await getCurrentWorkspace();

        if (!workspace?.business_id) {
          throw new Error(
            "Your GoodKeeper workspace could not be found."
          );
        }

        const currentBusinessId =
          workspace.business_id;

        setBusinessId(
          currentBusinessId
        );

        setStep("payment");


        // Paystack may redirect the browser before
        // its webhook has finished updating our database.
        // Poll briefly until the subscription setup appears.
        let paymentSetupComplete = false;

        for (
          let attempt = 0;
          attempt < 10;
          attempt += 1
        ) {
          const response = await fetch(
            `${API_BASE_URL}/billing/subscription/${currentBusinessId}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );


          if (response.ok) {
            const data =
              await response.json();

            const subscription =
              data.subscription;


            const hasPaymentMethod =
              Boolean(
                subscription?.card_last4
              );

            const hasSubscription =
              Boolean(
                subscription?.subscription_code
              );


            if (
              hasPaymentMethod &&
              hasSubscription
            ) {
              paymentSetupComplete = true;
              break;
            }
          }


          await new Promise((resolve) =>
            window.setTimeout(
              resolve,
              1000
            )
          );
        }


        if (!paymentSetupComplete) {
          setError(
            "Your card was verified, but GoodKeeper is still finishing the subscription setup. Please wait a moment and refresh this page."
          );

          setLoadingProfile(false);
          return;
        }


        setSuccessMessage(
          "Your payment method has been added. Your 30-day free trial is active."
        );


        window.setTimeout(() => {
          router.replace("/dashboard");
          router.refresh();
        }, 1200);

      } catch (requestError) {
        console.error(
          "[Onboarding] Payment return processing failed:",
          requestError
        );

        setError(
          requestError instanceof Error
            ? requestError.message
            : (
                "Unable to complete your " +
                "GoodKeeper setup."
              )
        );

        setStep("payment");
        setLoadingProfile(false);
      }
    }


    void loadCurrentUser();

  }, [router]);


  function updateField(
    field: keyof OnboardingForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccessMessage("");
  }


  function updateBillingField(
    field: keyof BillingForm,
    value: string
  ) {
    setBillingForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccessMessage("");
  }


  function validateForm() {
    if (!form.businessName.trim()) {
      return "Enter your business name.";
    }

    if (!form.ownerName.trim()) {
      return "Enter the owner name.";
    }

    return "";
  }


  function validateBillingForm() {
    if (!billingForm.billingName.trim()) {
      return "Enter the billing name.";
    }

    if (!billingForm.billingEmail.trim()) {
      return "Enter the billing email.";
    }

    if (!billingForm.billingPhone.trim()) {
      return "Enter the billing phone number.";
    }

    if (!billingForm.addressLine1.trim()) {
      return "Enter the billing address.";
    }

    if (!billingForm.city.trim()) {
      return "Enter the city.";
    }

    if (!billingForm.province.trim()) {
      return "Enter the province.";
    }

    if (!billingForm.postalCode.trim()) {
      return "Enter the postal code.";
    }

    return "";
  }


  async function handleSubmit(
  event: FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  const validationError =
    validateForm();

  if (validationError) {
    setError(validationError);
    return;
  }

  setSaving(true);
  setError("");
  setSuccessMessage("");

  try {
    // First check whether this user already
    // belongs to an existing workspace.
    try {
      const existingWorkspace =
        await getCurrentWorkspace();

      if (existingWorkspace?.business_id) {
        setBusinessId(
          existingWorkspace.business_id
        );

        setBillingForm((current) => ({
          ...current,
          billingName:
            current.billingName ||
            existingWorkspace.business_name ||
            form.businessName.trim(),
        }));

        setSuccessMessage(
          "Workspace found. Continue with your billing details."
        );

        setStep("billing");
        return;
      }
    } catch {
      // No existing workspace.
      // Continue and create a new one.
    }

    const supabase = createClient();

    const {
      data: createdBusinessId,
      error: workspaceError,
    } = await supabase.rpc(
      "create_business_workspace",
      {
        p_business_name:
          form.businessName.trim(),
        p_owner_name:
          form.ownerName.trim(),
        p_currency:
          form.currency,
        p_timezone:
          form.timezone,
      }
    );

    if (workspaceError) {
      throw workspaceError;
    }

    if (!createdBusinessId) {
      throw new Error(
        "The workspace could not be created."
      );
    }

    setBusinessId(
      String(createdBusinessId)
    );

    setBillingForm((current) => ({
      ...current,
      billingName:
        current.billingName ||
        form.businessName.trim(),
    }));

    setSuccessMessage(
      "Workspace created. Now add your billing details."
    );

    setStep("billing");

  } catch (requestError) {
    setError(
      requestError instanceof Error
        ? requestError.message
        : (
            "Workspace creation failed. " +
            "Please try again."
          )
    );
  } finally {
    setSaving(false);
  }
}


  async function handleBillingSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const validationError =
      validateBillingForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!businessId) {
      setError(
        "Your workspace has not been created yet."
      );
      return;
    }

    if (!API_BASE_URL) {
      setError(
        "Billing API is not configured."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/billing/profile/${businessId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            billing_name:
              billingForm.billingName.trim(),

            billing_email:
              billingForm.billingEmail.trim(),

            billing_phone:
              billingForm.billingPhone.trim(),

            address_line_1:
              billingForm.addressLine1.trim(),

            address_line_2:
              billingForm.addressLine2.trim(),

            city:
              billingForm.city.trim(),

            province:
              billingForm.province.trim(),

            postal_code:
              billingForm.postalCode.trim(),

            country:
              billingForm.country || "ZA",

            company_registration_number:
              billingForm
                .companyRegistrationNumber
                .trim(),

            vat_number:
              billingForm.vatNumber.trim(),
          }),
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

      setSuccessMessage(
        "Billing details saved. Add your payment method to start your 30-day free trial."
      );

      setStep("payment");

    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save billing details."
      );
    } finally {
      setSaving(false);
    }
  }


  async function handleAddPaymentMethod() {
    if (!businessId) {
      setError(
        "Your workspace has not been created yet."
      );
      return;
    }

    if (!API_BASE_URL) {
      setError(
        "Billing API is not configured."
      );
      return;
    }

    if (!billingForm.billingEmail.trim()) {
      setError(
        "A billing email is required."
      );
      return;
    }

    setOpeningCheckout(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/billing/initialize-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email:
              billingForm.billingEmail.trim(),

            business_id:
              businessId,
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
            "Unable to open secure payment setup."
        );
      }

      window.location.href =
        data.authorization_url;

    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : (
              "Unable to open secure " +
              "payment setup."
            )
      );

      setOpeningCheckout(false);
    }
  }


  if (loadingProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">

        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your account...
        </div>

      </main>
    );
  }


  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-5 py-10 text-white">

      <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-purple-600/15 blur-[130px]" />


      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">

        <section className="grid w-full overflow-hidden rounded-[2rem] border border-zinc-800 bg-[#080808] shadow-[0_0_0_1px_rgba(255,255,255,0.03)] lg:grid-cols-[0.9fr_1.1fr]">


          <div className="hidden border-r border-zinc-800 bg-gradient-to-br from-purple-500/15 via-black to-black p-12 lg:flex lg:flex-col lg:justify-between">

            <div>

              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-200">

                <Sparkles className="h-3.5 w-3.5" />

                GoodKeeper setup

              </div>


              <h1 className="mt-8 max-w-md text-4xl font-semibold tracking-tight">

                Set up your GoodKeeper workspace.

              </h1>


              <p className="mt-5 max-w-md text-base leading-8 text-zinc-400">

                Create your business workspace,
                add billing details, then securely
                add a card to begin your 30-day
                free trial.

              </p>


              <div className="mt-10 space-y-3">

                <StepIndicator
                  number="01"
                  title="Business details"
                  active={step === "business"}
                  complete={
                    step === "billing" ||
                    step === "payment"
                  }
                />

                <StepIndicator
                  number="02"
                  title="Billing details"
                  active={step === "billing"}
                  complete={
                    step === "payment"
                  }
                />

                <StepIndicator
                  number="03"
                  title="Payment method"
                  active={step === "payment"}
                  complete={false}
                />

              </div>

            </div>


            <div className="mt-16 space-y-4">

              <SetupFeature
                title="30-day free trial"
                description="Your R699 monthly subscription starts after your trial ends."
              />

              <SetupFeature
                title="Secure card setup"
                description="Card details are handled securely by our certified payment provider."
              />

              <SetupFeature
                title="No raw card storage"
                description="GoodKeeper never stores your full card number or CVV."
              />

            </div>

          </div>


          <div className="p-7 sm:p-10 lg:p-12">

            <div className="mx-auto max-w-lg">


              {step === "business" && (
                <>

                  <p className="text-sm font-medium text-purple-300">
                    Step 1 of 3
                  </p>


                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                    Tell us about your business
                  </h2>


                  <p className="mt-3 text-sm leading-6 text-zinc-400">

                    These details create your
                    private GoodKeeper workspace.

                  </p>


                  <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-5"
                  >

                    <OnboardingField
                      label="Business name"
                      value={form.businessName}
                      onChange={(value) =>
                        updateField(
                          "businessName",
                          value
                        )
                      }
                      placeholder="Mike's Barbers"
                      icon={Building2}
                      disabled={saving}
                      autoComplete="organization"
                    />


                    <OnboardingField
                      label="Owner name"
                      value={form.ownerName}
                      onChange={(value) =>
                        updateField(
                          "ownerName",
                          value
                        )
                      }
                      placeholder="Mike Johnson"
                      icon={UserRound}
                      disabled={saving}
                      autoComplete="name"
                    />


                    <label className="block">

                      <span className="text-sm font-medium text-zinc-300">
                        Reporting currency
                      </span>

                      <select
                        value={form.currency}
                        onChange={(event) =>
                          updateField(
                            "currency",
                            event.target.value
                          )
                        }
                        disabled={saving}
                        className="mt-2 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 [color-scheme:dark]"
                      >

                        <option value="ZAR">
                          South African Rand (ZAR)
                        </option>

                        <option value="USD">
                          US Dollar (USD)
                        </option>

                        <option value="GBP">
                          British Pound (GBP)
                        </option>

                        <option value="EUR">
                          Euro (EUR)
                        </option>

                      </select>

                    </label>


                    <label className="block">

                      <span className="text-sm font-medium text-zinc-300">
                        Timezone
                      </span>

                      <select
                        value={form.timezone}
                        onChange={(event) =>
                          updateField(
                            "timezone",
                            event.target.value
                          )
                        }
                        disabled={saving}
                        className="mt-2 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 [color-scheme:dark]"
                      >

                        <option value="Africa/Johannesburg">
                          Johannesburg
                        </option>

                        <option value="Africa/Harare">
                          Harare
                        </option>

                        <option value="Africa/Gaborone">
                          Gaborone
                        </option>

                        <option value="Africa/Windhoek">
                          Windhoek
                        </option>

                        <option value="UTC">
                          UTC
                        </option>

                      </select>

                    </label>


                    <FeedbackMessages
                      error={error}
                      successMessage={
                        successMessage
                      }
                    />


                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating workspace...
                        </>
                      ) : (
                        "Continue to Billing"
                      )}

                    </button>

                  </form>

                </>
              )}


              {step === "billing" && (
                <>

                  <p className="text-sm font-medium text-purple-300">
                    Step 2 of 3
                  </p>


                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                    Billing details
                  </h2>


                  <p className="mt-3 text-sm leading-6 text-zinc-400">

                    We&apos;ll use these details for
                    your GoodKeeper billing records.

                  </p>


                  <form
                    onSubmit={
                      handleBillingSubmit
                    }
                    className="mt-8 space-y-5"
                  >

                    <OnboardingField
                      label="Billing name"
                      value={
                        billingForm.billingName
                      }
                      onChange={(value) =>
                        updateBillingField(
                          "billingName",
                          value
                        )
                      }
                      placeholder="Mike's Barbers"
                      icon={Building2}
                      disabled={saving}
                      autoComplete="organization"
                    />


                    <OnboardingField
                      label="Billing email"
                      value={
                        billingForm.billingEmail
                      }
                      onChange={(value) =>
                        updateBillingField(
                          "billingEmail",
                          value
                        )
                      }
                      placeholder="accounts@example.com"
                      icon={Mail}
                      disabled={saving}
                      autoComplete="email"
                      type="email"
                    />


                    <OnboardingField
                      label="Billing phone"
                      value={
                        billingForm.billingPhone
                      }
                      onChange={(value) =>
                        updateBillingField(
                          "billingPhone",
                          value
                        )
                      }
                      placeholder="+27 82 123 4567"
                      icon={Phone}
                      disabled={saving}
                      autoComplete="tel"
                      type="tel"
                    />


                    <OnboardingField
                      label="Address line 1"
                      value={
                        billingForm.addressLine1
                      }
                      onChange={(value) =>
                        updateBillingField(
                          "addressLine1",
                          value
                        )
                      }
                      placeholder="12 Main Road"
                      icon={MapPin}
                      disabled={saving}
                      autoComplete="address-line1"
                    />


                    <OnboardingField
                      label="Address line 2"
                      value={
                        billingForm.addressLine2
                      }
                      onChange={(value) =>
                        updateBillingField(
                          "addressLine2",
                          value
                        )
                      }
                      placeholder="Suite / unit / suburb"
                      icon={MapPin}
                      disabled={saving}
                      autoComplete="address-line2"
                    />


                    <div className="grid gap-4 sm:grid-cols-2">

                      <SimpleField
                        label="City"
                        value={
                          billingForm.city
                        }
                        onChange={(value) =>
                          updateBillingField(
                            "city",
                            value
                          )
                        }
                        placeholder="Johannesburg"
                        disabled={saving}
                      />


                      <SimpleField
                        label="Province"
                        value={
                          billingForm.province
                        }
                        onChange={(value) =>
                          updateBillingField(
                            "province",
                            value
                          )
                        }
                        placeholder="Gauteng"
                        disabled={saving}
                      />

                    </div>


                    <div className="grid gap-4 sm:grid-cols-2">

                      <SimpleField
                        label="Postal code"
                        value={
                          billingForm.postalCode
                        }
                        onChange={(value) =>
                          updateBillingField(
                            "postalCode",
                            value
                          )
                        }
                        placeholder="2055"
                        disabled={saving}
                      />


                      <SimpleField
                        label="Country"
                        value={
                          billingForm.country
                        }
                        onChange={(value) =>
                          updateBillingField(
                            "country",
                            value
                          )
                        }
                        placeholder="ZA"
                        disabled={saving}
                      />

                    </div>


                    <SimpleField
                      label="Company registration number (optional)"
                      value={
                        billingForm
                          .companyRegistrationNumber
                      }
                      onChange={(value) =>
                        updateBillingField(
                          "companyRegistrationNumber",
                          value
                        )
                      }
                      placeholder="2026/123456/07"
                      disabled={saving}
                    />


                    <SimpleField
                      label="VAT number (optional)"
                      value={
                        billingForm.vatNumber
                      }
                      onChange={(value) =>
                        updateBillingField(
                          "vatNumber",
                          value
                        )
                      }
                      placeholder="4xxxxxxxxx"
                      disabled={saving}
                    />


                    <FeedbackMessages
                      error={error}
                      successMessage={
                        successMessage
                      }
                    />


                    <div className="flex gap-3">

                      <button
                        type="button"
                        onClick={() => {
                          setStep("business");
                          setError("");
                          setSuccessMessage("");
                        }}
                        disabled={saving}
                        className="h-12 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-60"
                      >
                        Back
                      </button>


                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex h-12 flex-[1.5] items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >

                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Continue to Payment"
                        )}

                      </button>

                    </div>

                  </form>

                </>
              )}


              {step === "payment" && (
                <>

                  <p className="text-sm font-medium text-purple-300">
                    Step 3 of 3
                  </p>


                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                    Add your payment method
                  </h2>


                  <p className="mt-3 text-sm leading-6 text-zinc-400">

                    Add a card to activate your
                    30-day GoodKeeper free trial.

                  </p>


                  <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">

                    <div className="flex items-start gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">

                        <CreditCard className="h-5 w-5 text-purple-300" />

                      </div>


                      <div>

                        <p className="font-medium text-zinc-200">
                          Secure card verification
                        </p>

                        <p className="mt-2 text-sm leading-6 text-zinc-400">

                          A R1 verification charge
                          will be processed and
                          automatically refunded.

                        </p>

                        <p className="mt-2 text-sm leading-6 text-zinc-400">

                          Your first R699 monthly
                          subscription payment will
                          only be charged after your
                          30-day free trial ends.

                        </p>

                      </div>

                    </div>

                  </div>


                  <div className="mt-5 rounded-2xl border border-zinc-800 bg-black/40 p-5">

                    <div className="flex items-center justify-between gap-4">

                      <div>
                        <p className="text-sm text-zinc-500">
                          Plan
                        </p>

                        <p className="mt-1 font-medium text-zinc-200">
                          GoodKeeper Standard
                        </p>
                      </div>

                      <p className="font-semibold text-white">
                        R699/month
                      </p>

                    </div>


                    <div className="mt-4 flex items-center gap-2 border-t border-zinc-800 pt-4 text-sm text-emerald-300">

                      <CheckCircle2 className="h-4 w-4" />

                      30 days free before first billing

                    </div>

                  </div>


                  <FeedbackMessages
                    error={error}
                    successMessage={
                      successMessage
                    }
                  />


                  <div className="mt-6 flex gap-3">

                    <button
                      type="button"
                      onClick={() => {
                        setStep("billing");
                        setError("");
                        setSuccessMessage("");
                      }}
                      disabled={openingCheckout}
                      className="h-12 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-60"
                    >
                      Back
                    </button>


                    <button
                      type="button"
                      onClick={
                        handleAddPaymentMethod
                      }
                      disabled={
                        openingCheckout
                      }
                      className="inline-flex h-12 flex-[1.5] items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {openingCheckout ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Opening secure checkout...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Add Payment Method
                        </>
                      )}

                    </button>

                  </div>


                  <p className="mt-4 text-center text-xs leading-5 text-zinc-600">

                    Card details are entered
                    directly with our payment
                    provider. GoodKeeper does not
                    store complete card numbers or
                    CVV values.

                  </p>

                </>
              )}


            </div>

          </div>

        </section>

      </div>

    </main>
  );
}


function FeedbackMessages({
  error,
  successMessage,
}: {
  error: string;
  successMessage: string;
}) {
  return (
    <>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200"
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-200">

          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          {successMessage}

        </div>
      )}
    </>
  );
}


function OnboardingField({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  disabled,
  autoComplete,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  disabled: boolean;
  autoComplete: string;
  type?: string;
}) {
  return (
    <label className="block">

      <span className="text-sm font-medium text-zinc-300">
        {label}
      </span>


      <div className="relative mt-2">

        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        />

      </div>

    </label>
  );
}


function SimpleField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
}) {
  return (
    <label className="block">

      <span className="text-sm font-medium text-zinc-300">
        {label}
      </span>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        disabled={disabled}
        className="mt-2 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60"
      />

    </label>
  );
}


function StepIndicator({
  number,
  title,
  active,
  complete,
}: {
  number: string;
  title: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        active
          ? "border-purple-500/30 bg-purple-500/10"
          : "border-zinc-800 bg-black/30"
      }`}
    >

      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold ${
          complete
            ? "bg-emerald-500/10 text-emerald-300"
            : active
              ? "bg-purple-500/20 text-purple-200"
              : "bg-zinc-900 text-zinc-600"
        }`}
      >

        {complete ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          number
        )}

      </div>

      <span
        className={`text-sm ${
          active
            ? "font-medium text-zinc-200"
            : "text-zinc-500"
        }`}
      >
        {title}
      </span>

    </div>
  );
}


function SetupFeature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">

      <p className="font-medium text-zinc-200">
        {title}
      </p>

      <p className="mt-1 text-sm leading-6 text-zinc-500">
        {description}
      </p>

    </div>
  );
}