export const dynamic = "force-dynamic"
const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:8080"

export async function POST(req: Request) {
  const body = await req.text()
  try {
    const res = await fetch(`${PORTAL}/api/deploy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
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
