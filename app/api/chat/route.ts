import { openai } from "@ai-sdk/openai"
import { streamText, type UIMessage, convertToModelMessages } from "ai"

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: openai("gpt-4"),
    system:
      "You are Flux AI, a helpful, crisp explainer. Always provide a clear, logically ordered, step-by-step solution first. Keep tone concise and friendly. Do not include images. Do not attempt narration yourself; the UI may ask about narration.",
    messages: convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
