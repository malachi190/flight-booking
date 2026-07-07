import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plane } from "lucide-react"
import Image from "next/image"
import heroImage from "@/public/hero_plane.jpg"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero — forced dark, independent of global theme */}
      <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col bg-[#212529] text-[#f8f9fa]">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage}
            alt="Airplane illustration"
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#212529]/60 via-transparent to-[#212529]/90" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center sm:px-8 lg:px-12">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="absolute top-20 right-20 hidden animate-pulse opacity-10 lg:block">
              <Plane className="h-32 w-32 rotate-45" strokeWidth={0.5} />
            </div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#495057] bg-[#343a40]/60 px-4 py-1.5 text-sm text-[#adb5bd] backdrop-blur-sm">
              <Plane className="h-4 w-4" />
              <span>50+ routes worldwide</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl leading-[0.9] font-bold tracking-tight text-[#f8f9fa] sm:text-6xl md:text-7xl lg:text-8xl">
              Wherever
              <br />
              <span className="text-[#adb5bd]">You Roam</span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-[#adb5bd] sm:text-xl">
              Book flights with confidence. Real-time availability, secure
              payments, and a seamless experience from search to seat.
            </p>

            {/* CTA */}
            <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
              <Button
                size="lg"
                className="min-w-[200px] gap-2 rounded-full bg-[#f8f9fa] text-base text-[#212529] hover:bg-[#e9ecef]"
                asChild
              >
                <Link href="/search">
                  Find Flights
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="min-w-[200px] rounded-full border-[#495057] text-base text-[#f8f9fa] hover:bg-[#343a40] hover:text-[#f8f9fa]"
                asChild
              >
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Strip — dark, spread evenly */}
        <div className="relative z-10 border-t border-[#343a40] bg-[#212529]/90 backdrop-blur-sm">
          <div className="px-6 py-10 sm:px-8 lg:px-12">
            <div className="mx-auto flex w-full max-w-5xl flex-row items-center justify-between">
              <div className="text-left">
                <div className="text-3xl font-bold text-[#f8f9fa] sm:text-4xl">
                  50+
                </div>
                <div className="mt-1 text-sm text-[#adb5bd]">Daily Flights</div>
              </div>
              <div className="text-left">
                <div className="text-3xl font-bold text-[#f8f9fa] sm:text-4xl">
                  10
                </div>
                <div className="mt-1 text-sm text-[#adb5bd]">Global Routes</div>
              </div>
              <div className="text-left">
                <div className="text-3xl font-bold text-[#f8f9fa] sm:text-4xl">
                  2
                </div>
                <div className="mt-1 text-sm text-[#adb5bd]">Cabin Classes</div>
              </div>
              <div className="text-left">
                <div className="text-3xl font-bold text-[#f8f9fa] sm:text-4xl">
                  0s
                </div>
                <div className="mt-1 text-sm text-[#adb5bd]">Booking Delay</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
