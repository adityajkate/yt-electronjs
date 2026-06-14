// src/main/services/lrclib.ts
import https from 'https'
import type { LyricsResult, LyricLine } from '../../shared/types'

const LRCLIB_BASE = 'lrclib.net'

function httpsGet(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      {
        hostname: LRCLIB_BASE,
        path,
        headers: { Accept: 'application/json' },
        timeout: 8000,
      },
      (res) => {
        let data = ''
        res.on('data', (chunk: Buffer) => { data += chunk.toString() })
        res.on('end', () => {
          if (res.statusCode === 404) return resolve(null)
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`LRCLIB HTTP ${res.statusCode}`))
          }
          try {
            resolve(JSON.parse(data))
          } catch {
            reject(new Error('Invalid JSON from LRCLIB'))
          }
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('LRCLIB timeout')) })
  })
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

function titleSimilarity(a: string, b: string): number {
  const aClean = cleanTitle(a).toLowerCase()
  const bClean = cleanTitle(b).toLowerCase()
  if (aClean === bClean) return 1
  if (aClean.includes(bClean) || bClean.includes(aClean)) return 0.8
  const aWords = aClean.split(/\s+/)
  const bWords = bClean.split(/\s+/)
  const common = aWords.filter((w) => bWords.includes(w)).length
  return common / Math.max(aWords.length, bWords.length)
}

export async function searchLyrics(artist: string, title: string): Promise<LyricsResult | null> {
  try {
    const encodedArtist = encodeURIComponent(artist)
    const encodedTitle = encodeURIComponent(cleanTitle(title) || title)
    const data = await httpsGet(`/api/search?artist_name=${encodedArtist}&track_name=${encodedTitle}`)

    if (!data) return null

    const results = Array.isArray(data) ? data : [data]
    if (results.length === 0) return null

    const scored = results.map((r: any) => ({
      result: r,
      score: titleSimilarity(title, r.trackName || r.name || ''),
    }))
    scored.sort((a: any, b: any) => b.score - a.score)
    const best = scored[0]

    if (best.score < 0.3) return null

    const match = best.result

    if (match.syncedLyrics) {
      return { synced: parseLrc(match.syncedLyrics), plain: match.plainLyrics || undefined }
    }

    if (match.plainLyrics) {
      return { synced: [], plain: match.plainLyrics }
    }

    return null
  } catch {
    return null
  }
}
