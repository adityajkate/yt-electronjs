// src/main/services/lrclib.ts
import type { LyricsResult, LyricLine } from '../../shared/types'

const LRCLIB_BASE = 'https://lrclib.net/api'

async function fetchFromLRCLIB(path: string): Promise<any> {
  const response = await fetch(`${LRCLIB_BASE}${path}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(`LRCLIB HTTP ${response.status}`)
  }
  return response.json()
}

function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = []
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/
  for (const line of lrc.split('\n')) {
    const match = line.match(regex)
    if (match) {
      const min = parseInt(match[1], 10)
      const sec = parseInt(match[2], 10)
      let ms = parseInt(match[3], 10)
      if (match[3].length === 2) ms *= 10 // handle centiseconds
      const time = min * 60 + sec + ms / 1000
      const text = match[4].trim()
      if (text) lines.push({ time: Math.round(time * 100) / 100, text })
    }
  }
  return lines
}

export async function searchLyrics(artist: string, title: string): Promise<LyricsResult | null> {
  try {
    const encodedArtist = encodeURIComponent(artist)
    const encodedTitle = encodeURIComponent(title)
    const data = await fetchFromLRCLIB(`/get?artist_name=${encodedArtist}&track_name=${encodedTitle}`)

    if (!data) return null

    // Check for synced lyrics first
    if (data.syncedLyrics) {
      return { synced: parseLrc(data.syncedLyrics), plain: data.plainLyrics || undefined }
    }

    // Fall back to plain lyrics
    if (data.plainLyrics) {
      return {
        synced: [],
        plain: data.plainLyrics,
      }
    }

    return null
  } catch {
    return null // fail silently — lyrics are non-critical
  }
}
