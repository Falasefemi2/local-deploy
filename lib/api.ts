export type DeployStatus = "running" | "succeeded" | "failed"

export interface DeployRecord {
  deployId: string
  project: string
  gitSha: string
  status: DeployStatus
  createdAt: string
  artifactPath?: string
  buildLogRef?: string
}

export interface ProjectSummary {
  name: string
  deployCount: number
  lastDeploy?: DeployRecord
  productionDeployId?: string
}

export const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:8080"

const BASE = PORTAL_URL

async function json<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `Request failed ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  listProjects: (signal?: AbortSignal) =>
    json<ProjectSummary[]>(`${BASE}/api/projects`, { signal }),

  listDeploys: (project: string, signal?: AbortSignal) =>
    json<DeployRecord[]>(`${BASE}/api/projects/${encodeURIComponent(project)}/deploys`, {
      signal,
    }),

  getDeploy: (deployId: string, signal?: AbortSignal) =>
    json<DeployRecord>(`${BASE}/api/deploys/${encodeURIComponent(deployId)}`, { signal }),

  promote: (deployId: string) =>
    json<{ ok: true }>(`${BASE}/api/deploys/${encodeURIComponent(deployId)}/promote`, {
      method: "POST",
    }),

  redeploy: (deployId: string, path?: string) =>
    json<{ ok: true } | DeployRecord>(`${BASE}/api/deploys/${encodeURIComponent(deployId)}/redeploy`, {
      method: "POST",
      body: path ? JSON.stringify({ path }) : undefined,
    }),

  triggerDeploy: (path: string, buildCommand?: string) =>
    json<DeployRecord>(`${BASE}/api/deploy`, {
      method: "POST",
      body: JSON.stringify({ path, buildCommand }),
    }),

  portalOrigin: PORTAL_URL,
}
