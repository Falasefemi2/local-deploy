"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { deploysQuery } from "@/lib/queries"
import type { DeployRecord } from "@/lib/api"
import { cn } from "@/lib/utils"
import { StatusDot, StatusLabel } from "./status-dot"
import { useDeployEvents } from "@/hooks/use-deploy-events"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function age(iso: string) {
  const mins = Math.floor((Date.now() - +new Date(iso)) / 60000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function DeployRow({
  deploy,
  index,
  isProduction,
}: {
  deploy: DeployRecord
  index: number
  isProduction: boolean
}) {
  const live = useDeployEvents(deploy.deployId, deploy.status)
  const status = (live.status ?? deploy.status) as DeployRecord["status"]
  const isRunning = status === "running"

  return (
    <div
      style={{ animationDelay: `${index * 38}ms` }}
      className={cn(
        "group relative flex animate-[rowIn_360ms_cubic-bezier(0.23,1,0.32,1)_both] items-center gap-3 rounded-xl border bg-card px-3 py-3 transition-[border-color,background-color,transform] duration-200",
        "hover:border-foreground/10 hover:bg-muted/40 active:scale-[0.99]",
        isRunning && "border-amber-500/20 bg-amber-500/[0.04]"
      )}
    >
      {/* timeline line */}
      <div className="pointer-events-none absolute left-[17px] top-0 h-3 w-px bg-border/60 group-first:hidden" />
      <div className="pointer-events-none absolute bottom-0 left-[17px] h-3 w-px bg-border/60 group-last:hidden" />

      <div className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-background">
        <StatusDot status={status} pulsing={isRunning} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[12.5px] font-[550] tracking-tight">{deploy.deployId}</span>
          <StatusLabel status={status} />
          {isProduction && (
            <Badge variant="outline" className="border-foreground/15 bg-foreground px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-background">
              production
            </Badge>
          )}
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">{age(deploy.createdAt)} ago</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-foreground/30" />
            {deploy.gitSha.slice(0, 7)}
          </span>
          <span className="opacity-30">·</span>
          <span className="truncate">{new Date(deploy.createdAt).toLocaleString()}</span>
          {isRunning && live.phase && (
            <>
              <span className="opacity-30">·</span>
              <span className="truncate text-amber-700 dark:text-amber-300">{live.phase}</span>
            </>
          )}
        </div>

        {isRunning && (
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-amber-500/15">
            <div className="h-full w-1/2 animate-[shimmer_1.1s_ease_infinite] rounded-full bg-amber-500/60" />
          </div>
        )}
      </div>

      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        <Button variant="ghost" size="xs" className="font-mono text-[11px]" onClick={() => (window.location.href = `/deploys/${encodeURIComponent(deploy.deployId)}`)}>
          Logs
        </Button>
        <Button variant="outline" size="xs" className="font-mono text-[11px]" onClick={() => (window.location.href = `/deploys/${encodeURIComponent(deploy.deployId)}`)}>
          View
        </Button>
      </div>

      <style>{`@keyframes rowIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(220%)}}`}</style>
    </div>
  )
}

export function DeployHistory({
  project,
  productionDeployId,
  onEmptyCreate,
}: {
  project: string
  productionDeployId?: string
  onEmptyCreate?: () => void
}) {
  const { data, isPending, isError, error } = useQuery(deploysQuery(project))

  if (isPending) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-[76px] rounded-xl border bg-muted/30"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5 px-4 py-6">
        <AlertTitle>Failed to load deploys</AlertTitle>
        <AlertDescription className="font-mono text-xs">{(error as Error).message}</AlertDescription>
      </Alert>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card px-6 py-10 text-center">
        <p className="text-sm font-[550]">No deploys yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
          This project hasn’t been deployed. Connect a source and trigger the first build.
        </p>
        {onEmptyCreate && (
          <Button onClick={onEmptyCreate} size="sm" className="mt-4">
            Create deploy
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Deployments
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">{data.length} total</span>
      </div>
      {data.map((d, i) => (
        <DeployRow key={d.deployId} deploy={d} index={i} isProduction={d.deployId === productionDeployId} />
      ))}
    </div>
  )
}
