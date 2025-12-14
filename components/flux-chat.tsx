"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Bot, Send, Sparkles, Images, Loader2, ChevronDown } from "lucide-react"
import Slideshow from "./slideshow"
import AssistantMessage from "./assistant-message"
import { addChat } from "@/lib/chat-history"

type SlidePlan = {
  title: string
  query: string
  bullets: string[]
  narration: string
  imageUrl?: string | null
  imageAlt?: string | null
  credit?: string | null
  link?: string | null
}

export default function FluxChat() {
  // Always-mounted input to avoid focus loss
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [hasStarted, setHasStarted] = useState(false)

  const [showSlideshow, setShowSlideshow] = useState(false)
  const [slides, setSlides] = useState<SlidePlan[] | null>(null)
  const [narrate, setNarrate] = useState(true)
  const [isPlanning, setIsPlanning] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })

  const isStreaming = status === "submitted" || status === "streaming"

  const lastUserMessage = useMemo(() => [...messages].reverse().find((m) => m.role === "user"), [messages])
  const lastAssistantMessage = useMemo(() => [...messages].reverse().find((m) => m.role === "assistant"), [messages])

  // Track when a conversation result is completed to add to history
  const savedForIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!isStreaming && lastUserMessage && lastAssistantMessage) {
      if (savedForIdRef.current !== lastAssistantMessage.id) {
        const title =
          (lastUserMessage.parts || [])
            .map((p: any) => (p.type === "text" ? p.text : ""))
            .join("")
            .trim() || "New chat"
        addChat(title)
        savedForIdRef.current = lastAssistantMessage.id
      }
    }
  }, [isStreaming, lastUserMessage, lastAssistantMessage])

  // Scroll tracking for “scroll to latest”
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

  // Only auto-scroll if already near the bottom
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const threshold = 120
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    if (atBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    }
  }, [messages, isPlanning, status])

  function scrollToBottom() {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }

  async function planAndShowSlideshow() {
    try {
      if (!lastAssistantMessage) return
      setIsPlanning(true)

      const assistantText = (lastAssistantMessage.parts || [])
        .map((p: any) => (p.type === "text" ? p.text : ""))
        .join("\n")
        .trim()

      const questionText = lastUserMessage
        ? (lastUserMessage.parts || [])
            .map((p: any) => (p.type === "text" ? p.text : ""))
            .join("\n")
            .trim()
        : ""

      const res = await fetch("/api/slideshow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText, answer: assistantText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to make slideshow plan")
      const plannedSlides: SlidePlan[] = data.slides

      const imgRes = await fetch("/api/pixabay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries: plannedSlides.map((s) => ({ query: s.query })) }),
      })
      const imgData = await imgRes.json()
      if (!imgRes.ok) throw new Error(imgData.error || "Failed to fetch images")

      const images = imgData.images as {
        query: string
        url: string | null
        alt: string | null
        credit?: string | null
        link?: string | null
      }[]

      const merged = plannedSlides.map((s, idx) => ({
        ...s,
        imageUrl: images[idx]?.url ?? null,
        imageAlt: images[idx]?.alt ?? s.query,
        credit: images[idx]?.credit ?? null,
        link: images[idx]?.link ?? null,
      }))

      setSlides(merged)
      setShowSlideshow(true)
    } catch (e: any) {
      console.error(e)
      alert(e?.message ?? "Failed to build slideshow")
    } finally {
      setIsPlanning(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || isStreaming) return
    sendMessage({ text })
    setHasStarted(true)
    setDraft("")
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }))
  }

  return (
    <div className="relative h-full w-full">
      {/* Header */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-auto">
        <div>
          <h1 className="text-3xl text-white font-normal tracking-normal">Cluter AI</h1>
          <p className="text-gray-400 text-sm mt-1 tracking-normal">AI solutions with narration</p>
        </div>
      </div>

      {/* Messages panel fills between header and input, with separate CTA footer */}
      {hasStarted && (
        <div className="absolute inset-x-0 top-[96px] bottom-[120px] flex justify-center px-4">
          <Card className="w-full max-w-4xl bg-black/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg pointer-events-auto">
            <CardContent className="p-0 h-full flex flex-col">
              {/* Scrollable messages area */}
              <div ref={listRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-3">
                {messages.map((m) => {
                  const isCurrentAssistant = m.role === "assistant" && m.id === lastAssistantMessage?.id
                  const text = (m.parts || []).map((p: any) => (p.type === "text" ? p.text : "")).join("")
                  return (
                    <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                      {m.role !== "user" && (
                        <Avatar className="h-8 w-8 bg-white/5 border border-white/10">
                          <AvatarFallback className="bg-transparent text-white">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                          m.role === "user" ? "bg-white text-black" : "bg-white/5 text-white border border-white/10",
                        )}
                      >
                        {m.role === "assistant" ? (
                          <AssistantMessage
                            parts={m.parts || []}
                            isCurrentAssistant={isCurrentAssistant}
                            streamActive={isStreaming && isCurrentAssistant}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{text}</p>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Scroll-to-bottom helper */}
                {showScrollToBottom && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={scrollToBottom}
                      className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-full px-2 py-1 border border-white/20"
                    >
                      <ChevronDown className="h-3 w-3" /> New reply
                    </button>
                  </div>
                )}
              </div>

              {/* Dedicated CTA footer (no overlay on content) */}
              {!isStreaming && lastAssistantMessage && (
                <div className="border-t border-white/10 px-3 py-2 bg-black/40 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                    <Images className="h-4 w-4 text-white/80" />
                    <span className="text-white/90 text-sm">Narrate this as a slideshow?</span>
                    <Button
                      size="sm"
                      className="h-8 rounded-full bg-white text-black hover:bg-gray-200"
                      onClick={planAndShowSlideshow}
                      disabled={isPlanning}
                    >
                      {isPlanning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Preparing
                        </>
                      ) : (
                        <>
                          Yes <Sparkles className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"
                    >
                      No
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Single always-mounted Input Bar (center to bottom) */}
      <form
        onSubmit={handleSubmit}
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
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={hasStarted ? "Ask another question..." : "Ask Cluter AI anything..."}
                className="flex-1 bg-transparent border-white/20 text-white placeholder:text-white/50"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <Button
                type="submit"
                className="rounded-full bg-white text-black hover:bg-gray-200"
                disabled={isStreaming || !draft.trim()}
              >
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Slideshow overlay */}
      <Slideshow
        open={showSlideshow}
        onClose={() => setShowSlideshow(false)}
        slides={slides || []}
        autoNarrate={narrate}
      />
    </div>
  )
}
