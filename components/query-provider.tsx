"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { makeQueryClient } from "@/lib/query-client"

let browserQueryClient: ReturnType<typeof makeQueryClient> | undefined

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const clientRef = React.useRef(getQueryClient())
  return (
    <QueryClientProvider client={clientRef.current}>{children}</QueryClientProvider>
  )
}
