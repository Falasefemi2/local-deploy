"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { PortalShell } from "@/components/portal-shell"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { BuildLogViewer } from "@/components/build-log-viewer"

type Step = 1 | 2 | 3 | 4

export default function NewProjectPage() {
  const [step, setStep] = React.useState<Step>(1)
  const [source, setSource] = React.useState("") // local path or github url
  const [buildCommand, setBuildCommand] = React.useState("npm run build")
  const [outputDir, setOutputDir] = React.useState("dist")
  const [projectName, setProjectName] = React.useState("")
  const [envVars, setEnvVars] = React.useState("DATABASE_URL=postgresql://postgres:portal@localhost:5432/portal")
  const [deployId, setDeployId] = React.useState<string | undefined>(undefined)
  const router = useRouter()
  const qc = useQueryClient()

  const trigger = useMutation({
    mutationFn: () => api.triggerDeploy(source.trim(), buildCommand.trim() || undefined),
    onSuccess: (rec) => {
      qc.invalidateQueries({ queryKey: ["portal"] })
      const id = (rec as { deployId?: string })?.deployId
      if (id) setDeployId(id)
      setStep(4)
    },
    onError: (err: unknown) => {
      qc.invalidateQueries({ queryKey: ["portal"] })
      const e = err as Error & { deployId?: string }
      if (e.deployId) setDeployId(e.deployId)
      setStep(4)
    },
  })

  const canNext1 = source.trim().length > 3
  const canNext2 = buildCommand.trim().length > 0 && outputDir.trim().length > 0

  return (
    <PortalShell
      sidebar={
        <div className="flex flex-col gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/")} className="justify-start gap-2">← Projects</Button>
          <div className="rounded-xl border bg-muted/20 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">New project</div>
            <div className="mt-2 flex flex-col gap-1">
              {[
                { n: 1, label: "Connect source" },
                { n: 2, label: "Build config" },
                { n: 3, label: "Environment" },
                { n: 4, label: "Deploy" },
              ].map((s) => (
                <div key={s.n} className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs", step === s.n ? "bg-foreground text-background font-[550]" : "text-muted-foreground")}>
                  <span className={cn("flex size-5 items-center justify-center rounded-full border text-[11px] font-mono", step === s.n ? "border-background/20 bg-background text-foreground" : "border-border bg-background")}>{s.n}</span>
                  {s.label}
                </div>
              ))}
            </div>
          </div>
          <p className="px-1 font-mono text-[11px] leading-relaxed text-muted-foreground">Runs <span className="text-foreground">portal deploy</span> via POST /api/deploy — same pipeline as CLI.</p>
        </div>
      }
    >
      <div className="mx-auto max-w-[720px]">
        {step === 1 && (
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h1 className="text-[18px] font-[700] tracking-tight">Connect source</h1>
            <p className="mt-1 text-sm text-muted-foreground">Local path or GitHub URL. CLI uses the same — <span className="font-mono text-xs">portal deploy &lt;path&gt;</span></p>
            <div className="mt-5 flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-[550]">Source path / GitHub URL</span>
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="C:\Users\FEMI\my-app  or  https://github.com/user/repo"
                  className="rounded-xl border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
                />
                <span className="font-mono text-[11px] text-muted-foreground">For GitHub URLs, portal clones with --depth 1 into .portal/clones.</span>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-[550]">Project name (optional)</span>
                <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="auto from package.json or folder name" className="rounded-xl border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20" />
              </label>
            </div>
            <div className="mt-6 flex justify-end">
              <Button disabled={!canNext1} onClick={() => setStep(2)}>Continue →</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h1 className="text-[18px] font-[700] tracking-tight">Build configuration</h1>
            <p className="mt-1 text-sm text-muted-foreground">Detected via <span className="font-mono text-xs">portal.config.json</span> or <span className="font-mono text-xs">package.json</span> — override here.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-[550]">Build command</span>
                <input value={buildCommand} onChange={(e) => setBuildCommand(e.target.value)} placeholder="npm run build" className="rounded-xl border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-[550]">Output directory</span>
                <input value={outputDir} onChange={(e) => setOutputDir(e.target.value)} placeholder="dist" className="rounded-xl border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20" />
              </label>
              <div className="rounded-xl border border-dashed bg-muted/20 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Static detection</div>
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground">If <span className="text-foreground">index.html</span> + no build script, portal treats it as static and skips build.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button disabled={!canNext2} onClick={() => setStep(3)}>Continue →</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h1 className="text-[18px] font-[700] tracking-tight">Environment</h1>
            <p className="mt-1 text-sm text-muted-foreground">Masked in detail view. Stored server-side only — never in artifact.</p>
            <label className="mt-5 flex flex-col gap-1.5">
              <span className="text-xs font-[550]">Env vars (KEY=VALUE per line)</span>
              <textarea value={envVars} onChange={(e) => setEnvVars(e.target.value)} rows={5} className="rounded-xl border bg-background px-3 py-2.5 font-mono text-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/20" />
              <span className="font-mono text-[11px] text-muted-foreground">DATABASE_URL, SUPABASE_* already in portal .env — these are per-project overrides.</span>
            </label>
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>Review →</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h1 className="text-[18px] font-[700] tracking-tight">Trigger first deploy</h1>
              <dl className="mt-4 grid gap-2 font-mono text-xs">
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Source</dt><dd className="truncate text-right">{source || "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Build</dt><dd>{buildCommand} → {outputDir}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Env</dt><dd>{envVars.split("\n").filter(Boolean).length} vars (masked)</dd></div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => trigger.mutate()} disabled={trigger.isPending || !source.trim()} className="gap-2">
                  {trigger.isPending ? "Deploying…" : "Deploy now"}
                </Button>
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                {deployId && <Button variant="ghost" onClick={() => window.open(`/deploys/${encodeURIComponent(deployId)}`, "_blank")}>View deploy →</Button>}
              </div>
              {trigger.isError && (
                <div className="mt-3 rounded border border-destructive/20 bg-destructive/10 px-3 py-2">
                  <p className="font-mono text-xs font-medium text-destructive">
                    {(trigger.error as Error & { _tag?: string })?._tag ?? "Deploy failed"} — {(trigger.error as Error).message}
                  </p>
                  {(trigger.error as Error & { deployId?: string })?.deployId && (
                    <a href={`/deploys/${encodeURIComponent((trigger.error as Error & { deployId?: string }).deployId!)}`} className="mt-1 inline-flex font-mono text-[11px] text-destructive underline decoration-dotted underline-offset-4">
                      View failed deploy {(trigger.error as Error & { deployId?: string }).deployId!.slice(0, 8)} logs →
                    </a>
                  )}
                </div>
              )}
              {trigger.isSuccess && <p className="mt-3 rounded bg-emerald-500/10 px-3 py-2 font-mono text-xs text-emerald-700">Deploy triggered — follow logs below. Live via SSE.</p>}
              <p className="mt-3 font-mono text-[11px] text-muted-foreground">Equivalent CLI: <span className="text-foreground">bun run index.ts deploy "{source}"</span></p>
            </div>

            {deployId ? <BuildLogViewer deployId={deployId} enabled /> : <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center font-mono text-xs text-muted-foreground">Deploy to stream logs</div>}
          </div>
        )}
      </div>
    </PortalShell>
  )
}
