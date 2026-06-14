// src/main/services/yt-dlp.ts
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import type { Track } from '../../shared/types'

function getBinaryPath(): string {
  // In development, use system yt-dlp; in production, use bundled binary
  if (app.isPackaged) {
    const platform = process.platform
    const binaryName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
    return path.join(process.resourcesPath, 'yt-dlp', binaryName)
  }
  return 'yt-dlp' // assume on PATH during dev
}

export interface YtDlpProgress {
  percent: number
  speed?: string
  eta?: string
}

export type YtDlpEvent = { type: 'progress'; data: YtDlpProgress } | { type: 'error'; message: string } | { type: 'complete'; filePath: string }

export function extractAudio(
  videoId: string,
  outputDir: string,
  quality: 'low' | 'medium' | 'high' = 'medium',
  onEvent?: (event: YtDlpEvent) => void
): { abort: () => void } {
  const binaryPath = getBinaryPath()
  const outputTemplate = path.join(outputDir, `%(id)s.%(ext)s`)

  const qualityMap: Record<string, string> = {
    low: 'bestaudio[abr<=128]',
    medium: 'bestaudio[abr<=256]',
    high: 'bestaudio',
  }

  const format = qualityMap[quality] || qualityMap.medium

  const args = [
    `https://www.youtube.com/watch?v=${videoId}`,
    '-f', format,
    '-o', outputTemplate,
    '--no-playlist',
    '--no-warnings',
    '--progress',
    '--newline',
  ]

  const proc = spawn(binaryPath, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  proc.stderr?.on('data', (data: Buffer) => {
    const text = data.toString().trim()
    if (!text) return
    // Progress lines: [download]  45.2% of 3.45MiB at 1.23MiB/s ETA 00:02
    const progressMatch = text.match(/(\d+\.?\d*)%/)
    if (progressMatch) {
      onEvent?.({ type: 'progress', data: { percent: parseFloat(progressMatch[1]) } })
    } else if (text.includes('ERROR')) {
      onEvent?.({ type: 'error', message: text })
    }
  })

  proc.on('close', (code) => {
    if (code === 0) {
      // Scan outputDir for the downloaded file — match any extension
      const files = fs.readdirSync(outputDir)
      const match = files.find((f) => f.startsWith(videoId + '.'))
      if (match) {
        const filePath = path.join(outputDir, match)
        onEvent?.({ type: 'complete', filePath })
      } else {
        onEvent?.({ type: 'error', message: 'Download completed but file not found on disk' })
      }
    } else if (code !== 0) {
      onEvent?.({ type: 'error', message: `yt-dlp exited with code ${code}` })
    }
  })

  proc.on('error', (err) => onEvent?.({ type: 'error', message: `Failed to start yt-dlp: ${err.message}` }))

  return { abort: () => proc.kill() }
}

export function getStreamOutputPath(videoId: string, outputDir: string): string {
  const candidates = ['.m4a', '.webm', '.aac', '.mp3', '.opus']
  for (const ext of candidates) {
    const p = path.join(outputDir, `${videoId}${ext}`)
    if (fs.existsSync(p)) return p
  }
  return path.join(outputDir, `${videoId}.m4a`)
}

function cleanYtTitle(title: string): { title: string; artist?: string } {
  // Remove common YouTube suffixes
  let cleaned = title
    .replace(/\s*\(Official\s+(Video|Audio|Music\s*Video|Lyrics?|Visualizer|MV|4K|HD)\)/gi, '')
    .replace(/\s*\(Lyrics?\)/gi, '')
    .replace(/\s*\(Audio\)/gi, '')
    .replace(/\s*\(feat\..*?\)/gi, '')
    .replace(/\s*\(Ft\..*?\)/gi, '')
    .replace(/\[Official\s+(Video|Audio|Music\s*Video|Lyrics?|Visualizer|MV)\]/gi, '')
    .replace(/\s*\|.*$/, '')
    .trim()

  // If title is "Artist - Song name" format, extract artist
  const artistMatch = cleaned.match(/^([^-]+)\s*-\s*(.+)/)
  if (artistMatch) {
    return { artist: artistMatch[1].trim(), title: artistMatch[2].trim() }
  }

  return { title: cleaned }
}

export async function searchYoutube(query: string, maxResults = 10): Promise<Track[]> {
  const binaryPath = getBinaryPath()
  const searchQuery = `ytsearch${maxResults}:${query}`

  return new Promise((resolve, reject) => {
    const proc = spawn(binaryPath, [searchQuery, '--dump-json', '--no-warnings', '--flat-playlist'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''

    proc.stdout?.on('data', (data: Buffer) => { stdout += data.toString() })
    proc.stderr?.on('data', (data: Buffer) => { stderr += data.toString() })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `yt-dlp exited with code ${code}`))
        return
      }

      const tracks: Track[] = stdout.trim().split('\n').filter(Boolean).map((line) => {
        try {
          const item = JSON.parse(line)
          const channel = item.channel || item.uploader || ''
          const { title: cleanTitle, artist: extractedArtist } = cleanYtTitle(item.title || '')

          // Prefer the artist extracted from "Artist - Song" title format
          // Otherwise fall back to channel name
          const artist = extractedArtist || channel || 'Unknown'

          return {
            id: item.id,
            title: cleanTitle,
            artist,
            duration: item.duration || 0,
            thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
            albumArt: `https://i.ytimg.com/vi/${item.id}/maxresdefault.jpg`,
          }
        } catch {
          return null
        }
      }).filter(Boolean) as Track[]

      resolve(tracks)
    })

    proc.on('error', (err) => reject(new Error(`Failed to start yt-dlp: ${err.message}`)))
  })
}

export function getCacheDir(): string {
  const dir = path.join(app.getPath('userData'), 'cache')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function getDownloadDir(): string {
  const configured = app.isPackaged
    ? path.join(app.getPath('userData'), 'downloads')
    : path.join(app.getPath('home'), 'YoutubeMusicDownloads')
  if (!fs.existsSync(configured)) fs.mkdirSync(configured, { recursive: true })
  return configured
}
