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

  const [prevKey, setPrevKey] = React.useState(`${enabled}:${deployId}`)
  if (prevKey !== `${enabled}:${deployId}`) {
    // New stream target — reset accumulated state during render (React-endorsed
    // adjust-state-during-render), so the subscription effect stays pure.
    setPrevKey(`${enabled}:${deployId}`)
    setLines([])
    setDone(false)
    setError(null)
  }

  React.useEffect(() => {
    if (!deployId || !enabled) return

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
