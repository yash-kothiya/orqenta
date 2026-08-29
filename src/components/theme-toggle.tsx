"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  function toggle() {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
    window.setTimeout(() => root.classList.remove("theme-transition"), 500);
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  );
}
