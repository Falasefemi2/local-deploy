"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { PORTAL_URL } from "@/lib/api"
import { portalKeys } from "@/lib/query-keys"

export type LiveStatus = "running" | "succeeded" | "failed"

export function useDeployEvents(deployId: string | undefined, initialStatus: LiveStatus | undefined) {
  const qc = useQueryClient()
  const [status, setStatus] = React.useState<LiveStatus | undefined>(initialStatus)
  const [phase, setPhase] = React.useState<string | undefined>(undefined)
  const statusRef = React.useRef(status)

  // Mirror latest status for the EventSource error handler without putting
  // `status` in the subscription effect deps (avoids re-subscribe churn).
  React.useEffect(() => {
    statusRef.current = status
  })

  // Re-sync when the query-provided status or target deploy changes — adjusted
  // during render instead of a setState-in-effect.
  const [prevSync, setPrevSync] = React.useState({ id: deployId, s: initialStatus })
  if (prevSync.id !== deployId || prevSync.s !== initialStatus) {
    setPrevSync({ id: deployId, s: initialStatus })
    setStatus(initialStatus)
  }

  React.useEffect(() => {
    if (!deployId) return
    if (initialStatus !== "running") return

    const es = new EventSource(`${PORTAL_URL}/api/deploys/${encodeURIComponent(deployId)}/events`)
    const onStatus = (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data) as { status: LiveStatus; msg?: string }
        if (d.status) setStatus(d.status)
        if (d.msg) setPhase(d.msg)
        // The deploy just reached a terminal state — sync the cached record
        // so back-navigation reads fresh data, not a stale "running" entry.
        // Fires once per transition: repeats are skipped via statusRef.
        const terminal = d.status === "succeeded" || d.status === "failed"
        if (terminal && statusRef.current !== d.status) {
          qc.invalidateQueries({ queryKey: portalKeys.deploy(deployId) })
        }
      } catch {}
    }
    es.addEventListener("status", onStatus as EventListener)
    es.onerror = () => {
      // let browser retry; close if succeeded
      if (statusRef.current === "succeeded" || statusRef.current === "failed") es.close()
    }
    return () => es.close()
  }, [deployId, initialStatus, qc])

  return { status: status ?? initialStatus, phase }
}
