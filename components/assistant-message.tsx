"use client"

import { useMemo } from "react"
import StreamingAssistant, { StaticAssistantBullets } from "./streaming-assistant"

interface AssistantMessageProps {
  parts: any[]
  isCurrentAssistant: boolean
  streamActive: boolean
}

function partsToText(parts: any[]): string {
  return (parts || [])
    .map((p: any) => (p?.type === "text" ? p.text : ""))
    .join("")
    .trim()
}

export default function AssistantMessage({ parts, isCurrentAssistant, streamActive }: AssistantMessageProps) {
  const fullText = useMemo(() => partsToText(parts), [parts])

  if (isCurrentAssistant) {
    // Stream from the first character. If a response arrives all at once, animate once.
    return <StreamingAssistant fullText={fullText} streamActive={streamActive} animateIfCompleteOnMount />
  }
  return <StaticAssistantBullets text={fullText} />
}
