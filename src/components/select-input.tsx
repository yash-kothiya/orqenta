"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string };

/** One wrapper so every select in the app is the shadcn Select, not a <select>. */
export function SelectInput({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  ariaLabel,
  className,
  invalid,
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  invalid?: boolean;
}) {
  return (
    <Select
      // Base UI needs `items` to render the label (not the raw code) in the trigger.
      items={options}
      value={value || null}
      onValueChange={(next) => onValueChange((next as string | null) ?? "")}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        className={cn("w-full", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      {/*
        SelectContent defaults to w-(--anchor-width), which clips labels longer
        than a narrow trigger (the item-row selects). Size to content instead,
        never narrower than the trigger and never wider than the viewport.
      */}
      <SelectContent className="w-auto max-w-(--available-width) min-w-(--anchor-width)">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
