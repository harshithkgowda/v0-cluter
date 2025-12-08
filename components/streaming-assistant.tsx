"use client"

import { useEffect, useMemo, useRef, useState } from "react"

function splitToLines(text: string): string[] {
  // Normalize and split by newlines; treat bullet markers as separate lines
  const normalized = text.replace(/\r\n/g, "\n")
  const lines = normalized.split("\n")

  // Clean bullet markers, but keep line separation
  const bulletRegex = /^(\s*(?:[-*•]|(?:\d+[\.\)])))\s+/
  return lines
    .map((l) => l.replace(bulletRegex, "").trim())
    .filter((l) => l.length > 0)
}

// Renders bullets for a static, already-finished message.
export function StaticAssistantBullets({ text }: { text: string }) {
  const lines = useMemo(() => splitToLines(text), [text])
  if (lines.length === 0) return null
  return (
    <ul className="list-disc pl-4 space-y-1 marker:text-white/70">
      {lines.map((line, i) => (
        <li key={i} className="whitespace-pre-wrap break-words leading-relaxed">
          {line}
        </li>
      ))}
    </ul>
  )
}

interface StreamingAssistantProps {
  fullText: string
  streamActive: boolean
  charDelayMs?: number
  // If the message first appears already complete (very fast responses),
  // still animate from the beginning once.
  animateIfCompleteOnMount?: boolean
}

// Streams in characters as new content arrives. Lines are created progressively.
export default function StreamingAssistant({
  fullText,
  streamActive,
  charDelayMs = 15,
  animateIfCompleteOnMount = true,
}: StreamingAssistantProps) {
  const [displayed, setDisplayed] = useState("")
  const typingRef = useRef<number | null>(null)
  const queueRef = useRef<string>("") // characters waiting to type
  const prevFullRef = useRef<string>("") // last fullText we processed
  const didAnimateOnceRef = useRef<boolean>(false)

  // On first mount, if stream is not active but we have text,
  // animate it once to meet the "typewriter from the start" requirement.
  useEffect(() => {
    if (!streamActive && animateIfCompleteOnMount && !didAnimateOnceRef.current && fullText.length > 0) {
      didAnimateOnceRef.current = true
      prevFullRef.current = ""
      queueRef.current = fullText
      tick()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When fullText updates (streaming), enqueue only the delta.
  useEffect(() => {
    const prev = prevFullRef.current
    if (fullText.length > prev.length) {
      const delta = fullText.slice(prev.length)
      queueRef.current += delta
      prevFullRef.current = fullText
      if (!typingRef.current) {
        tick()
      }
    } else if (!streamActive && fullText.length < prev.length) {
      // If somehow fullText shrank, sync to it
      prevFullRef.current = fullText
      queueRef.current = ""
      setDisplayed(fullText)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullText, streamActive])

  function tick() {
    typingRef.current = window.setTimeout(() => {
      if (queueRef.current.length > 0) {
        const nextChar = queueRef.current[0]
        queueRef.current = queueRef.current.slice(1)
        setDisplayed((d) => d + nextChar)
        tick()
      } else {
        typingRef.current = null
        // If stream ended but we still have mismatch (rare), snap to fullText
        if (!streamActive && displayed !== fullText) {
          setDisplayed(fullText)
        }
      }
    }, charDelayMs)
  }

  useEffect(() => {
    return () => {
      if (typingRef.current) {
        clearTimeout(typingRef.current)
        typingRef.current = null
      }
    }
  }, [])

  // Derive lines from the currently displayed text so bullets appear as each line is formed
  const lines = useMemo(() => splitToLines(displayed), [displayed])

  return (
    <ul className="list-disc pl-4 space-y-1 marker:text-white/70">
      {lines.map((line, i) => (
        <li key={i} className="whitespace-pre-wrap break-words leading-relaxed">
          {line}
        </li>
      ))}
      {/* Caret only while actively streaming */}
      {streamActive && (
        <li className="list-none">
          <span className="inline-block w-2 h-4 bg-white/70 align-baseline animate-pulse" />
        </li>
      )}
    </ul>
  )
}
