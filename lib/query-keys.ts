export const portalKeys = {
  all: ["portal"] as const,
  projects: () => [...portalKeys.all, "projects"] as const,
  project: (name: string) => [...portalKeys.projects(), name] as const,
  deploys: (project: string) => [...portalKeys.project(project), "deploys"] as const,
  deploy: (deployId: string) => [...portalKeys.all, "deploy", deployId] as const,
} as const
