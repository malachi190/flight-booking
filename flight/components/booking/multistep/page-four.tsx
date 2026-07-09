import React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CreditCard, Loader2, Plane } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { Separator } from "@/components/ui/separator"
import { CabinClass, Flight } from "@/app/dashboard/bookings/new/page"
import { Button } from "@/components/ui/button"

type Passenger = {
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  passport_number: string
}

type Props = {
  flight: Flight
  flightType: "outbound" | "return"
  passengers: Passenger[]
  selectedCabin: CabinClass | undefined
  totalAmount: number
  isSubmitting: boolean
}

const StepFour = ({
  flight,
  flightType,
  passengers,
  selectedCabin,
  totalAmount,
  isSubmitting,
}: Props) => {
  return (
    <div>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Review & Confirm
          </CardTitle>
          <CardDescription>
            Verify your booking details before confirming
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Flight Summary */}
          <div className="space-y-3 rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Flight</span>
              <Badge variant="outline" className="rounded-full capitalize">
                {flightType}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-xl font-bold">
                  {format(parseISO(flight.departure_time), "HH:mm")}
                </p>
                <p className="text-xs text-muted-foreground">
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
                <p className="text-xl font-bold">
                  {format(parseISO(flight.arrival_time), "HH:mm")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {flight.arrival_airport}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Airline</span>
              <span className="font-medium">{flight.airline_name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cabin</span>
              <Badge className="rounded-full capitalize">
                {selectedCabin?.class_type}
              </Badge>
            </div>
          </div>

          {/* Passengers */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Passengers</h3>
            {passengers.map((p, i) => (
              <div
                key={i}
                className="space-y-1 rounded-lg border border-border p-3"
              >
                <p className="font-medium">
                  {p.first_name} {p.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{p.email}</p>
                <p className="text-xs text-muted-foreground">
                  Passport: {p.passport_number}
                </p>
              </div>
            ))}
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {passengers.length} × {selectedCabin?.class_type} @ $
                {selectedCabin?.price.toFixed(2)}
              </span>
              <span>${(selectedCabin?.price || 0) * passengers.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taxes & Fees</span>
              <span>Included</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Confirm Booking
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default StepFour
