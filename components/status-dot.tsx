"use client"

import { cn } from "@/lib/utils"

type Status = "running" | "succeeded" | "failed"

export function StatusDot({ status, pulsing }: { status: Status; pulsing?: boolean }) {
  return (
    <span className="relative inline-flex size-[9px] shrink-0 items-center justify-center">
      <span
        className={cn(
          "absolute size-full rounded-full",
          status === "succeeded" && "bg-emerald-500",
          status === "failed" && "bg-red-500",
          status === "running" && "bg-amber-500",
          pulsing && status === "running" && "animate-ping opacity-40"
        )}
        aria-hidden
      />
      <span
        className={cn(
          "relative size-[9px] rounded-full",
          status === "succeeded" && "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
          status === "failed" && "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.45)]",
          status === "running" && "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
        )}
      />
    </span>
  )
}

export function StatusLabel({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    running: "Building",
    succeeded: "Ready",
    failed: "Failed",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none tracking-wide",
        status === "succeeded" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        status === "failed" && "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
        status === "running" && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      )}
    >
      {map[status]}
    </span>
  )
}
