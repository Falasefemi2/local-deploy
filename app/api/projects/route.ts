export const dynamic = "force-dynamic"

const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:8080"

export async function GET() {
  try {
    const res = await fetch(`${PORTAL}/api/projects`, { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      return Response.json(data, { headers: { "Access-Control-Allow-Origin": "*" } })
    }
    // fallback to empty if portal says no projects
    if (res.status === 404) return Response.json([])
    const text = await res.text()
    return new Response(text, { status: res.status })
  } catch (e) {
    return new Response(String((e as Error).message ?? e), { status: 502 })
  }
}
