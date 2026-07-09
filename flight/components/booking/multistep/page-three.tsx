"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Seat {
  id: string
  seat_number: string
  status: "available" | "booked"
}

interface Row {
  row_number: number
  seats: Seat[]
}

interface CabinClassSeatMap {
  id: string
  class_type: string
  rows: Row[]
}

interface SeatMapResponse {
  flight_id: string
  cabin_classes: CabinClassSeatMap[]
}

interface SeatMapProps {
  flightId: string
  cabinClassId: string
  passengerCount: number
  selectedSeatIds: string[]
  onSeatToggle: (seatId: string) => void
}

const StepThree = ({
  flightId,
  cabinClassId,
  passengerCount,
  selectedSeatIds,
  onSeatToggle,
}: SeatMapProps) => {
  const { data, isLoading, error } = useQuery<SeatMapResponse>({
    queryKey: ["seats", flightId],
    queryFn: async () => {
      const res = await api.get(`/flights/${flightId}/seats`)
      return res.data.data || res.data
    },
    enabled: !!flightId,
  })

  const cabinClass = data?.cabin_classes.find((c) => c.id === cabinClassId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !cabinClass) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>Failed to load seat map.</p>
        <p className="mt-1 text-xs">Seats will be auto-assigned.</p>
      </div>
    )
  }

  const isSelected = (seatId: string) => selectedSeatIds.includes(seatId)
  const canSelectMore = selectedSeatIds.length < passengerCount

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-md border border-primary bg-primary" />
          Selected
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-md border border-border bg-background" />
          Available
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-md border border-border bg-muted" />
          Booked
        </div>
      </div>

      {/* Seat Grid */}
      <div className="space-y-3">
        {cabinClass.rows.map((row) => (
          <div
            key={row.row_number}
            className="flex items-center justify-center gap-2"
          >
            {/* Row Number */}
            <div className="w-8 text-right text-xs font-medium text-muted-foreground">
              {row.row_number}
            </div>

            {/* Seats */}
            <div className="flex gap-1.5">
              {row.seats.map((seat, idx) => {
                const selected = isSelected(seat.id)
                const isBooked = seat.status === "booked"
                const isAisle = idx === 2 || idx === 3 // Aisle gap after C/D

                return (
                  <div
                    key={seat.id}
                    className={cn("flex items-center", isAisle && "ml-4")}
                  >
                    <button
                      type="button"
                      disabled={isBooked || (!selected && !canSelectMore)}
                      onClick={() => !isBooked && onSeatToggle(seat.id)}
                      className={cn(
                        "h-10 w-10 rounded-md text-xs font-medium transition-all",
                        isBooked
                          ? "cursor-not-allowed border border-border bg-muted text-muted-foreground"
                          : selected
                            ? "border border-primary bg-primary text-primary-foreground shadow-sm"
                            : canSelectMore
                              ? "border border-border bg-background hover:border-primary hover:text-primary"
                              : "cursor-not-allowed border border-border bg-background text-muted-foreground"
                      )}
                    >
                      {seat.seat_number}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selection Status */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Selected: </span>
        <span className="font-medium">{selectedSeatIds.length}</span>
        <span className="text-muted-foreground"> / {passengerCount} seats</span>
      </div>
    </div>
  )
}

export default StepThree
