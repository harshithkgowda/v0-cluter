/**
 * Simple health endpoint so you can verify the server can see the Unsplash key.
 * Does not expose any secret; it only returns booleans.
 */
export async function GET() {
  const hasAccessKey = Boolean(process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_API_KEY)
  return Response.json({ ok: true, hasAccessKey })
}
