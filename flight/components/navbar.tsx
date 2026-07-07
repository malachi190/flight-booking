"use client"

import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth-store"
import { Plane } from "lucide-react"

export function Navbar() {
  const { user, clearAuth } = useAuthStore()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo — shifted right with pl-4 */}
        <Link
          href="/"
          className="flex items-center gap-2 pl-4 text-lg font-semibold"
        >
          <Plane className="h-5 w-5" />
          <span>SkyBooker</span>
        </Link>

        <nav className="flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.firstName}
              </span>
              <Button variant="ghost" size="sm" onClick={clearAuth}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
