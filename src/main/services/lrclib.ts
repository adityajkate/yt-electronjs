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
      if (match[3].length === 2) ms *= 10
      const time = min * 60 + sec + ms / 1000
      const text = match[4].trim()
      if (text) lines.push({ time: Math.round(time * 100) / 100, text })
    }
  }
  return lines
}

function cleanTitle(title: string): string {
  // Remove common YouTube suffixes: (Official Video), (Lyrics), (Audio), etc.
  return title
    .replace(/\s*\(Official\s+(Video|Audio|Music\s*Video|Lyrics?|Visualizer|MV)\)/gi, '')
    .replace(/\s*\(Lyrics?\)/gi, '')
    .replace(/\s*\(Audio\)/gi, '')
    .replace(/\s*\(feat\..*?\)/gi, '')
    .replace(/\s*\(Ft\..*?\)/gi, '')
    .replace(/\[Official\s+(Video|Audio|Music\s*Video|Lyrics?|Visualizer|MV)\]/gi, '')
    .replace(/\s*\|.*$/, '')
    .trim()
}

// Simple Levenshtein-like similarity: picks the best match from search results
function titleSimilarity(a: string, b: string): number {
  const aClean = cleanTitle(a).toLowerCase()
  const bClean = cleanTitle(b).toLowerCase()
  if (aClean === bClean) return 1
  if (aClean.includes(bClean) || bClean.includes(aClean)) return 0.8
  // Count matching words
  const aWords = aClean.split(/\s+/)
  const bWords = bClean.split(/\s+/)
  const common = aWords.filter(w => bWords.includes(w)).length
  return common / Math.max(aWords.length, bWords.length)
}

export async function searchLyrics(artist: string, title: string): Promise<LyricsResult | null> {
  try {
    // First try exact search via /search (fuzzy matching)
    const encodedArtist = encodeURIComponent(artist)
    const encodedTitle = encodeURIComponent(cleanTitle(title) || title)
    const data = await fetchFromLRCLIB(`/search?artist_name=${encodedArtist}&track_name=${encodedTitle}`)

    if (!data) return null

    // /search returns an array — find best match
    const results = Array.isArray(data) ? data : [data]
    if (results.length === 0) return null

    // Score each result by title similarity and pick the best
    const scored = results.map((r: any) => ({
      result: r,
      score: titleSimilarity(title, r.trackName || r.name || ''),
    }))
    scored.sort((a: any, b: any) => b.score - a.score)
    const best = scored[0]

    // If even the best match is terrible, bail
    if (best.score < 0.3) return null

    const match = best.result

    // Check for synced lyrics first
    if (match.syncedLyrics) {
      return { synced: parseLrc(match.syncedLyrics), plain: match.plainLyrics || undefined }
    }

    // Fall back to plain lyrics
    if (match.plainLyrics) {
      return { synced: [], plain: match.plainLyrics }
    }

    return null
  } catch {
    return null // fail silently — lyrics are non-critical
  }
}
