import { z } from "zod"

export const maxDuration = 60

const SlideSchema = z.object({
  title: z.string().min(1).max(80),
  query: z.string().min(1).max(120),
  bullets: z.array(z.string().min(1).max(140)).min(2).max(5),
  narration: z.string().min(1).max(360),
})
const SlidesSchema = z.array(SlideSchema).min(3).max(6)

const HARDCODED_SLIDESHOWS: Record<string, any[]> = {
  "how to fix car tyre": [
    {
      title: "Safety First",
      query: "car hazard lights safety",
      bullets: [
        "Pull over to a safe, flat location away from traffic",
        "Turn on hazard lights and engage parking brake",
        "Place wheel wedges behind tires to prevent rolling",
      ],
      narration:
        "Before you start, safety is paramount. Find a safe spot away from traffic, turn on your hazard lights, and make sure your car won't move by engaging the parking brake and using wheel wedges.",
    },
    {
      title: "Gather Your Tools",
      query: "car jack tire tools kit",
      bullets: [
        "Spare tire (check if it's properly inflated)",
        "Car jack and lug wrench",
        "Gloves and flashlight if needed",
      ],
      narration:
        "Make sure you have all the necessary tools ready. You'll need a spare tire, a jack to lift your car, a lug wrench to remove bolts, and optionally gloves for a cleaner grip.",
    },
    {
      title: "Loosen Lug Nuts",
      query: "loosening car lug nuts wrench",
      bullets: [
        "Use the lug wrench to turn nuts counterclockwise",
        "Loosen them while the tire is still on the ground",
        "Don't remove completely yet - just break the resistance",
      ],
      narration:
        "Before lifting the car, loosen the lug nuts by turning them counterclockwise. It's easier to do this while the tire is on the ground since the wheel won't spin freely.",
    },
    {
      title: "Jack Up the Car",
      query: "car jack lifting vehicle",
      bullets: [
        "Position jack under the car frame near flat tire",
        "Raise the car until tire is 6 inches off ground",
        "Ensure the jack is stable before proceeding",
      ],
      narration:
        "Place the jack under your car's frame at the proper lift point. Slowly raise the vehicle until the flat tire is about six inches off the ground, making sure everything is stable.",
    },
    {
      title: "Replace the Tire",
      query: "changing car spare tire wheel",
      bullets: [
        "Remove lug nuts completely and pull off flat tire",
        "Align spare tire with wheel bolts and push into place",
        "Hand-tighten lug nuts in a star pattern",
      ],
      narration:
        "Now remove the flat tire completely and mount your spare. Make sure it's properly aligned with the bolts, then hand-tighten the lug nuts in a star pattern for even distribution.",
    },
    {
      title: "Lower and Finish",
      query: "tightening car wheel lug nuts",
      bullets: [
        "Lower car partially and tighten lug nuts fully",
        "Lower completely, remove jack, and do final tightening",
        "Check spare tire pressure and drive carefully to a shop",
      ],
      narration:
        "Lower the car slightly and use the wrench to fully tighten the lug nuts. Then lower completely, remove the jack, and give the nuts a final tightening. Remember, spares are temporary - drive carefully!",
    },
  ],
  default: [
    {
      title: "Welcome to Flux AI",
      query: "modern ai assistant interface",
      bullets: [
        "I'm your helpful AI assistant for explanations",
        "Ask me any how-to question",
        "I'll create visual slideshows for you",
      ],
      narration:
        "Welcome! I'm Flux AI, designed to help you understand complex topics through clear explanations and beautiful slideshows. Try asking me a question!",
    },
    {
      title: "How It Works",
      query: "interactive learning presentation",
      bullets: [
        "Type your question in the chat",
        "I'll provide a detailed answer",
        "Click 'Narrate as slideshow' for visual learning",
      ],
      narration:
        "Using Flux AI is simple. Just type your question, and I'll give you a comprehensive answer. For a more engaging experience, you can turn any answer into a visual slideshow.",
    },
    {
      title: "Example Topics",
      query: "education learning topics variety",
      bullets: [
        "DIY and repairs: fixing things, maintenance",
        "Cooking and recipes: baking, meal prep",
        "Study tips and productivity hacks",
        "Technology tutorials and troubleshooting",
      ],
      narration:
        "I can help with a wide variety of topics including DIY repairs, cooking instructions, study techniques, and technology tips. Whatever you need to learn, just ask!",
    },
  ],
}

function findBestMatchSlideshow(userMessage: string): any[] {
  const lowercaseMessage = userMessage.toLowerCase()

  for (const [key, slides] of Object.entries(HARDCODED_SLIDESHOWS)) {
    if (key !== "default" && lowercaseMessage.includes(key)) {
      return slides
    }
  }

  return HARDCODED_SLIDESHOWS.default
}

export async function POST(req: Request) {
  try {
    const { question }: { question: string; answer: string } = await req.json()

    const slides = findBestMatchSlideshow(question)

    return new Response(JSON.stringify({ slides }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (e: any) {
    console.error("[v0] Slideshow error:", e?.message)
    return new Response(JSON.stringify({ error: e?.message ?? "Failed to create slideshow" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
