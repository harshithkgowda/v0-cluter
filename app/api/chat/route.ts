export const maxDuration = 60

const HARDCODED_RESPONSES: Record<string, string> = {
  "how to fix car tyre": `To fix a car tire, follow these steps:

1. **Safety First**: Pull over to a safe location, turn on hazard lights, and engage the parking brake.

2. **Gather Tools**: You'll need a spare tire, jack, lug wrench, wheel wedges, and gloves.

3. **Loosen Lug Nuts**: Before jacking up the car, use the lug wrench to loosen the lug nuts on the flat tire (turn counterclockwise). Don't remove them completely yet.

4. **Jack Up the Vehicle**: Place the jack under the car's frame near the flat tire. Raise the car until the tire is about 6 inches off the ground.

5. **Remove Flat Tire**: Now fully remove the lug nuts and pull the tire straight toward you to remove it from the wheelbase.

6. **Mount Spare Tire**: Align the spare tire with the wheel bolts and push it onto the wheelbase. Hand-tighten the lug nuts.

7. **Lower Vehicle**: Use the jack to lower the car back to the ground (not all the way).

8. **Tighten Lug Nuts**: Use the lug wrench to fully tighten the lug nuts in a star pattern to ensure even pressure.

9. **Lower Completely**: Lower the car all the way to the ground and remove the jack.

10. **Check Pressure**: Visit a tire shop or gas station to check the spare tire's pressure and get your flat tire repaired or replaced.

Remember: Spare tires are temporary. Drive carefully and don't exceed 50 mph with a spare tire.`,

  default: `I'm Flux AI, your helpful assistant! I can help you understand various topics and create visual slideshows to explain concepts.

Try asking me questions like:
- "How to fix a car tire"
- "Steps to bake chocolate cake"
- "How to change a light bulb"
- "Tips for studying effectively"

I'll provide detailed, step-by-step explanations that you can also view as an interactive slideshow!`,
}

function findBestMatch(userMessage: string): string {
  const lowercaseMessage = userMessage.toLowerCase()

  // Check for exact or partial matches
  for (const [key, response] of Object.entries(HARDCODED_RESPONSES)) {
    if (key !== "default" && lowercaseMessage.includes(key)) {
      return response
    }
  }

  return HARDCODED_RESPONSES.default
}

export async function POST(req: Request) {
  const { messages }: { messages: any[] } = await req.json()

  // Get the last user message
  const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || ""

  // Find the best hardcoded response
  const response = findBestMatch(lastUserMessage)

  // Simulate streaming by chunking the response
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Send the response in chunks to simulate streaming
      const chunks = response.split(" ")
      for (let i = 0; i < chunks.length; i++) {
        const chunk = (i === 0 ? "" : " ") + chunks[i]
        const data = `0:${JSON.stringify(chunk)}\n`
        controller.enqueue(encoder.encode(data))
        // Small delay to simulate streaming
        await new Promise((resolve) => setTimeout(resolve, 20))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Vercel-AI-Data-Stream": "v1",
    },
  })
}
