export const dynamic = "force-dynamic"
const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:8080"

export async function POST(req: Request, ctx: { params: Promise<{ deployId: string }> }) {
  const { deployId } = await ctx.params
  const body = await req.text()
  try {
    const res = await fetch(`${PORTAL}/api/deploys/${encodeURIComponent(deployId)}/redeploy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body || undefined,
    })
    const resBody = await res.text()
    return new Response(resBody, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json", "Access-Control-Allow-Origin": "*" },
    })
  } catch (e) {
    return new Response(String((e as Error).message ?? e), { status: 502 })
  }
}
