import { queryOptions } from "@tanstack/react-query"
import { api } from "./api"
import { portalKeys } from "./query-keys"

export const projectsQuery = queryOptions({
  queryKey: portalKeys.projects(),
  queryFn: ({ signal }) => api.listProjects(signal),
})

export const deploysQuery = (project: string) =>
  queryOptions({
    queryKey: portalKeys.deploys(project),
    queryFn: ({ signal }) => api.listDeploys(project, signal),
    enabled: !!project,
  })

export const deployQuery = (deployId: string) =>
  queryOptions({
    queryKey: portalKeys.deploy(deployId),
    queryFn: ({ signal }) => api.getDeploy(deployId, signal),
    enabled: !!deployId,
  })
