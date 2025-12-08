import type { NextRequest } from "next/server"

// Server-side proxy to your Perplexica backend.
// Configure PERPLEXICA_URL in your environment (e.g. https://perplexica.yourdomain.com)
// Optionally configure PERPLEXICA_API_KEY for Bearer authentication if your backend uses it.

function joinUrl(base: string, path: string) {
  if (!base.endsWith("/")) base += "/"
  return new URL(path.replace(/^\/+/, ""), base).toString()
}

async function handle(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const base = process.env.PERPLEXICA_URL
  if (!base) {
    return new Response(
      JSON.stringify({
        error: "PERPLEXICA_URL is not set. Please set it in your environment.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }

  const path = (params.path || []).join("/")
  const target = joinUrl(base, path)

  // Clone headers and remove hop-by-hop headers
  const incoming = new Headers(req.headers)
  incoming.delete("host")
  incoming.delete("connection")
  incoming.delete("content-length")

  // Inject Authorization if not present and PERPLEXICA_API_KEY exists
  if (!incoming.has("authorization") && process.env.PERPLEXICA_API_KEY) {
    incoming.set("authorization", `Bearer ${process.env.PERPLEXICA_API_KEY}`)
  }

  const init: RequestInit = {
    method: req.method,
    headers: incoming,
    // For GET/HEAD no body
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
    // Keep streaming when possible
    redirect: "manual",
  }

  const upstream = await fetch(target, init)

  // Pipe through status and headers
  const headers = new Headers(upstream.headers)
  // Prevent CORS leakage back to client; API is same-origin now
  headers.delete("access-control-allow-origin")
  headers.delete("content-length")

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
