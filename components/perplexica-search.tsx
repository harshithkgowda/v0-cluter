"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, Send, LinkIcon, Sparkles, ChevronDown, Loader2 } from "lucide-react"
import { readSSEStream } from "@/lib/sse"
import { cn } from "@/lib/utils"

type Source = { title?: string; url?: string; snippet?: string }
type Related = { text: string }

type PerplexicaAnswer = {
  answer?: string
  sources?: Source[]
  related?: Related[] | string[]
}

export default function PerplexicaSearch() {
  const [q, setQ] = useState("")
  const [hasStarted, setHasStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [answer, setAnswer] = useState("")
  const [sources, setSources] = useState<Source[]>([])
  const [related, setRelated] = useState<Related[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)

  // Scroll helper
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const onScroll = () => {
      const threshold = 80
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
      setShowScrollToBottom(!atBottom)
    }
    el.addEventListener("scroll", onScroll)
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const threshold = 120
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    if (atBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    }
  }, [answer, isLoading, sources.length, related.length])

  function scrollToBottom() {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }

  async function runQuery(query: string) {
    if (!query.trim() || isLoading) return
    setHasStarted(true)
    setIsLoading(true)
    setAnswer("")
    setSources([])
    setRelated([])

    try {
      // First try a streaming endpoint (common patterns: /api/search or /api/ask)
      const res = await fetch("/api/perplexica/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      const ctype = res.headers.get("content-type") || ""
      // SSE stream
      if (ctype.includes("text/event-stream")) {
        if (!res.body) throw new Error("No response body")
        await readSSEStream(res.body, (chunk) => setAnswer((prev) => prev + chunk))
      } else if (ctype.includes("application/json")) {
        const data: PerplexicaAnswer = await res.json()
        setAnswer(data.answer || "")
        if (Array.isArray(data.sources)) setSources(data.sources)
        if (Array.isArray(data.related)) {
          const rel = (data.related as any[]).map((r) => (typeof r === "string" ? { text: r } : r))
          setRelated(rel)
        }
      } else {
        // Fallback to text body
        const text = await res.text()
        setAnswer(text)
      }
    } catch (e: any) {
      console.error(e)
      setAnswer(e?.message || "Failed to fetch from Perplexica")
    } finally {
      setIsLoading(false)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    runQuery(q)
  }

  function askRelated(text: string) {
    setQ(text)
    runQuery(text)
  }

  return (
    <div className="relative h-full w-full">
      {/* Header (Cluter AI styling) */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-auto">
        <div>
          <h1 className="text-3xl text-white font-normal tracking-normal">Cluter AI</h1>
          <p className="text-gray-400 text-sm mt-1 tracking-normal">Perplexica-powered answers with citations</p>
        </div>
      </div>

      {/* Main content card */}
      {hasStarted && (
        <div className="absolute inset-x-0 top-[96px] bottom-[120px] flex justify-center px-4">
          <Card className="w-full max-w-4xl bg-black/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg pointer-events-auto">
            <CardContent className="p-0 h-full flex flex-col">
              <div ref={listRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">
                {/* Question bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-2 bg-white text-black text-sm">
                    {q}
                  </div>
                </div>

                {/* Answer bubble (streaming) */}
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 bg-white/5 border border-white/10">
                    <AvatarFallback className="bg-transparent text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-white/5 text-white border border-white/10 whitespace-pre-wrap break-words">
                    {answer || (isLoading ? "Thinking..." : "")}
                  </div>
                </div>

                {/* Sources/citations */}
                {sources.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs uppercase tracking-wider text-white/60 mb-2">Sources</div>
                    <ul className="grid gap-2">
                      {sources.map((s, idx) => (
                        <li key={idx} className="text-sm">
                          <a
                            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 underline underline-offset-2"
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <LinkIcon className="h-4 w-4" />
                            <span>{s.title || s.url || "Source"}</span>
                          </a>
                          {s.snippet ? <div className="text-white/70 text-xs mt-1">{s.snippet}</div> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Related */}
                {related.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs uppercase tracking-wider text-white/60 mb-2">Related</div>
                    <div className="flex flex-wrap gap-2">
                      {related.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => askRelated(r.text)}
                          className="text-xs bg-white/10 hover:bg-white/20 text-white rounded-full px-3 py-1 border border-white/20"
                        >
                          {r.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scroll helper */}
                {showScrollToBottom && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={scrollToBottom}
                      className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-full px-2 py-1 border border-white/20"
                    >
                      <ChevronDown className="h-3 w-3" /> New content
                    </button>
                  </div>
                )}
              </div>

              {/* CTA footer (optional extensions) */}
              <div className="border-t border-white/10 px-3 py-2 bg-black/40 flex items-center justify-center">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                  <Sparkles className="h-4 w-4 text-white/80" />
                  <span className="text-white/90 text-sm">Enhance with slideshow narration</span>
                  <Button
                    size="sm"
                    className="h-8 rounded-full bg-white text-black hover:bg-gray-200"
                    onClick={() => alert("Hook up your existing slideshow flow here.")}
                  >
                    Try
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={onSubmit}
        className={cn(
          "pointer-events-auto transition-all duration-300",
          !hasStarted
            ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] sm:w-[560px]"
            : "absolute left-1/2 bottom-6 -translate-x-1/2 w-[92vw] max-w-4xl px-4 sm:px-0",
        )}
      >
        <div className="bg-black/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg">
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={hasStarted ? "Ask another question..." : "Ask Cluter AI (Perplexica) anything..."}
                className="flex-1 bg-transparent border-white/20 text-white placeholder:text-white/50"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <Button
                type="submit"
                className="rounded-full bg-white text-black hover:bg-gray-200"
                disabled={!q.trim() || isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
