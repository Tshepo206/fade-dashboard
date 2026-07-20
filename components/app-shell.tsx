import { AppSidebar } from "@/components/app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <AppSidebar />

      <div className="min-h-screen lg:pl-72">
        {children}
      </div>
    </div>
  );
}