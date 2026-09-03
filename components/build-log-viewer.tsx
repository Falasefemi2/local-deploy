"use client"

import * as React from "react"
import { useBuildLogStream } from "@/hooks/use-build-log-stream"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function BuildLogViewer({
  deployId,
  enabled = true,
  title = "Build logs",
}: {
  deployId: string | undefined
  enabled?: boolean
  title?: string
}) {
  const { lines, done, error } = useBuildLogStream(deployId, enabled)
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = React.useState(true)
  const [autoScroll, setAutoScroll] = React.useState(true)

  const checkBottom = React.useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 24
    setIsAtBottom(near)
    // If the user scrolls up, pause auto-scroll; scrolling back to the
    // bottom resumes it. Updated at the source (scroll handler), not an effect.
    setAutoScroll(near)
  }, [])

  React.useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener("scroll", checkBottom, { passive: true })
    return () => el.removeEventListener("scroll", checkBottom)
  }, [checkBottom])

  // auto-scroll when new lines arrive and user is at bottom or autoScroll on
  React.useEffect(() => {
    if (!autoScroll) return
    if (!isAtBottom && lines.length > 0) return
    const el = scrollerRef.current
    if (!el) return
    // wait for DOM paint then scroll
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [lines, autoScroll, isAtBottom])

  const jump = () => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    setAutoScroll(true)
  }

  // if user scrolls up, autoScroll is paused via checkBottom above

  if (!deployId) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-10 text-center font-mono text-xs text-muted-foreground">
        Select a deploy to view logs
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-[#0a0a0b] shadow-sm">
      {/* header — terminal chrome, not generic card header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500/90" />
            <span className="size-2.5 rounded-full bg-amber-500/90" />
            <span className="size-2.5 rounded-full bg-emerald-500/90" />
          </span>
          <span className="font-mono text-[11px] font-medium tracking-wide text-white/70">{title}</span>
          <span className="hidden font-mono text-[11px] text-white/30 sm:inline">— {deployId.slice(0, 8)}</span>
          {!done && lines.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] leading-none text-amber-300">
              <span className="size-1.5 animate-pulse rounded-full bg-amber-400" />
              streaming
            </span>
          )}
          {done && (
            <span className="ml-2 inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] leading-none text-white/60">
              done
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              const text = lines.map((l) => l.line).join("\n")
              navigator.clipboard.writeText(text)
            }}
            className="h-6 border border-white/10 bg-white/5 px-2 font-mono text-[11px] text-white/70 hover:bg-white/10 hover:text-white"
          >
            Copy
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setAutoScroll((v) => !v)}
            className={cn(
              "h-6 border px-2 font-mono text-[11px]",
              autoScroll ? "border-white/10 bg-white/5 text-white/70" : "border-amber-500/30 bg-amber-500/15 text-amber-200"
            )}
          >
            {autoScroll ? "Auto" : "Paused"}
          </Button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={checkBottom}
        className="relative h-[360px] overflow-auto overscroll-contain bg-[#0a0a0b] px-3 py-3 font-mono text-[12px] leading-5 text-zinc-200 scrollbar-thin [scrollbar-color:rgba(255,255,255,0.15)_transparent]"
      >
        {lines.length === 0 && !error && !done && (
          <div className="py-6 text-center text-xs text-white/30">Waiting for logs…</div>
        )}
        {error && <div className="rounded bg-red-500/10 px-2 py-1 text-xs text-red-300">{error}</div>}
        <div className="flex flex-col gap-0.5">
          {lines.map((l, i) => (
            <div
              key={i}
              className="flex gap-3 whitespace-pre-wrap break-words text-[12px] leading-5"
              style={{ animation: `logIn 180ms cubic-bezier(0.23,1,0.32,1) both`, animationDelay: `${Math.min(i * 4, 120)}ms` }}
            >
              <span className="shrink-0 select-none text-right text-[11px] tabular-nums text-white/20" style={{ minWidth: "2rem" }}>
                {i + 1}
              </span>
              <span className={cn(
                "min-w-0 flex-1",
                l.line.startsWith("[portal]") ? "text-white/85" : "text-zinc-300",
                l.line.includes("✓") ? "text-emerald-300" : "",
                l.line.includes("failed") || l.line.includes("error") ? "text-red-300" : ""
              )}>
                {l.line || " "}
              </span>
            </div>
          ))}
          {!done && lines.length > 0 && (
            <div className="mt-1 flex items-center gap-2 py-1">
              <span className="size-1.5 animate-pulse rounded-full bg-amber-400" />
              <span className="font-mono text-[11px] text-white/30">build in progress</span>
            </div>
          )}
        </div>
      </div>

      {/* jump affordance — only when not at bottom */}
      <div
        className={cn(
          "flex justify-center border-t border-white/10 bg-[#0a0a0b] px-3 py-2 transition-[opacity,transform] duration-200",
          isAtBottom ? "pointer-events-none opacity-0 translate-y-1" : "opacity-100 translate-y-0"
        )}
      >
        <button
          onClick={jump}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-[550] text-black transition-[transform,opacity] hover:opacity-90 active:scale-[0.97]"
        >
          Jump to bottom
          <span className="rounded-full bg-black/10 px-1.5 py-0.5 font-mono text-[10px] leading-none">{lines.length}</span>
        </button>
      </div>

      <style>{`@keyframes logIn{from{opacity:0;transform:translateY(2px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
