"use client"

import * as React from "react"
import { PORTAL_URL } from "@/lib/api"

export interface LogLine {
  line: string
  at: string
}

export function useBuildLogStream(deployId: string | undefined, enabled = true) {
  const [lines, setLines] = React.useState<LogLine[]>([])
  const [done, setDone] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!deployId || !enabled) return
    setLines([])
    setDone(false)
    setError(null)

    const es = new EventSource(`${PORTAL_URL}/api/deploys/${encodeURIComponent(deployId)}/logs`)

    const onMessage = (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data) as LogLine
        if (d.line) setLines((prev) => [...prev, d])
      } catch {}
    }
    const onDone = () => {
      setDone(true)
      es.close()
    }
    es.onmessage = onMessage
    es.addEventListener("done", onDone as EventListener)
    es.onerror = () => {
      setError("stream interrupted")
      es.close()
    }
    return () => es.close()
  }, [deployId, enabled])

  return { lines, done, error }
}
