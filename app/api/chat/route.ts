import { createOpenAI } from "@ai-sdk/openai"
import { streamText, type UIMessage, convertToModelMessages } from "ai"

export const maxDuration = 60

// Use OpenRouter API key from environment or fallback
const OPENROUTER_KEY =
  process.env.OPENROUTER_API_KEY || "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"

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_KEY,
  headers: {
    "HTTP-Referer": "https://cluter.ai",
    "X-Title": "Cluter AI",
  },
})

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: openrouter("google/gemini-2.0-flash-exp:free"),
    system:
      "You are Flux AI, a helpful, crisp explainer. Always provide a clear, logically ordered, step-by-step solution first. Keep tone concise and friendly. Do not include images. Do not attempt narration yourself; the UI may ask about narration.",
    messages: convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
