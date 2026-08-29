"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type FlipWordsProps = Omit<React.ComponentProps<"span">, "children"> & {
  words: string[];
  /** How long each word holds before the next one takes over, in ms. */
  duration?: number;
  /** Stagger between adjacent letters, in seconds. */
  letterDelay?: number;
};

export function FlipWords({
  words,
  duration = 3000,
  letterDelay = 0.05,
  className,
  ...props
}: FlipWordsProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Honour the OS setting: hold on the first word instead of cycling.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => setStep((s) => s + 1), duration);
    return () => clearInterval(id);
  }, [duration]);

  const current = words[step % words.length];
  const previous = words[(step - 1 + words.length) % words.length];
  // The longest word holds the box open so the headline never reflows mid-swap.
  const widest = words.reduce((a, b) => (b.length > a.length ? b : a));

  return (
    <span
      data-slot="flip-words"
      className={cn("relative inline-grid text-left align-bottom", className)}
      {...props}
    >
      {/* Spacer: sets the width, never painted. */}
      <span className="invisible col-start-1 row-start-1" aria-hidden>
        {widest}
      </span>

      {/* Keyed so both spans remount on each step and their animations restart. */}
      {step > 0 && (
        <span
          key={`out-${step}`}
          aria-hidden
          className="flip-word-out col-start-1 row-start-1 whitespace-nowrap"
        >
          {previous}
        </span>
      )}

      <span
        key={`in-${step}`}
        aria-hidden
        className="col-start-1 row-start-1 whitespace-nowrap"
      >
        {[...current].map((letter, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: letters are positional
            key={i}
            className="inline-block flip-letter-in"
            style={{ animationDelay: `${i * letterDelay}s` }}
          >
            {letter === " " ? " " : letter}
          </span>
        ))}
      </span>

      {/* Screen readers get one stable word, not an update every few seconds. */}
      <span className="sr-only">{words[0]}</span>
    </span>
  );
}

export type { FlipWordsProps };
