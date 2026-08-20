"use client"

import { cn } from "@/lib/utils"
import { StatusDot } from "./status-dot"
import type { ProjectSummary } from "@/lib/api"

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - +new Date(iso)) / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function ProjectList({
  projects,
  selected,
  onSelect,
}: {
  projects: ProjectSummary[]
  selected: string | undefined
  onSelect: (name: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Projects
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">{projects.length}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {projects.map((p, i) => {
          const active = p.name === selected
          const st = p.lastDeploy?.status ?? "succeeded"
          return (
            <button
              key={p.name}
              onClick={() => onSelect(p.name)}
              style={{ animationDelay: `${i * 45}ms` }}
              className={cn(
                "group flex w-full animate-[portalIn_360ms_cubic-bezier(0.23,1,0.32,1)_both] flex-col gap-2 rounded-xl border px-3.5 py-3 text-left transition-[border-color,background-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "hover:bg-muted/60 active:scale-[0.98]",
                active
                  ? "border-foreground/15 bg-card shadow-sm"
                  : "border-transparent bg-transparent hover:border-border/60"
              )}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className="min-w-0 truncate text-[13.5px] font-[550] leading-none tracking-tight">
                  {p.name}
                </span>
                <StatusDot status={st as never} pulsing={st === "running"} />
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px] leading-none text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-foreground/20" />
                  {p.deployCount} deploys
                </span>
                {p.lastDeploy && (
                  <>
                    <span className="opacity-30">·</span>
                    <span>{timeAgo(p.lastDeploy.createdAt)}</span>
                  </>
                )}
              </div>

              {p.lastDeploy && (
                <div className="flex items-center gap-1.5 truncate font-mono text-[11px] text-muted-foreground">
                  <span className="truncate">
                    {p.lastDeploy.gitSha.slice(0, 7)}
                  </span>
                  <span className="opacity-30">—</span>
                  <span
                    className={cn(
                      "truncate",
                      active ? "text-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {p.lastDeploy.deployId}
                  </span>
                  {p.productionDeployId === p.lastDeploy.deployId && (
                    <span className="ml-auto inline-flex shrink-0 items-center rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-semibold leading-none tracking-wide text-background">
                      production
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <style>{`@keyframes portalIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
