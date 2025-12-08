export async function readSSEStream(stream: ReadableStream<Uint8Array>, onText: (chunk: string) => void) {
  const decoder = new TextDecoder()
  const reader = stream.getReader()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // Split Server-Sent Events lines
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      // Ignore comments/keep-alives
      if (!line || line.startsWith(":")) continue
      // Only parse data: lines
      if (line.startsWith("data:")) {
        const data = line.slice(5).trimStart()
        // Some implementations send JSON chunks; others send plain text
        try {
          const parsed = JSON.parse(data)
          if (typeof parsed === "string") onText(parsed)
          else if (typeof parsed?.text === "string") onText(parsed.text)
          else if (typeof parsed?.delta === "string") onText(parsed.delta)
          else if (typeof parsed?.content === "string") onText(parsed.content)
          else onText(data)
        } catch {
          onText(data)
        }
      }
    }
  }
  // Flush trailing buffer if present (best-effort)
  if (buffer.trim()) {
    onText(buffer.trim())
  }
}
