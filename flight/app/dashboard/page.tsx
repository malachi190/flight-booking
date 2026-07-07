"use client"

import { useAuthStore } from "@/stores/auth-store"
import { Plane, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useAuthStore()

//   console.log("user", user)

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {user?.first_name || "Traveler"}
        </h1>
        <p className="text-muted-foreground">
          Ready to book your next flight? Search for available routes and manage
          your trips from here.
        </p>
      </div>

      {/* Quick Action Card */}
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="w-fit rounded-full bg-primary/10 p-3">
              <Plane className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">
                Find a Flight
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Browse 50+ daily flights across 10 global routes with real-time
                availability.
              </p>
            </div>
            <Button asChild className="gap-2 rounded-full">
              <Link href="/search">
                Search Flights
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Placeholder Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <div className="text-2xl font-bold text-foreground">0</div>
          <div className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
            Upcoming Trips
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <div className="text-2xl font-bold text-foreground">0</div>
          <div className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
            Past Flights
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <div className="text-2xl font-bold text-foreground">—</div>
          <div className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
            Next Departure
          </div>
        </div>
      </div>
    </div>
  )
}
