export const maxDuration = 30

type QueryItem = { query: string }
type Body = {
  queries: QueryItem[]
  accessKey?: string
}

/**
 * Server-only Pixabay search proxy.
 * Looks up the access key from server env: PIXABAY_API_KEY
 */
export async function POST(req: Request) {
  try {
    const { queries, accessKey: bodyKey }: Body = await req.json()

    if (!Array.isArray(queries) || queries.length === 0) {
      return Response.json({ error: "queries must be a non-empty array" }, { status: 400 })
    }

    const API_KEY = process.env.PIXABAY_API_KEY || bodyKey || ""

    if (!API_KEY) {
      return Response.json(
        {
          error: "Missing Pixabay API key. Set PIXABAY_API_KEY in your environment.",
        },
        { status: 401 },
      )
    }

    const results = await Promise.all(
      queries.map(async ({ query }) => {
        const url = new URL("https://pixabay.com/api/")
        url.searchParams.set("key", API_KEY)
        url.searchParams.set("q", query)
        url.searchParams.set("image_type", "photo")
        url.searchParams.set("per_page", "3")
        url.searchParams.set("safesearch", "true")

        const res = await fetch(url.toString(), {
          cache: "no-store",
        })

        if (!res.ok) {
          const text = await res.text().catch(() => "")
          throw new Error(`Pixabay request failed (${res.status}): ${text || "no body"}`)
        }

        const data = (await res.json()) as {
          hits?: Array<{
            largeImageURL: string
            webformatURL: string
            tags: string
            user: string
            pageURL: string
          }>
        }

        const first = data?.hits?.[0]
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
          url: first.largeImageURL ?? first.webformatURL ?? null,
          alt: first.tags ?? query,
          credit: first.user ?? null,
          link: first.pageURL ?? null,
        }
      }),
    )

    return Response.json({ images: results }, { status: 200 })
  } catch (e: any) {
    return Response.json({ error: e?.message ?? "Failed to fetch images from Pixabay" }, { status: 500 })
  }
}
