# Portal Frontend

Dashboard for `portal` — local-first deploy platform (Vercel-style). No dummy
data: all server state comes from `portal` `api` branch at `http://localhost:8080`.
SSE-driven live status, not polled.

Built with Next.js 16 (App Router) + React 19 + shadcn/ui (base-nova/neutral)
+ TanStack Query v5. Motion guided by `emil-design-eng` + `anti-ui-slop`.

## Stack

- **React 19 / Next 16** — App Router, `ThemeProvider` (`next-themes`), `Inter` + `Geist_Mono`
- **shadcn/ui** `style: base-nova`, `tailwindcss v4`, `tw-animate-css`, `lucide-react`, `@base-ui/react`
- **TanStack Query v5** — all server state; no `useEffect/fetch` data fetching
- **SSE hooks** — build logs / deploy status are streams, not queries

## Routes

| Route | File | Description |
| --- | --- | --- |
| `/` | `app/page.tsx` | Project list + deployment history (master/detail, live status chips) |
| `/deploys/[deployId]` | `app/deploys/[deployId]/page.tsx` | Deploy detail: metadata, artifact, masked env, promote/rollback, full log viewer |
| `/new` | `app/new/page.tsx` | 4-step creation: source → build config → env (masked) → trigger first deploy |
| `/_not-found` | `app/_not-found` | Next fallback |

Thin route files mount feature components; providers at `app/layout.tsx`
(`QueryProvider` + `ThemeProvider`). `app/(portal)` grouping not used — root
page is the portal home.

## Data layer — TanStack Query only

```
lib/query-client.ts  — makeQueryClient()  { staleTime: 30s, gcTime: 5m, retry:1, refetchOnWindowFocus:false }
lib/query-keys.ts    — portalKeys.all/projects/project(name)/deploys(project)/deploy(id)
lib/queries.ts       — projectsQuery, deploysQuery(project), deployQuery(id)  (queryOptions)
lib/api.ts           — typed fetch client  PORTAL_URL = NEXT_PUBLIC_PORTAL_URL ?? http://localhost:8080
                     listProjects, listDeploys(project), getDeploy(id), promote(id), redeploy(id,path), triggerDeploy(path,buildCommand)
```

All fetches go to `portal` directly (`PORTAL_URL + /api/*`). Next `app/api/*`
handlers are thin proxies for SSR (`fetch(PORTAL + /api/…)`, CORS `*`) — also let
`localhost:3000/api/projects` work when `PORTAL_URL` is unreachable:

- `app/api/projects/route.ts` → `GET PORTAL/api/projects`
- `app/api/projects/[project]/deploys/route.ts`
- `app/api/deploys/[deployId]/route.ts`
- `app/api/deploys/[deployId]/promote|redeploy/route.ts`
- `app/api/deploys/[deployId]/logs|events/route.ts` — proxy SSE `text/event-stream`
- `app/api/deploy/route.ts` — `POST PORTAL/api/deploy`

## SSE (streams, not queries)

| Hook | File | Endpoint | Behaviour |
| --- | --- | --- | --- |
| `useDeployEvents` | `hooks/use-deploy-events.ts` | `GET PORTAL/api/deploys/:id/events` | `EventSource` on `event: status {status,at}` + `ping`; only when `initialStatus==="running"`; updates `status/phase`, auto-closes when `succeeded/failed` |
| `useBuildLogStream` | `hooks/use-build-log-stream.ts` | `GET PORTAL/api/deploys/:id/logs` | `EventSource` on `data: {line,at}` + `event: done`; `lines[]`, `done`, `error` |

Viewed in `components/build-log-viewer.tsx` (terminal chrome, line numbers,
`waiting/streaming/done`, copy + pause, auto-scroll via `requestAnimationFrame`,
`isAtBottom` check `scrollHeight - scrollTop - clientHeight <24`, “Jump to bottom”
`opacity+translate` 200ms ease-out, per-line `logIn` 180ms `cubic-bezier(0.23,1,0.32,1)`).

## UI components

| Component | Notes vs default shadcn |
| --- | --- |
| `components/portal-shell.tsx` | Sticky 52px header, `backdrop-blur`, monospace `serving on :8080`, 300px sidebar ledger |
| `components/project-list.tsx` | Selectable ledger, `deployCount`, `gitSha`, `production` pill, stagger `45ms` |
| `components/deploy-history.tsx` | Timeline `rowIn` `38ms`, `StatusDot` pulse + `StatusLabel`, shimmer bar for `running`, `View/Logs → /deploys/:id` |
| `components/status-dot.tsx` | `running amber` / `succeeded emerald` / `failed red` + `ping` + shadow |
| `components/build-log-viewer.tsx` | Auto-scroll, jump affordance, blur-masked not used here |
| `components/query-provider.tsx` | Browser singleton `QueryClient` |
| `components/ui/button.tsx` | shadcn base-nova, `cva` variants (`:active: translate-y-px`) |

Global tokens in `app/globals.css` (oklch, `--radius:0.625rem`, `tw-animate-css`,
`shadcn/tailwind.css`). Animations never `scale(0)` (start `0.95`+`opacity:0`),
never `transition:all` (explicit `border-color,background-color,transform` 200ms
`cubic-bezier(0.23,1,0.32,1)`), `:active scale(0.97)`, stagger `<80ms`, `prefers-reduced-motion` untouched (no forced motion on `running` aside from opacity).

## Mutations — optimistic updates

```ts
promote(id) // POST /api/deploys/:id/promote
  onMutate: cancelQueries(deploy), snapshot prev
  onError: rollback
  onSettled: invalidateQueries(['portal']) // refresh projects/deploys lists

redeploy(id, path) // POST /api/deploys/:id/redeploy {path}
  // path prompted via window.prompt(project) — local-first demo
  onSuccess: invalidateQueries(['portal'])

triggerDeploy(path, buildCommand) // POST /api/deploy
  onSuccess: invalidateQueries(['portal']), capture deployId → log viewer
```

## Adding shadcn components

```bash
npx shadcn@latest add button  # components land in components/ui/
```

Import as `import { Button } from "@/components/ui/button"` (alias `@/*` → `/*`).

## Environment

| Var | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_PORTAL_URL` | `http://localhost:8080` | Portal API origin (see `lib/api.ts:1`) |
| `PORT` | `3000` | Next dev port (`bun run dev`) |

Portal must be on `api` branch with `.env` (`DATABASE_URL`, `SUPABASE_*`).

## Development

Requires [Bun](https://bun.com) 1.3.x, Node 20+.

```bash
bun install
bun run dev      # http://localhost:3000 (Turbopack), hot reload
bun run build    # next build (Turbopack) — typechecks, collects 10 routes
bun run lint     # eslint
bun run format   # prettier --write "**/*.{ts,tsx}"
bun run typecheck # tsc --noEmit (if script added) or bunx tsc --noEmit
```

Before building UI, skills were checked: `anti-ui-slop` (avoid card grids, no
decorative kicker), `animation-vocabulary` + `emil-design-eng` (spring vs
`ease-out`, `clip-path` not used), `tanstack-query` (keys, `queryOptions`,
`placeholderData` vs `initialData`), `frontend-architecture` (thin `app/`
mounting modules).

## Running with portal

```bash
# terminal 1 — portal api
cd ../portal
git checkout api
bun install
cp .env.example .env  # fill DATABASE_URL + SUPABASE_*
bun run index.ts serve
# → portal listening on http://localhost:8080

# terminal 2 — frontend
cd ../portal-frontend
bun install
bun run dev
# → http://localhost:3000  — list shows real projects from portal
#  http://localhost:3000/deploys/<id>  log viewer SSE
#  http://localhost:3000/new  → POST /api/deploy → same as bun run index.ts deploy <path>
```

## Portal API contract (consumed)

`DeployRecord` (`portal/src/core/model.ts:15`): `{deployId, project, gitSha, status, createdAt, artifactPath?, buildLogRef?}`

Frontend expects exactly the portal `/api/*` table above — see `portal/README.md#API`.

## Scope

Implemented in order per spec: (1) list + history SSE, (2) log viewer auto-scroll+jump,
(3) detail (metadata/artifact/env masked/promote/rollback), (4) creation flow.
No polling for live status — SSE only (`useDeployEvents` / `useBuildLogStream`).
