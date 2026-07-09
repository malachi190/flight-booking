"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format, parseISO } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Plane,
  Users,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  CreditCard,
  Loader2,
  Armchair,
} from "lucide-react"
import Link from "next/link"
import StepOne from "@/components/booking/multistep/page-one"
import StepTwo from "@/components/booking/multistep/page-two"
import StepThree from "@/components/booking/multistep/page-three"
import StepFour from "@/components/booking/multistep/page-four"

// ─── Types ─────────────────────────────────────────────────────────

export interface CabinClass {
  id: string
  class_type: string
  price: number
  available_seats: number
  total_seats: number
}

export interface Flight {
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

// ─── Schemas ───────────────────────────────────────────────────────

const passengerSchema = z.object({
  first_name: z.string().min(1, "First name required"),
  last_name: z.string().min(1, "Last name required"),
  email: z.email("Invalid email"),
  phone: z.string().min(1, "Phone required"),
  date_of_birth: z.string().min(1, "Date of birth required"),
  passport_number: z.string().min(1, "Passport number required"),
})

const bookingSchema = z.object({
  flight_id: z.uuid(),
  cabin_class_id: z.uuid(),
  flight_type: z.enum(["outbound", "return"]),
  passengers: z.array(passengerSchema).min(1, "At least one passenger"),
  seat_ids: z.array(z.uuid()).optional(),
})

type BookingForm = z.infer<typeof bookingSchema>

const STEPS = ["Flight", "Passengers", "Seats", "Review"]

// ─── Component ────────────────────────────────────────────────────

export default function NewBookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])

  const flightId = searchParams.get("flightId") || ""
  const cabinClassId = searchParams.get("cabinClassId") || ""
  const adultsParam = searchParams.get("adults") || "1"

  // ── Fetch flight data ──────────────────────────────────────────
  const {
    data: flight,
    isLoading: flightLoading,
    error: flightError,
  } = useQuery<Flight>({
    queryKey: ["flight", flightId],
    queryFn: async () => {
      const res = await api.get(`/flights/${flightId}`)
      return res.data.data || res.data
    },
    enabled: !!flightId,
    retry: 1,
  })

  const selectedCabin = flight?.cabin_classes.find((c) => c.id === cabinClassId)

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      flight_id: flightId,
      cabin_class_id: cabinClassId,
      flight_type: "outbound",
      passengers: Array.from({ length: parseInt(adultsParam) }, () => ({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        date_of_birth: "",
        passport_number: "",
      })),
      seat_ids: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "passengers",
  })

  const passengers = watch("passengers")
  const flightType = watch("flight_type")

  const totalAmount = selectedCabin
    ? selectedCabin.price * passengers.length
    : 0

  const onSubmit = async (data: BookingForm) => {
    setIsSubmitting(true)
    try {
      const payload = {
        ...data,
        seat_ids: data.seat_ids?.length ? data.seat_ids : undefined,
      }

      const res = await api.post("/bookings", payload)
      const booking = res.data.data

      toast.success(
        `Booking confirmed! Reference: ${booking.booking_reference}`
      )
      router.push(`/dashboard/bookings/${booking.id}`)
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Booking failed"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!selectedCabin
      case 1:
        return passengers.every(
          (p) =>
            p.first_name &&
            p.last_name &&
            p.email &&
            p.phone &&
            p.date_of_birth &&
            p.passport_number
        )
      case 2:
        return true
      case 3:
        return true
      default:
        return false
    }
  }

  // Pass to parent form when proceeding:
  useEffect(() => {
    setValue("seat_ids", selectedSeatIds)
  }, [selectedSeatIds, setValue])

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1)
  }

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  // ── Loading / Error States ─────────────────────────────────────
  if (flightLoading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (flightError || !flight) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-20 text-center">
        <p className="text-muted-foreground">Flight not found</p>
        <Button asChild variant="outline">
          <Link href="/search">Back to Search</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Booking</h1>
        <p className="text-muted-foreground">
          Book your flight in a few simple steps
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                  idx < currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : idx === currentStep
                      ? "border-primary text-primary"
                      : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {idx < currentStep ? <Check className="h-5 w-5" /> : idx + 1}
              </div>
              <span
                className={`text-xs font-medium ${
                  idx === currentStep
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`mx-4 h-0.5 flex-1 ${
                  idx < currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ─── STEP 0: FLIGHT SELECTION ───────────────────────────── */}
        {currentStep === 0 && (
          <StepOne flight={flight} selectedCabin={selectedCabin} />
        )}

        {/* ─── STEP 1: PASSENGER DETAILS ──────────────────────────── */}
        {currentStep === 1 && (
          <StepTwo
            fields={fields}
            append={append}
            register={register}
            remove={remove}
            errors={errors}
          />
        )}

        {/* ─── STEP 2: SEAT SELECTION (PLACEHOLDER) ───────────────── */}
        {currentStep === 2 && (
          <StepThree
            flightId={flight.id}
            cabinClassId={selectedCabin?.id || ""}
            passengerCount={passengers.length}
            selectedSeatIds={selectedSeatIds}
            onSeatToggle={(seatId) => {
              setSelectedSeatIds((prev) =>
                prev.includes(seatId)
                  ? prev.filter((id) => id !== seatId)
                  : prev.length < passengers.length
                    ? [...prev, seatId]
                    : prev
              )
            }}
          />
        )}

        {/* ─── STEP 3: REVIEW & CONFIRM ───────────────────────────── */}
        {currentStep === 3 && (
          <StepFour
            flight={flight}
            flightType={flightType}
            passengers={passengers}
            selectedCabin={selectedCabin}
            totalAmount={totalAmount}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="rounded-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className="rounded-full"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  )
}
