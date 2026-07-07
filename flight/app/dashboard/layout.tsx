"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Home, Plane, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const tabs = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "My Bookings", href: "/dashboard/bookings", icon: Plane },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, accessToken, clearAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Small delay to allow Zustand rehydration from localStorage
    const timer = setTimeout(() => {
      if (!accessToken || !user) {
        router.replace("/auth/login");
      }
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [accessToken, user, router]);

  // Show loading while checking auth state
  if (isChecking) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If not authenticated, don't render layout (redirect happens in useEffect)
  if (!accessToken || !user) {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col">
        {/* User Profile Summary */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
              {user?.first_name?.charAt(0).toUpperCase() || "U"}
              {user?.last_name?.charAt(0).toUpperCase() || "I"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-foreground">
                {user?.first_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-6 w-6 shrink-0" strokeWidth={1.5} />
                <span className="text-sm font-medium">{tab.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border">
          <button
            onClick={clearAuth}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-6 w-6 shrink-0" strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8 bg-background">
        {children}
      </main>
    </div>
  );
}