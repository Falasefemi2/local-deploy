"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { projectsQuery } from "@/lib/queries"
import { PortalShell } from "@/components/portal-shell"
import { ProjectList } from "@/components/project-list"
import { DeployHistory } from "@/components/deploy-history"
import { Button } from "@/components/ui/button"

export default function Page() {
  const { data: projects, isPending, isError, error } = useQuery(projectsQuery)
  const [selected, setSelected] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    if (projects?.length && !selected) setSelected(projects[0]!.name)
  }, [projects, selected])

  const active = projects?.find((p) => p.name === selected)

  return (
    <PortalShell
      sidebar={
        isPending ? (
          <div className="flex flex-col gap-2 p-1">
            <div className="h-4 w-24 rounded bg-muted" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[86px] animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">Failed to load projects</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{(error as Error).message}</p>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">Check that portal serve is on :8080</p>
          </div>
        ) : !projects?.length ? (
          <div className="px-3 py-8 text-center">
            <p className="text-sm font-[650]">No projects yet</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Run portal deploy or create one from the UI.</p>
            <Button className="mt-4" size="sm" onClick={() => (window.location.href = "/new")}>
              New project
            </Button>
          </div>
        ) : (
          <ProjectList projects={projects} selected={selected} onSelect={setSelected} />
        )
      }
    >
      {!selected ? (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
          <p className="text-sm font-[650]">Select a project</p>
          <p className="mt-1 text-sm text-muted-foreground">Choose a project on the left to inspect its deploys.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* header — ledger header, not card title */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[18px] font-[700] tracking-tight">{selected}</h1>
                  {active?.productionDeployId && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      production
                    </span>
                  )}
                </div>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {active?.deployCount ?? 0} deploys · last {active?.lastDeploy?.gitSha.slice(0, 7) ?? "—"} ·{" "}
                  <a
                    href={`http://localhost:8080/${encodeURIComponent(selected)}/production`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-dotted underline-offset-4 hover:text-foreground"
                  >
                    /{selected}/production →
                  </a>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="font-mono text-xs">
                  Open preview
                </Button>
                <Button size="sm">Redeploy</Button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { k: "Production", v: active?.productionDeployId?.slice(0, 10) ?? "—" },
                { k: "Last status", v: active?.lastDeploy?.status ?? "—" },
                { k: "Last deploy", v: active?.lastDeploy ? new Date(active.lastDeploy.createdAt).toLocaleDateString() : "—" },
              ].map((s) => (
                <div key={s.k} className="rounded-xl border bg-muted/20 px-3 py-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{s.k}</div>
                  <div className="mt-1 font-mono text-[12px] font-[550] tracking-tight">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <DeployHistory project={selected} productionDeployId={active?.productionDeployId} />

          {/* inline note for step 1 scope */}
          <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            Live status is <span className="font-semibold text-foreground">SSE-driven</span> via{" "}
            <span className="text-foreground">/api/deploys/:id/events</span> — no polling. Build log stream (auto-scroll + jump-to-bottom)
            lands in Step 2.
          </div>
        </div>
      )}
    </PortalShell>
  )
}
