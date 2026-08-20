export const dynamic = "force-dynamic"
const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:8080"

export async function GET(_: Request, ctx: { params: Promise<{ project: string }> }) {
  const { project } = await ctx.params
  try {
    const res = await fetch(`${PORTAL}/api/projects/${encodeURIComponent(project)}/deploys`, { cache: "no-store" })
    const body = await res.text()
    return new Response(body, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json", "Access-Control-Allow-Origin": "*" },
    })
  } catch (e) {
    return new Response(String((e as Error).message ?? e), { status: 502 })
  }
}
