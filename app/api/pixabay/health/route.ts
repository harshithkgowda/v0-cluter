/**
 * Simple health endpoint to verify Pixabay key is configured.
 */
export async function GET() {
  const hasApiKey = Boolean(process.env.PIXABAY_API_KEY)
  return Response.json({ pixabay: hasApiKey }, { status: hasApiKey ? 200 : 503 })
}
