// src/renderer/src/components/LyricsPanel.tsx
import { useState, useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import { currentTrackAtom, playerAtom } from '../stores/player'
import type { LyricsResult } from '@shared/types'

export default function LyricsPanel() {
  const [track] = useAtom(currentTrackAtom)
  const [player] = useAtom(playerAtom)
  const [lyrics, setLyrics] = useState<LyricsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const activeLineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!track) { setLyrics(null); return }
    setLoading(true)
    const api = (window as any).electronAPI
    if (!api) return
    api.getLyrics(track.artist, track.title).then((result: LyricsResult | null) => {
      setLyrics(result)
      setLoading(false)
    })
  }, [track?.id])

  const activeIndex = lyrics?.synced
    ? lyrics.synced.findLastIndex((line) => line.time <= player.currentTime)
    : -1

  useEffect(() => {
    if (activeIndex >= 0 && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeIndex])

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-4 bg-border rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
        ))}
      </div>
    )
  }

  if (!lyrics || (!lyrics.synced.length && !lyrics.plain)) {
    return <div className="text-center py-12"><p className="text-sm text-text-muted">No lyrics found</p></div>
  }

  if (lyrics.plain && !lyrics.synced.length) {
    return <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{lyrics.plain}</div>
  }

  return (
    <div className="space-y-3">
      {lyrics.synced.map((line, i) => (
        <div
          key={i}
          ref={i === activeIndex ? activeLineRef : undefined}
          className={`transition-all duration-300 ${
            i === activeIndex
              ? 'text-text-primary text-base font-medium'
              : 'text-text-muted text-sm'
          }`}
        >
          {line.text}
        </div>
      ))}
    </div>
  )
}
