"use client"

import { useEffect, useMemo, useRef, useState } from "react"

interface TypewriterLinesProps {
  lines: string[]
  charDelayMs?: number
  lineDelayMs?: number
  disabled?: boolean
  className?: string
}

export default function TypewriterLines({
  lines,
  charDelayMs = 15,
  lineDelayMs = 120,
  disabled = false,
  className,
}: TypewriterLinesProps) {
  const [visible, setVisible] = useState<string[]>(lines.map(() => ""))
  const timers = useRef<number[]>([])

  useEffect(() => {
    // Reset for new content
    setVisible(lines.map(() => ""))
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []

    if (disabled) {
      // Instantly show all lines
      setVisible([...lines])
      return
    }

    let cumulativeDelay = 0
    lines.forEach((line, idx) => {
      // Start time for this line's typing
      const start = cumulativeDelay
      const duration = Math.max(1, line.length) * charDelayMs
      cumulativeDelay += duration + lineDelayMs

      const startTimer = window.setTimeout(() => {
        // Type characters
        let i = 0
        const tick = () => {
          i++
          setVisible((prev) => {
            const copy = [...prev]
            copy[idx] = line.slice(0, i)
            return copy
          })
          if (i < line.length) {
            timers.current[idx] = window.setTimeout(tick, charDelayMs)
          }
        }
        tick()
      }, start)

      timers.current.push(startTimer)
    })

    return () => {
      timers.current.forEach((t) => clearTimeout(t))
      timers.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.join("\n"), disabled, charDelayMs, lineDelayMs])

  return (
    <ul className={className}>
      {visible.map((txt, i) => (
        <li key={i} className="whitespace-pre-wrap break-words leading-relaxed">
          {txt}
        </li>
      ))}
    </ul>
  )
}
