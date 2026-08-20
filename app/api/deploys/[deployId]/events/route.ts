export const dynamic = "force-dynamic"
const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:8080"

export async function GET(req: Request, ctx: { params: Promise<{ deployId: string }> }) {
  const { deployId } = await ctx.params
  const url = new URL(req.url)
  // proxy SSE stream directly
  const portalUrl = `${PORTAL}/api/deploys/${encodeURIComponent(deployId)}/events${url.search}`
  try {
    const res = await fetch(portalUrl, { headers: { Accept: "text/event-stream" } })
    if (!res.ok || !res.body) {
      const t = await res.text().catch(() => "")
      return new Response(t || "not found", { status: res.status })
    }
    return new Response(res.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (e) {
    return new Response(String((e as Error).message ?? e), { status: 502 })
  }
}
