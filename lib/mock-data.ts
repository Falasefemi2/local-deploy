import type { DeployRecord } from "./api"

function iso(offsetMinutes: number) {
  return new Date(Date.now() - offsetMinutes * 60_000).toISOString()
}

export const MOCK_DEPLOYS: DeployRecord[] = [
  {
    deployId: "dpl_2x9f8a1b",
    project: "pharlase-femmie",
    gitSha: "a7f3c9e2b1d04f6a",
    status: "succeeded",
    createdAt: iso(18),
    artifactPath: "pharlase-femmie/dpl_2x9f8a1b/artifact.tar.gz",
    buildLogRef: ".portal/logs/dpl_2x9f8a1b.log",
  },
  {
    deployId: "dpl_7k1m3p9q",
    project: "pharlase-femmie",
    gitSha: "8c2a1f0de9b34a7c",
    status: "running",
    createdAt: iso(4),
    buildLogRef: ".portal/logs/dpl_7k1m3p9q.log",
  },
  {
    deployId: "dpl_4b8n2c0x",
    project: "paystack-effect-integration",
    gitSha: "f1e9d2a0c3b84e5f",
    status: "succeeded",
    createdAt: iso(62),
    artifactPath: "paystack-effect-integration/dpl_4b8n2c0x/artifact.tar.gz",
  },
  {
    deployId: "dpl_9q1z0w2e",
    project: "easyrent",
    gitSha: "3b7a9c1d0e2f84a6",
    status: "failed",
    createdAt: iso(1440),
    buildLogRef: ".portal/logs/dpl_9q1z0w2e.log",
  },
  {
    deployId: "dpl_1a3s5d7f",
    project: "bot-review",
    gitSha: "c4e8a2f01b9d63e0",
    status: "succeeded",
    createdAt: iso(320),
    artifactPath: "bot-review/dpl_1a3s5d7f/artifact.tar.gz",
  },
  {
    deployId: "dpl_6g8h0j2k",
    project: "backend-portfolio",
    gitSha: "9a0f1e2d3c4b5a6d",
    status: "succeeded",
    createdAt: iso(540),
    artifactPath: "backend-portfolio/dpl_6g8h0j2k/artifact.tar.gz",
  },
]

export function projectsFromDeploys(deploys: DeployRecord[]) {
  const byProject = new Map<string, DeployRecord[]>()
  for (const d of deploys) {
    const arr = byProject.get(d.project)
    if (arr) arr.push(d)
    else byProject.set(d.project, [d])
  }
  return [...byProject.entries()].map(([name, list]) => {
    list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    return {
      name,
      deployCount: list.length,
      lastDeploy: list[0],
      productionDeployId: list.find((d) => d.status === "succeeded")?.deployId,
    }
  })
}
