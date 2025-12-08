export const maxDuration = 30

type QueryItem = { query: string }
type Body = {
  queries: QueryItem[]
  // Optional preview fallback; do NOT use in production.
  accessKey?: string
}

/**
 * Server-only Unsplash search proxy.
 * Looks up the access key strictly from server env:
 *   - UNSPLASH_ACCESS_KEY (preferred)
 *   - UNSPLASH_API_KEY (legacy)
 * Optionally accepts "accessKey" in request body for local/preview debugging.
 * Never uses NEXT_PUBLIC_* to avoid client exposure. See Next.js env guidance [^3].
 */
export async function POST(req: Request) {
  try {
    const { queries, accessKey: bodyKey }: Body = await req.json()

    if (!Array.isArray(queries) || queries.length === 0) {
      return Response.json({ error: "queries must be a non-empty array" }, { status: 400 })
    }

    const ACCESS_KEY =
      process.env.UNSPLASH_ACCESS_KEY ||
      process.env.UNSPLASH_API_KEY ||
      // Preview-only escape hatch; do not rely on this in production:
      bodyKey ||
      ""

    if (!ACCESS_KEY) {
      return Response.json(
        {
          error:
            "Missing Unsplash access key. Set UNSPLASH_ACCESS_KEY (or UNSPLASH_API_KEY) in your environment.",
        },
        { status: 401 },
      )
    }

    const results = await Promise.all(
      queries.map(async ({ query }) => {
        const url = new URL("https://api.unsplash.com/search/photos")
        url.searchParams.set("query", query)
        url.searchParams.set("page", "1")
        url.searchParams.set("per_page", "1")
        url.searchParams.set("content_filter", "high")

        const res = await fetch(url.toString(), {
          headers: {
            Authorization: `Client-ID ${ACCESS_KEY}`,
            "Accept-Version": "v1",
          },
          // Unsplash doesn’t require POST; we proxy searches server-side.
          cache: "no-store",
        })

        if (!res.ok) {
          const text = await res.text().catch(() => "")
          throw new Error(`Unsplash request failed (${res.status}): ${text || "no body"}`)
        }

        const data = (await res.json()) as {
          results?: Array<{
            urls: { regular: string; small: string }
            alt_description: string | null
            description: string | null
            user?: { name?: string | null; links?: { html?: string | null } | null }
            links?: { html?: string | null }
          }>
        }

        const first = data?.results?.[0]
        if (!first) {
          return {
            query,
            url: null,
            alt: null,
            credit: null,
            link: null,
          }
        }

        return {
          query,
          url: first.urls?.regular ?? first.urls?.small ?? null,
          alt: first.alt_description ?? first.description ?? query,
          credit: first.user?.name ?? null,
          link: first.links?.html ?? first.user?.links?.html ?? null,
        }
      }),
    )

    return Response.json({ images: results }, { status: 200 })
  } catch (e: any) {
    return Response.json(
      { error: e?.message ?? "Failed to fetch images from Unsplash" },
      { status: 500 },
    )
  }
}
