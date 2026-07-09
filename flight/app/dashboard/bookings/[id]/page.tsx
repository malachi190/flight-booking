"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plane,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  CreditCard,
  AlertCircle,
  Loader2,
  Armchair,
} from "lucide-react"

interface Passenger {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  passport_number: string
  seat_id: string
  seat_number: string
}

interface Seat {
  id: string
  seat_number: string
}

interface BookingDetail {
  id: string
  booking_reference: string
  status: string
  total_amount: number
  payment_status: string
  flight_id: string
  cabin_class: string
  flight_type: string
  passengers: Passenger[]
  seats: Seat[]
  created_at: string
}

interface BookingResponse {
  status: boolean
  data: BookingDetail
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
}

interface FlightResponse {
  status: boolean
  data: Flight
}

export default function BookingDetailPage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const bookingId = params.id as string
  const [confirmCancel, setConfirmCancel] = useState(false)

  const {
    data: bookingData,
    isLoading: bookingLoading,
    error: bookingError,
  } = useQuery<BookingResponse>({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const res = await api.get(`/bookings/${bookingId}`)
      return res.data
    },
    enabled: !!bookingId,
  })

  const booking = bookingData?.data

  // Fetch flight details separately
  const { data: flightData, isLoading: flightLoading } =
    useQuery<FlightResponse>({
      queryKey: ["flight", booking?.flight_id],
      queryFn: async () => {
        const res = await api.get(`/flights/${booking?.flight_id}`)
        return res.data
      },
      enabled: !!booking?.flight_id,
    })

  const flight = flightData?.data

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/bookings/${bookingId}/cancel`)
      return res.data
    },
    onSuccess: () => {
      toast.success("Booking cancelled successfully")
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] })
      setConfirmCancel(false)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || "Failed to cancel booking"
      toast.error(msg)
    },
  })

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

  const isLoading = bookingLoading || (booking && flightLoading)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="border-border">
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (bookingError || !booking) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Booking not found</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/bookings">Back to Bookings</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/dashboard/bookings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {booking.booking_reference}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge
              variant={getStatusVariant(booking.status)}
              className="rounded-full capitalize"
            >
              {booking.status}
            </Badge>
            <Badge variant="outline" className="rounded-full capitalize">
              {booking.cabin_class}
            </Badge>
          </div>
        </div>
      </div>

      {/* Flight Info */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plane className="h-4 w-4" />
            Flight Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {flight ? (
            <>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {format(parseISO(flight.departure_time), "HH:mm")}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {flight.departure_airport}
                  </p>
                </div>
                <div className="flex flex-1 flex-col items-center gap-1 px-4">
                  <Plane className="h-4 w-4 text-muted-foreground" />
                  <div className="h-px w-full bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {flight.duration}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {format(parseISO(flight.arrival_time), "HH:mm")}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {flight.arrival_airport}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(parseISO(flight.departure_time), "EEEE, MMMM d, yyyy")}
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Airline</span>
                <span className="font-medium">{flight.airline_name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Flight</span>
                <span className="font-medium">{flight.flight_number}</span>
              </div>
            </>
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Flight details unavailable
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium capitalize">
              {booking.flight_type}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Booked on</span>
            <span className="font-medium">
              {format(parseISO(booking.created_at), "MMM dd, yyyy · HH:mm")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Passengers */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Passengers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {booking.passengers.map((p) => (
            <div
              key={p.id}
              className="space-y-2 rounded-lg border border-border p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">
                  {p.first_name} {p.last_name}
                </p>
                <Badge variant="outline" className="rounded-full text-xs">
                  <Armchair className="mr-1 h-3 w-3" />
                  {p.seat_number || "TBA"}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <div>{p.email}</div>
                <div>{p.phone}</div>
                <div>DOB: {p.date_of_birth}</div>
                <div>Passport: {p.passport_number}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="text-xl font-bold">
              ${booking.total_amount.toFixed(2)}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payment Status</span>
            <Badge
              variant={
                booking.payment_status === "paid" ? "default" : "secondary"
              }
              className="rounded-full capitalize"
            >
              {booking.payment_status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {booking.status.toLowerCase() === "pending" && (
        <div className="flex items-center justify-end gap-3">
          {confirmCancel ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmCancel(false)}
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirm Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmCancel(true)}
            >
              Cancel Booking
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
