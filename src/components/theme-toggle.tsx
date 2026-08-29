"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

function useToggleTheme() {
  const { resolvedTheme, setTheme } = useTheme();

  return function toggle() {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
    window.setTimeout(() => root.classList.remove("theme-transition"), 500);
  };
}

export function ThemeToggle() {
  const toggle = useToggleTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={toggle}
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  );
}

/** Same toggle as a row inside the mobile nav dropdown. */
export function ThemeToggleMenuItem() {
  const toggle = useToggleTheme();

  return (
    <DropdownMenuItem closeOnClick={false} onClick={toggle}>
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
      <span className="dark:hidden">Dark mode</span>
      <span className="hidden dark:inline">Light mode</span>
    </DropdownMenuItem>
  );
}
