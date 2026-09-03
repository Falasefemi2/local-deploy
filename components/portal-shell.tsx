"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function PortalShell({
  children,
  sidebar,
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
}) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* top bar — dense, infra-like, not generic SaaS header */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-[52px] max-w-[1240px] items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-[11px] font-bold tracking-[0.14em] text-background">
              P
            </span>
            <span className="text-[13px] font-[650] tracking-tight">portal</span>
            <Badge variant="outline" className="hidden rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] leading-none font-normal text-muted-foreground sm:inline-flex">
              local
            </Badge>
          </Link>

          <span className="hidden h-4 w-px bg-border sm:block" />

          <span className="hidden items-center gap-2 font-mono text-[11px] text-muted-foreground sm:inline-flex">
            <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            serving on :8080
          </span>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden font-mono text-[11px] text-muted-foreground md:inline">
              .portal • {new Date().getFullYear()}
            </span>
            <Link
              href="/new"
              className={cn(
                "inline-flex h-7 items-center rounded-full bg-foreground px-3 text-xs font-[550] text-background transition-[transform,opacity] hover:opacity-90 active:scale-[0.97]"
              )}
            >
              New project
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8 lg:py-8">
        <aside className="lg:sticky lg:top-[76px] lg:h-fit lg:self-start">
          <div className="rounded-2xl border bg-card p-3 shadow-sm">{sidebar}</div>
          <div className="mt-3 rounded-xl border border-dashed bg-muted/20 px-3.5 py-3">
            <p className="text-xs font-[550]">How deploys work</p>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground">
              <span className="text-foreground">portal deploy &lt;path&gt;</span> → build → tar → s3 → serve.
              Promote via <span className="text-foreground">portal promote &lt;id&gt;</span>.
            </p>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>

      <footer className="mx-auto max-w-[1240px] px-4 pb-8 sm:px-6">
        <div className="flex items-center justify-between border-t pt-4 font-mono text-[11px] text-muted-foreground">
          <span>Press D to toggle theme • SSE live, not polled</span>
          <span className="hidden sm:inline">artifact cache: .portal/cache</span>
        </div>
      </footer>
    </div>
  )
}
