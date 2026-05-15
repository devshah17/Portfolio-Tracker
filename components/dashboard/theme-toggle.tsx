"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  if (!mounted) {
    return (
      <div
        className={cn("h-9 w-[4.25rem] rounded-full bg-muted/80", className)}
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "group relative flex h-9 w-[4.25rem] shrink-0 items-center rounded-full p-1 transition-all duration-300",
        "border border-border/80 bg-muted/60 shadow-inner",
        "dark:border-[oklch(0.45_0.09_285/35%)] dark:bg-[oklch(0.18_0.04_288)]",
        "hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/10",
        "dark:hover:border-[oklch(0.55_0.14_285/45%)] dark:hover:shadow-[0_4px_20px_-4px_oklch(0.45_0.18_285/35%)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <span
        className={cn(
          "absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          isDark
            ? "bg-gradient-to-r from-[oklch(0.45_0.18_285/20%)] to-[oklch(0.4_0.15_270/15%)]"
            : "bg-gradient-to-r from-amber-200/40 to-violet-200/40"
        )}
      />
      <Sun
        className={cn(
          "relative z-10 ml-0.5 h-4 w-4 transition-all duration-300",
          isDark ? "scale-75 text-muted-foreground/50" : "scale-100 text-amber-500"
        )}
      />
      <Moon
        className={cn(
          "relative z-10 mr-0.5 h-4 w-4 transition-all duration-300",
          isDark ? "scale-100 text-[oklch(0.78_0.14_285)]" : "scale-75 text-muted-foreground/50"
        )}
      />
      <span
        className={cn(
          "absolute top-1 left-1 z-20 h-7 w-7 rounded-full shadow-md transition-all duration-300 ease-out",
          "bg-background ring-1 ring-border/60",
          isDark ? "translate-x-[calc(100%-2px)]" : "translate-x-0"
        )}
      />
    </button>
  );
}
