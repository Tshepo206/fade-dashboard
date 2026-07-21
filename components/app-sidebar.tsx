"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bot,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Sparkles,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { createClient } from "@/lib/supabase/client";

type NavigationItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const navigationGroups: NavigationGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Calendar",
        href: "/calendar",
        icon: CalendarDays,
      },
      {
        label: "Customers",
        href: "/customers",
        icon: Users,
      },
      {
        label: "Transactions",
        href: "/transactions",
        icon: ReceiptText,
      },
      {
        label: "Reconciliation",
        href: "/reconciliation",
        icon: WalletCards,
      },
    ],
  },
  {
    label: "Intelligence",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: ChartNoAxesCombined,
      },
      {
        label: "AI Insights",
        href: "/insights",
        icon: Bot,
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        label: "Billing",
        href: "/billing",
        icon: CreditCard,
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

function isNavigationItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNavigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-7 px-4">
      {navigationGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            {group.label}
          </p>

          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isNavigationItemActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={[
                    "group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition",
                    active
                      ? "bg-purple-500 text-white shadow-lg shadow-purple-500/15"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={[
                        "h-5 w-5 shrink-0 transition",
                        active
                          ? "text-white"
                          : "text-zinc-500 group-hover:text-white",
                      ].join(" ")}
                    />

                    <span>{item.label}</span>
                  </div>

                  {active && (
                    <ChevronRight className="h-4 w-4 text-white/80" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function BrandBlock() {
  return (
    <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500 text-white shadow-lg shadow-purple-500/20">
        <Sparkles className="h-5 w-5" />

        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#050505] bg-emerald-400" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-lg font-semibold tracking-tight text-white">
          GoodKeeper
        </p>

        <p className="truncate text-xs text-zinc-500">
          AI business operating system
        </p>
      </div>
    </Link>
  );
}

function LogoutButton({
  onLoggedOut,
}: {
  onLoggedOut?: () => void;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      onLoggedOut?.();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={loggingOut}
      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm font-medium text-zinc-300 transition hover:border-purple-500 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Log out"
    >
      {loggingOut ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Logging out...</span>
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </>
      )}
    </button>
  );
}

function getBusinessInitials(businessName: string) {
  const initials = businessName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return initials || "W";
}

function BusinessWorkspaceCard({
  businessName,
  businessInitials,
}: {
  businessName: string;
  businessInitials: string;
}) {
  return (
    <div className="mx-4 mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-sm font-semibold text-white">
          {businessInitials}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {businessName}
          </p>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Revenue, bookings, customers, and bookkeeping.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-800 bg-black/40 px-3 py-2">
        <span className="text-xs text-zinc-500">Workspace status</span>

        <span className="flex items-center gap-2 text-xs font-medium text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Active
        </span>
      </div>
    </div>
  );
}

function SidebarFooter({
  businessName,
  businessInitials,
}: {
  businessName: string;
  businessInitials: string;
}) {
  return (
    <div className="border-t border-zinc-800 p-4">
      <Link
        href="/settings"
        className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 transition hover:bg-zinc-900"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
          {businessInitials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {businessName}
          </p>

          <p className="truncate text-xs text-zinc-500">
            Business settings
          </p>
        </div>

        <Settings className="h-4 w-4 text-zinc-500" />
      </Link>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const workspace = useCurrentWorkspace();

  const businessName = workspace?.business_name || "Workspace";
  const businessInitials = getBusinessInitials(businessName);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-zinc-800 bg-[#050505] lg:flex lg:flex-col">
        <div className="flex min-h-24 items-center justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          <BrandBlock />
          <LogoutButton />
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto py-6">
          <SidebarNavigation pathname={pathname} />

          <BusinessWorkspaceCard
            businessName={businessName}
            businessInitials={businessInitials}
          />
        </div>

        <SidebarFooter
          businessName={businessName}
          businessInitials={businessInitials}
        />
      </aside>

      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-zinc-800 bg-black/90 px-4 py-3 backdrop-blur lg:hidden">
        <BrandBlock />

        <div className="flex items-center gap-2">
          <LogoutButton />

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:text-white"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation overlay"
          />

          <aside className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col border-r border-zinc-800 bg-[#050505] shadow-2xl">
            <div className="flex min-h-20 items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
              <BrandBlock />

              <div className="flex items-center gap-2">
                <LogoutButton onLoggedOut={() => setMobileOpen(false)} />

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:text-white"
                  aria-label="Close navigation"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto py-6">
              <SidebarNavigation
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />

              <BusinessWorkspaceCard
                businessName={businessName}
                businessInitials={businessInitials}
              />
            </div>

            <SidebarFooter
              businessName={businessName}
              businessInitials={businessInitials}
            />
          </aside>
        </div>
      )}
    </>
  );
}