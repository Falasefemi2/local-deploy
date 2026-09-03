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

export class ApiError extends Error {
  status: number
  deployId?: string
  project?: string
  record?: DeployRecord
  _tag?: string

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    const b = body as
      | { deployId?: string; project?: string; record?: DeployRecord; _tag?: string }
      | null
      | undefined
    this.deployId = b?.deployId
    this.project = b?.project
    this.record = b?.record
    this._tag = b?._tag
  }
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  const text = await res.text().catch(() => "")
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const msg =
      (data as { message?: string })?.message ??
      (typeof data === "string" && data ? data : JSON.stringify(data)) ??
      `Request failed ${res.status}`
    throw new ApiError(msg, res.status, data)
  }
  return data as T
}

async function json<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  return request<T>(input, init)
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

  triggerDeploy: (path: string, buildCommand?: string): Promise<DeployRecord> =>
    request<DeployRecord>(`${BASE}/api/deploy`, {
      method: "POST",
      body: JSON.stringify({ path, buildCommand }),
    }),

  portalOrigin: PORTAL_URL,
}
