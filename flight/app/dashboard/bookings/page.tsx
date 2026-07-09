"use client"

import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plane,
  Calendar,
  ArrowRight,
  AlertCircle,
  Ticket,
  Clock,
} from "lucide-react"

interface Booking {
  id: string
  booking_reference: string
  status: string
  total_amount: number
  payment_status: string
  flight_id: string
  flight_type: string
  flight_number: string
  airline_code: string
  airline_name: string
  departure_airport: string
  arrival_airport: string
  departure_time: string
  arrival_time: string
  cabin_class: string
  duration: string
  created_at: string
}

interface BookingsResponse {
  status: boolean
  data: Booking[]
}

export default function BookingsListPage() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<BookingsResponse>({
    queryKey: ["bookings"],
    queryFn: async () => {
      const res = await api.get("/bookings/list")
      return res.data
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await api.post(`/bookings/${bookingId}/cancel`)
      return res.data
    },
    onSuccess: () => {
      toast.success("Booking cancelled successfully")
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || "Failed to cancel booking"
      toast.error(msg)
    },
  })

  const bookings = data?.data ?? []

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "default"
      case "pending":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground">
          Manage your upcoming and past flights
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="space-y-4 py-20 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <p className="text-muted-foreground">Failed to load bookings</p>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["bookings"] })
            }
          >
            Retry
          </Button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="space-y-4 py-20 text-center">
          <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No bookings yet</p>
          <p className="text-sm text-muted-foreground">
            Your booked flights will appear here
          </p>
          <Button asChild className="rounded-full">
            <Link href="/search">Find a Flight</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              className="border-border transition-colors hover:border-primary/50"
            >
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-bold tracking-tight">
                        {booking.booking_reference}
                      </span>
                      <Badge
                        variant={getStatusVariant(booking.status)}
                        className="rounded-full text-xs capitalize"
                      >
                        {booking.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="rounded-full text-xs capitalize"
                      >
                        {booking.cabin_class}
                      </Badge>
                    </div>

                    {/* Flight Route */}
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-xl font-bold">
                          {format(parseISO(booking.departure_time), "HH:mm")}
                        </p>
                        <p className="text-xs font-medium text-muted-foreground">
                          {booking.departure_airport}
                        </p>
                      </div>
                      <div className="flex flex-1 flex-col items-center gap-0.5 px-2">
                        <Plane className="h-3.5 w-3.5 text-muted-foreground" />
                        <div className="h-px w-full bg-border" />
                        <span className="text-[10px] text-muted-foreground">
                          {booking.duration}
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold">
                          {format(parseISO(booking.arrival_time), "HH:mm")}
                        </p>
                        <p className="text-xs font-medium text-muted-foreground">
                          {booking.arrival_airport}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {format(
                          parseISO(booking.departure_time),
                          "EEE, MMM d, yyyy"
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {booking.airline_name}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">
                        ${booking.total_amount.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        · {booking.payment_status}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {booking.status.toLowerCase() === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to cancel this booking?"
                            )
                          ) {
                            cancelMutation.mutate(booking.id)
                          }
                        }}
                        disabled={cancelMutation.isPending}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button size="sm" className="gap-1 rounded-full" asChild>
                      <Link href={`/dashboard/bookings/${booking.id}`}>
                        Details
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
