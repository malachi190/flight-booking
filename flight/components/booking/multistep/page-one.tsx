import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge, Calendar, Check, Clock, Plane } from "lucide-react"
import { format, parseISO } from "date-fns"
import { CabinClass, Flight } from "@/app/dashboard/bookings/new/page"

type Props = {
  flight: Flight
  selectedCabin: CabinClass | undefined
}

const StepOne = ({ flight, selectedCabin }: Props) => {
  return (
    <div>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Flight Details
          </CardTitle>
          <CardDescription>
            {flight.airline_name} · {flight.flight_number}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Flight Summary */}
          <div className="space-y-3 rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {format(parseISO(flight.departure_time), "HH:mm")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {flight.departure_airport}
                </p>
              </div>
              <div className="flex flex-1 flex-col items-center gap-1 px-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="h-px w-full bg-border" />
                <span className="text-xs text-muted-foreground">
                  {flight.duration}
                </span>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {format(parseISO(flight.arrival_time), "HH:mm")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {flight.arrival_airport}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(parseISO(flight.departure_time), "EEEE, MMMM d, yyyy")}
            </div>
          </div>

          {/* Selected Cabin */}
          {selectedCabin ? (
            <div className="rounded-xl border-2 border-primary bg-primary/5 p-5">
              <div className="mb-3 flex items-center justify-between">
                <Badge className="rounded-full capitalize">
                  {selectedCabin.class_type}
                </Badge>
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  ${selectedCabin.price.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {selectedCabin.available_seats} seats available
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-destructive/30 p-5 text-center">
              <p className="text-sm text-destructive">
                Selected cabin class not available for this flight
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StepOne
