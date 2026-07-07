"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Plane,
  Clock,
  Users,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

interface CabinClass {
  id: string
  class_type: string
  price: number
  available_seats: number
  total_seats: number
}

interface Flight {
  id: string
  flight_number: string
  airline_code: string
  airline_name: string
  departure_airport: string
  arrival_airport: string
  departure_time: string
  arrival_time: string
  duration: string
  cabin_classes: CabinClass[]
}

interface FlightsWrapper {
  data: Flight[]
}

interface SearchResponse {
  flights: FlightsWrapper
  status: boolean
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const origin = searchParams.get("origin") || ""
  const destination = searchParams.get("destination") || ""
  const date = searchParams.get("date") || ""
  const adults = searchParams.get("adults") || "1"
  const cabinClass = searchParams.get("class") || "economy"

  const { data, isLoading, error } = useQuery<SearchResponse>({
    queryKey: ["flights", origin, destination, date, adults, cabinClass],
    queryFn: async () => {
      const res = await api.get("/flights/search", {
        params: { origin, destination, date, adults, class: cabinClass },
      })
      return res.data
    },
    enabled: !!(origin && destination && date),
    retry: 1,
  })

  useEffect(() => {
    if (error) {
      const msg =
        (error as any)?.response?.data?.error || "Failed to fetch flights"
      toast.error(msg)
    }
  }, [error])

  if (!origin || !destination || !date) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="space-y-4 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Invalid search parameters</p>
          <Button asChild variant="outline">
            <Link href="/search">Back to Search</Link>
          </Button>
        </div>
      </div>
    )
  }

  const flights = data?.flights?.data ?? []

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-muted/30">
      {/* Search Summary Bar */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link href="/search">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">{origin}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="font-semibold">{destination}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {date ? format(parseISO(date), "MMM dd, yyyy") : ""}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground capitalize">
                {cabinClass}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" />
                {adults}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <Link href="/search">Modify</Link>
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto max-w-3xl space-y-4 px-4 py-8">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="space-y-4 p-6">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-1 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <div className="space-y-4 py-20 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <p className="text-muted-foreground">
              Something went wrong. Please try again.
            </p>
            <Button onClick={() => router.refresh()}>Retry</Button>
          </div>
        ) : flights.length === 0 ? (
          <div className="space-y-4 py-20 text-center">
            <Plane className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No flights found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search criteria
            </p>
            <Button asChild variant="outline">
              <Link href="/search">New Search</Link>
            </Button>
          </div>
        ) : (
          flights.map((flight) => {
            const cabin = flight.cabin_classes.find(
              (c) => c.class_type === cabinClass
            )

            return (
              <Card
                key={flight.id}
                className="group cursor-pointer border-border transition-colors hover:border-primary/50"
              >
                <CardContent className="p-6">
                  {/* Airline & Price */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {flight.airline_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {flight.flight_number}
                      </p>
                    </div>
                    {cabin && (
                      <div className="text-right">
                        <p className="text-xl font-bold text-foreground">
                          ${cabin.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          per person
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="mb-4 flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold">
                        {format(parseISO(flight.departure_time), "HH:mm")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {flight.departure_airport}
                      </p>
                    </div>

                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <div className="flex flex-col items-center gap-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {flight.duration}
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold">
                        {format(parseISO(flight.arrival_time), "HH:mm")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {flight.arrival_airport}
                      </p>
                    </div>
                  </div>

                  {/* Cabin Info */}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="rounded-full text-xs">
                      <Users className="mr-1 h-3 w-3" />
                      {cabin
                        ? `${cabin.available_seats} seats left`
                        : "Unavailable"}
                    </Badge>
                    <Button
                      size="sm"
                      className="rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      disabled={
                        !cabin || cabin.available_seats < parseInt(adults)
                      }
                    >
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
