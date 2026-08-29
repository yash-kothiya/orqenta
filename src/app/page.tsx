import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FlipWords } from "@/components/flip-words";
import { Button } from "@/components/ui/button";
import { ShaderBackground } from "@/components/ui/shader-background";
import pageMeta from "@/lib/page-meta.json";

export const metadata = pageMeta.landing;

export default function LandingPage() {
  return (
    <section className="relative flex min-h-svh flex-1 flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <ShaderBackground />
      </div>

      {/* Scrim: keeps the copy legible wherever a wave crest lands behind it. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-b from-background/50 via-background/20 to-background/70"
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-6 py-24 text-center">
        {/* perspective on the h1 so the flip reads as depth, not a squash. */}
        <h1
          className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl"
          style={{ perspective: "800px" }}
        >
          Invoicing without the{" "}
          <FlipWords words={["busywork", "guesswork", "paperwork"]} />
        </h1>

        <p className="max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
          Draft, send and track invoices from one place. Customers, products,
          tax rules and payment status - all in a single workspace your team
          actually wants to open.
        </p>

        <Button size="lg" render={<Link href="/login" />}>
          Sign in
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  );
}
