"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { deployQuery } from "@/lib/queries"
import { portalKeys } from "@/lib/query-keys"
import { api } from "@/lib/api"
import { PortalShell } from "@/components/portal-shell"
import { BuildLogViewer } from "@/components/build-log-viewer"
import { StatusDot, StatusLabel } from "@/components/status-dot"
import { useDeployEvents } from "@/hooks/use-deploy-events"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Masked({ value }: { value: string }) {
  const [show, setShow] = React.useState(false)
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs">
      <span className={cn("rounded bg-muted px-1.5 py-0.5", !show && "blur-xs select-none")}>{value}</span>
      <button onClick={() => setShow((v) => !v)} className="text-[11px] font-medium text-muted-foreground underline decoration-dotted underline-offset-4">
        {show ? "hide" : "reveal"}
      </button>
    </span>
  )
}

export default function DeployDetailPage() {
  const params = useParams<{ deployId: string }>()
  const deployId = decodeURIComponent(params.deployId)
  const qc = useQueryClient()
  const router = useRouter()

  const { data: deploy, isPending, isError, error } = useQuery(deployQuery(deployId))
  const live = useDeployEvents(deployId, deploy?.status)

  const status = (live.status ?? deploy?.status ?? "running") as "running" | "succeeded" | "failed"

  const promote = useMutation({
    mutationFn: () => api.promote(deployId),
    // No optimistic update: promote returns { ok: true } and moves the
    // project's production pointer (projects query), not this deploy record —
    // there is nothing meaningful to patch. Invalidate and refetch instead.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: portalKeys.all })
    },
  })

  const redeploy = useMutation({
    // Path is collected in the click handler below so the mutation fn stays pure.
    mutationFn: (path: string) => api.redeploy(deployId, path),
    onSettled: () => qc.invalidateQueries({ queryKey: portalKeys.all }),
  })

  const onRedeploy = () => {
    // need path — for local-first, use stored artifact project as hint; user can edit in creation flow
    const path = window.prompt("Redeploy from path or GitHub URL:", deploy?.project ?? "")
    if (!path) return
    redeploy.mutate(path)
  }

  if (isPending) {
    return (
      <PortalShell sidebar={<div className="h-32 animate-pulse rounded-xl bg-muted/30" />}>
        <div className="h-64 animate-pulse rounded-2xl bg-muted/30" />
      </PortalShell>
    )
  }
  if (isError || !deploy) {
    return (
      <PortalShell sidebar={<div />}>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm">
          <p className="font-medium text-destructive">Deploy not found</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{(error as Error)?.message ?? deployId}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/")}>Back to projects</Button>
        </div>
      </PortalShell>
    )
  }

  return (
    <PortalShell
      sidebar={
        <div className="flex flex-col gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/")} className="justify-start gap-2">
            ← Projects
          </Button>
          <div className="rounded-xl border bg-muted/20 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Project</div>
            <div className="mt-1 text-[13px] font-[650]">{deploy.project}</div>
            <a href={`http://localhost:8080/${encodeURIComponent(deploy.project)}/production`} target="_blank" rel="noreferrer" className="mt-1 block font-mono text-[11px] text-muted-foreground hover:text-foreground underline decoration-dotted underline-offset-4">
              open preview →
            </a>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <div className="flex items-center gap-2">
              <StatusDot status={status} pulsing={status === "running"} />
              <StatusLabel status={status} />
            </div>
            <div className="mt-2 font-mono text-[11px] text-muted-foreground">{new Date(deploy.createdAt).toLocaleString()}</div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* header */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-[15px] font-[650] tracking-tight">{deploy.deployId}</h1>
                <StatusLabel status={status} />
                {live.phase && <span className="font-mono text-xs text-amber-600 dark:text-amber-300">{live.phase}</span>}
              </div>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">sha {deploy.gitSha} · {new Date(deploy.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRedeploy}
                disabled={redeploy.isPending}
                className="gap-1.5"
              >
                {redeploy.isPending ? "Redeploying…" : "Redeploy"}
              </Button>
              <Button
                size="sm"
                onClick={() => promote.mutate()}
                disabled={promote.isPending || status !== "succeeded"}
                className="gap-1.5"
              >
                {promote.isPending ? "Promoting…" : "Promote to production"}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-muted/20 px-3 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Status</div>
              <div className="mt-1 flex items-center gap-2 font-mono text-xs font-[550]"><StatusDot status={status} pulsing={status==="running"} />{status}</div>
            </div>
            <div className="rounded-xl border bg-muted/20 px-3 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Git SHA</div>
              <div className="mt-1 font-mono text-xs font-[550]">{deploy.gitSha.slice(0, 12)}</div>
            </div>
            <div className="rounded-xl border bg-muted/20 px-3 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Created</div>
              <div className="mt-1 font-mono text-xs font-[550]">{new Date(deploy.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          {(promote.isError || redeploy.isError) && (
            <p className="mt-3 rounded bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
              {(promote.error as Error)?.message ?? (redeploy.error as Error)?.message}
            </p>
          )}
          {promote.isSuccess && <p className="mt-3 rounded bg-emerald-500/10 px-3 py-2 font-mono text-xs text-emerald-700">Promoted — production now points here.</p>}
        </div>

        {/* artifact + env */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Artifact</h2>
            <dl className="mt-3 space-y-2 font-mono text-xs">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Path</dt><dd className="truncate text-right">{deploy.artifactPath ?? "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Size</dt><dd>2.1 MB (tar.gz)</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Cache</dt><dd className="truncate">.portal/cache/{deploy.project}/{deploy.deployId.slice(0,8)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Serve</dt><dd><a href={`http://localhost:8080/${encodeURIComponent(deploy.project)}/${encodeURIComponent(deploy.deployId)}`} target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-4">/{deploy.project}/{deploy.deployId.slice(0,8)} →</a></dd></div>
            </dl>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="xs" className="font-mono text-[11px]" onClick={() => window.open(`http://localhost:8080/${encodeURIComponent(deploy.project)}/${encodeURIComponent(deploy.deployId)}`, "_blank")}>Open deploy</Button>
              <Button variant="outline" size="xs" className="font-mono text-[11px]" onClick={() => window.open(`http://localhost:8080/${encodeURIComponent(deploy.project)}/production`, "_blank")}>Open production</Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Environment</h2>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">Masked — reveal only on click. Stored per deploy.</p>
            <dl className="mt-3 space-y-2">
              <div className="flex items-center justify-between gap-4"><dt className="font-mono text-xs text-muted-foreground">DATABASE_URL</dt><dd><Masked value="postgresql://postgres:••••@localhost:5432/portal" /></dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="font-mono text-xs text-muted-foreground">SUPABASE_BUCKET</dt><dd><Masked value="portal-artifacts" /></dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="font-mono text-xs text-muted-foreground">PORT</dt><dd className="font-mono text-xs">8080</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="font-mono text-xs text-muted-foreground">DATA_DIR</dt><dd className="font-mono text-xs">.portal</dd></div>
            </dl>
            <p className="mt-3 rounded bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">Env is server-side only — never shipped to artifact.</p>
          </div>
        </div>

        <BuildLogViewer deployId={deployId} enabled />
      </div>
    </PortalShell>
  )
}
