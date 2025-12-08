import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { streamText, UIMessage, convertToModelMessages } from "ai"

export const maxDuration = 60

// 1) Preferred: set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY in your environment.
// 2) Preview fallback: replace the string below with your key if needed.
//    REPLACE HERE if you want a hardcoded fallback for preview only:
const HARDCODED_GEMINI_KEY = "AIzaSyCm-uTAcu_s7-pJ1YOoIgw1GJijEKDqOKQ"

const GEMINI_KEY =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  HARDCODED_GEMINI_KEY

const gemini = createGoogleGenerativeAI({ apiKey: GEMINI_KEY })

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: gemini("gemini-1.5-flash"),
    system:
      "You are Flux AI, a helpful, crisp explainer. Always provide a clear, logically ordered, step-by-step solution first. Keep tone concise and friendly. Do not include images. Do not attempt narration yourself; the UI may ask about narration.",
    messages: convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
