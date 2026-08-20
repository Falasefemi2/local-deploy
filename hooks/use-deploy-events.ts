"use client"

import * as React from "react"
import { PORTAL_URL } from "@/lib/api"

export type LiveStatus = "running" | "succeeded" | "failed"

export function useDeployEvents(deployId: string | undefined, initialStatus: LiveStatus | undefined) {
  const [status, setStatus] = React.useState<LiveStatus | undefined>(initialStatus)
  const [phase, setPhase] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    setStatus(initialStatus)
  }, [initialStatus, deployId])

  React.useEffect(() => {
    if (!deployId) return
    if (initialStatus !== "running") return

    const es = new EventSource(`${PORTAL_URL}/api/deploys/${encodeURIComponent(deployId)}/events`)
    const onStatus = (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data) as { status: LiveStatus; msg?: string }
        if (d.status) setStatus(d.status)
        if (d.msg) setPhase(d.msg)
      } catch {}
    }
    es.addEventListener("status", onStatus as EventListener)
    es.onerror = () => {
      // let browser retry; close if succeeded
      if (status === "succeeded" || status === "failed") es.close()
    }
    return () => es.close()
  }, [deployId, initialStatus, status])

  return { status: status ?? initialStatus, phase }
}
