"use client";

import Color from "color";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ColorPickerEyeDropper,
  ColorPickerHue,
  ColorPicker as ColorPickerRoot,
  ColorPickerSelection,
} from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const HEX_RE = /^#[0-9a-f]{6}$/i;

const PRESETS = [
  "#059669",
  "#0d9488",
  "#0ea5e9",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#65a30d",
  "#475569",
  "#0f172a",
];

/** The shadcn.io picker in a popover, with the hex field kept alongside it. */
export function ColorPicker({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  // The picker owns its own HSL state, so it is only re-seeded when it opens —
  // re-keying it mid-drag would throw the drag away.
  const [seed, setSeed] = useState(value);

  const latest = useRef(onChange);
  latest.current = onChange;
  // Must be stable: the picker's notify effect lists onChange as a dependency.
  const handleChange = useCallback((rgba: Parameters<typeof Color.rgb>[0]) => {
    latest.current(Color.rgb(rgba).hex().toLowerCase());
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) setSeed(HEX_RE.test(value) ? value : "#000000");
          setOpen(next);
        }}
      >
        <PopoverTrigger
          render={
            <Button variant="outline" size="icon" aria-label="Pick a color" />
          }
        >
          <span
            className="size-4 rounded-full border"
            style={{
              backgroundColor: HEX_RE.test(value) ? value : "transparent",
            }}
          />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64">
          <ColorPickerRoot
            key={seed}
            defaultValue={seed}
            onChange={handleChange}
            className="gap-3"
          >
            <ColorPickerSelection className="h-36 rounded-2xl" />
            <div className="flex items-center gap-2">
              <ColorPickerEyeDropper />
              <ColorPickerHue />
            </div>
          </ColorPickerRoot>
          {/* Re-seeding remounts the picker on the preset, which reports it back. */}
          <div className="mt-3 grid grid-cols-6 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-label={preset}
                onClick={() => {
                  setSeed(preset);
                  onChange(preset);
                }}
                style={{ backgroundColor: preset }}
                className={cn(
                  "size-6 rounded-full border transition-transform hover:scale-110",
                  value.toLowerCase() === preset &&
                    "ring-2 ring-ring ring-offset-2 ring-offset-popover",
                )}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
