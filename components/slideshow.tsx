"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Pause, Play, SkipForward, SkipBack, Volume2, VolumeX, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"

type Slide = {
  title: string
  bullets: string[]
  narration: string
  imageUrl?: string | null
  imageAlt?: string | null
  credit?: string | null
  link?: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  slides: Slide[]
  autoNarrate?: boolean
}

function pickFriendlyVoice(voices: SpeechSynthesisVoice[]) {
  const preferred = [
    "Google US English",
    "Google UK English Female",
    "Samantha",
    "Victoria",
    "Alex",
    "Microsoft Aria Online (Natural) - English (United States)",
  ]
  for (const p of preferred) {
    const v = voices.find((vv) => vv.name.includes(p))
    if (v) return v
  }
  return voices[0]
}

export default function Slideshow({ open, onClose, slides, autoNarrate = true }: Props) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(!autoNarrate)
  const [durationMs, setDurationMs] = useState(8000) // 8s per slide
  const timerRef = useRef<number | null>(null)
  const current = slides[index]
  const total = slides.length
  const progress = useMemo(() => ((index + 1) / Math.max(total, 1)) * 100, [index, total])

  // Auto-advance timer
  useEffect(() => {
    if (!open || !playing) return
    timerRef.current = window.setTimeout(() => next(), durationMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [open, index, playing, durationMs])

  // Narration — speak title + narration (not raw bullets) for friendliness
  useEffect(() => {
    if (!open) return
    window.speechSynthesis.cancel()
    if (muted || !current) return

    const utter = new SpeechSynthesisUtterance()
    const title = current.title ? `${current.title}. ` : ""
    utter.text = `${title}${current.narration}`
    utter.rate = 0.95
    utter.pitch = 1.0
    utter.volume = 1.0

    const setupVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices && voices.length > 0) {
        utter.voice = pickFriendlyVoice(voices)
        window.speechSynthesis.speak(utter)
      } else {
        // Wait for voices if not yet loaded
        window.speechSynthesis.onvoiceschanged = () => {
          const vs = window.speechSynthesis.getVoices()
          utter.voice = pickFriendlyVoice(vs)
          window.speechSynthesis.speak(utter)
        }
      }
    }

    utter.onend = () => {
      if (playing && index < total - 1) next()
    }

    setupVoice()

    return () => {
      window.speechSynthesis.cancel()
    }
  }, [open, index, current, muted, total, playing])

  function next() {
    setIndex((i) => Math.min(i + 1, total - 1))
  }
  function prev() {
    setIndex((i) => Math.max(i - 1, 0))
  }

  useEffect(() => {
    if (!open) {
      window.speechSynthesis.cancel()
      if (timerRef.current) clearTimeout(timerRef.current)
      setIndex(0)
      setPlaying(true)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col">
      {/* Top bar */}
      <div className="pt-4 px-4 md:px-6 flex items-center justify-between">
        <div className="text-white">
          <h2 className="text-lg font-medium tracking-normal">Narrated Slideshow</h2>
          <div className="mt-1 h-1.5 w-[60vw] max-w-[320px] bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <Button
          variant="outline"
          className="rounded-full border-white/20 bg-black/40 text-white hover:bg-white/10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Slide area */}
      <div className="flex-1 w-full flex items-center justify-center px-4 pb-5">
        <div className="w-[96vw] md:w-[82vw] h-[58vh] md:h-[68vh] max-w-[1200px] relative rounded-2xl overflow-hidden border border-white/10 bg-black">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0.0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <img
                src={current?.imageUrl || "/abstract-dark-conceptual.png"}
                alt={current?.imageAlt || "slide image"}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50" />
              <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />

              {/* Content */}
              <div className="absolute inset-0 p-4 sm:p-6 md:p-8 flex flex-col justify-end text-white">
                <motion.h3
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.08 }}
                  className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight"
                >
                  {current?.title}
                </motion.h3>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[34vh] overflow-auto pr-1">
                  {(current?.bullets || []).map((b, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.12 + i * 0.05 }}
                      className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm md:text-base"
                    >
                      {b}
                    </motion.div>
                  ))}
                </div>

                {current?.credit && current?.link && (
                  <a
                    href={current.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-white/80 hover:text-white mt-3 text-xs"
                  >
                    Photo: {current.credit} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="pb-5 flex items-center justify-center">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
          <Button size="sm" variant="ghost" className="rounded-full text-white hover:bg-white/10" onClick={prev} disabled={index === 0} title="Previous">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="rounded-full text-white hover:bg-white/10" onClick={() => setPlaying((p) => !p)} title={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="ghost" className="rounded-full text-white hover:bg-white/10" onClick={next} disabled={index >= total - 1} title="Next">
            <SkipForward className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <Button size="sm" variant="ghost" className="rounded-full text-white hover:bg-white/10" onClick={() => setMuted((m) => !m)} title={muted ? "Unmute narration" : "Mute narration"}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <label className="text-xs text-white/70 mr-1 hidden md:block">Slide duration</label>
          <select className="bg-transparent text-white text-sm outline-none" value={durationMs} onChange={(e) => setDurationMs(Number(e.target.value))}>
            <option className="bg-black" value={6000}>6s</option>
            <option className="bg-black" value={8000}>8s</option>
            <option className="bg-black" value={10000}>10s</option>
          </select>
        </div>
      </div>
    </div>
  )
}
