import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"

export const maxDuration = 60

const SlideSchema = z.object({
  title: z.string().min(1).max(80),
  query: z.string().min(1).max(120),
  bullets: z.array(z.string().min(1).max(140)).min(2).max(5),
  narration: z.string().min(1).max(360),
})
const SlidesSchema = z.array(SlideSchema).min(3).max(6)

// 1) Preferred: set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY in your environment.
// 2) Preview fallback: replace the string below with your key if needed.
//    REPLACE HERE if you want a hardcoded fallback for preview only:
const HARDCODED_GEMINI_KEY = "AIzaSyCm-uTAcu_s7-pJ1YOoIgw1GJijEKDqOKQ"

const GEMINI_KEY =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  HARDCODED_GEMINI_KEY

// Explicitly create a provider with the resolved key so Narrate works even in preview [AI SDK].
const google = createGoogleGenerativeAI({ apiKey: GEMINI_KEY })

export async function POST(req: Request) {
  try {
    const { question, answer }: { question: string; answer: string } = await req.json()

    const prompt = `
Create a concise, user-friendly slideshow plan that explains the solution clearly.

Guidelines:
- 4–6 slides.
- Each slide MUST include:
  - title: short and clear
  - query: a specific Unsplash image search query
  - bullets: 2–4 short points (not long paragraphs)
  - narration: 2–3 sentences that explain those points in simple, friendly language (no jargon), so a beginner understands. Avoid just listing the bullets; connect them into a small story.

Tone:
- Helpful teacher. Short, clear, practical.

Return ONLY a JSON array strictly matching the schema.

Question:
${question}

Answer:
${answer}
`.trim()

    const { object } = await generateObject({
      model: google("gemini-1.5-flash"),
      schema: SlidesSchema,
      system:
        "You are Flux AI. Produce a compact, beginner-friendly slideshow plan. Narration should be 2–3 short sentences that explain the bullets clearly.",
      prompt,
    })

    const slides = object.slice(0, 6)
    return new Response(JSON.stringify({ slides }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Failed to create slideshow" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
