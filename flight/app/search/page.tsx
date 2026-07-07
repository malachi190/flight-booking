"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Plane, Users, ArrowRightLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const AIRPORTS = [
  {
    code: "JFK",
    name: "John F. Kennedy International Airport",
    city: "New York",
  },
  {
    code: "LAX",
    name: "Los Angeles International Airport",
    city: "Los Angeles",
  },
  { code: "LHR", name: "London Heathrow Airport", city: "London" },
  { code: "CDG", name: "Paris Charles de Gaulle Airport", city: "Paris" },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai" },
  { code: "SIN", name: "Singapore Changi Airport", city: "Singapore" },
  { code: "HND", name: "Tokyo Haneda Airport", city: "Tokyo" },
  { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt" },
]

const searchSchema = z
  .object({
    origin: z.string().length(3, "Select an airport"),
    destination: z.string().length(3, "Select an airport"),
    date: z.date({ message: "Departure date is required" }),
    adults: z
      .string()
      .min(1)
      .max(2)
      .refine((v) => parseInt(v) >= 1 && parseInt(v) <= 9, {
        message: "1-9 passengers",
      }),
    class: z.enum(["economy", "business"]),
  })
  .refine((data) => data.origin !== data.destination, {
    message: "Origin and destination cannot be the same",
    path: ["destination"],
  })

type SearchForm = z.infer<typeof searchSchema>

export default function SearchPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      adults: "1",
      class: "economy",
    },
  })

  const date = watch("date")
  const origin = watch("origin")
  const destination = watch("destination")

  const onSubmit = async (data: SearchForm) => {
    setIsLoading(true)

    const params = new URLSearchParams({
      origin: data.origin,
      destination: data.destination,
      date: format(data.date, "yyyy-MM-dd"),
      adults: data.adults,
      class: data.class,
    })

    router.push(`/search/results?${params.toString()}`)
  }

  const swapLocations = () => {
    setValue("origin", destination || "")
    setValue("destination", origin || "")
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="mb-2 inline-flex items-center justify-center rounded-full bg-primary p-3">
            <Plane className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Find Your Next Flight
          </h1>
          <p className="text-muted-foreground">
            Search across 10 global routes with real-time availability
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          {/* Route Inputs */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
            {/* Origin */}
            <div className="space-y-2">
              <Label htmlFor="origin">From</Label>
              <Controller
                name="origin"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="origin" className="w-full">
                      <SelectValue placeholder="Select airport" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {AIRPORTS.map((airport) => (
                        <SelectItem key={airport.code} value={airport.code}>
                          {airport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Input
                value={origin || ""}
                readOnly
                placeholder="—"
                className="bg-muted text-center font-semibold tracking-widest uppercase"
              />
              {errors.origin && (
                <p className="text-xs text-destructive">
                  {errors.origin.message}
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mb-1 rounded-full"
              onClick={swapLocations}
              disabled={!origin && !destination}
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>

            {/* Destination */}
            <div className="space-y-2">
              <Label htmlFor="destination">To</Label>
              <Controller
                name="destination"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="destination" className="w-full">
                      <SelectValue placeholder="Select airport" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {AIRPORTS.map((airport) => (
                        <SelectItem key={airport.code} value={airport.code}>
                          {airport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Input
                value={destination || ""}
                readOnly
                placeholder="—"
                className="bg-muted text-center font-semibold tracking-widest uppercase"
              />
              {errors.destination && (
                <p className="text-xs text-destructive">
                  {errors.destination.message}
                </p>
              )}
            </div>
          </div>

          {/* Date & Passengers & Class */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Departure</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMM dd, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => setValue("date", d as Date)}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    // initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-xs text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>

            {/* Passengers */}
            <div className="space-y-2">
              <Label htmlFor="adults">Passengers</Label>
              <div className="relative">
                <Users className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="adults"
                  type="number"
                  min={1}
                  max={9}
                  className="pl-9"
                  {...register("adults")}
                />
              </div>
              {errors.adults && (
                <p className="text-xs text-destructive">
                  {errors.adults.message}
                </p>
              )}
            </div>

            {/* Cabin Class */}
            <div className="space-y-2">
              <Label htmlFor="class">Cabin</Label>
              <Select
                defaultValue="economy"
                onValueChange={(v) =>
                  setValue("class", v as "economy" | "business")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full rounded-full text-base"
            disabled={isLoading}
          >
            {isLoading ? "Searching..." : "Search Flights"}
          </Button>
        </form>

        {/* Quick Routes */}
        <div className="space-y-3">
          <p className="text-center text-sm font-medium text-muted-foreground">
            Popular Routes
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              ["JFK", "LAX"],
              ["LHR", "CDG"],
              ["DXB", "SIN"],
              ["HND", "SIN"],
              ["FRA", "JFK"],
            ].map(([from, to]) => (
              <button
                key={`${from}-${to}`}
                type="button"
                onClick={() => {
                  setValue("origin", from)
                  setValue("destination", to)
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {from}
                <ArrowRightLeft className="h-3 w-3" />
                {to}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
