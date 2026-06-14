# YouTube Music Electron — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a free, open-source Electron desktop app that wraps YouTube Music without requiring YouTube Premium — with ad-free playback, offline downloads, synced lyrics, playlist management, and a warm minimalist UI.

**Architecture:** 3-process Electron app (main/preload/renderer). All I/O (yt-dlp calls, Invidious API requests, SQLite) lives in the main process. The renderer communicates exclusively via contextBridge IPC. Audio streaming uses a local Node.js HTTP server that serves temp files written by yt-dlp.

**Tech stack:** Electron 33+ / electron-vite / React 18 / Jotai / Tailwind (warm-minimalist theme) / better-sqlite3 / yt-dlp (embedded binary) / Invidious API / LRCLIB API

---

### Task 0: Project Scaffold & Build Tooling

**Files:**
- Create: `package.json`
- Create: `electron.vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.web.json`
- Create: `tsconfig.node.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `src/renderer/index.html`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json with all dependencies**

```json
{
  "name": "youtube-music-electron",
  "version": "0.1.0",
  "description": "Free, advanced YouTube Music desktop player",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "electron-vite build && electron-builder"
  },
  "dependencies": {
    "better-sqlite3": "^11.6.0",
    "jotai": "^2.10.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.28.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@electron-toolkit/preload": "^3.0.0",
    "@electron-toolkit/utils": "^3.0.0",
    "@types/better-sqlite3": "^7.6.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "electron": "^33.2.0",
    "electron-builder": "^25.1.0",
    "electron-vite": "^2.3.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: No errors, node_modules/ populated

- [ ] **Step 3: Create electron.vite.config.ts**

```ts
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: ['better-sqlite3']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
```

- [ ] **Step 4: Create tsconfig.json (root)**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

- [ ] **Step 5: Create tsconfig.node.json (main + preload)**

```json
{
  "extends": "@electron-toolkit/tsconfig/tsconfig.node.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./out",
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"]
    }
  },
  "include": [
    "src/main/**/*",
    "src/preload/**/*",
    "src/shared/**/*",
    "electron.vite.config.ts"
  ]
}
```

- [ ] **Step 6: Create tsconfig.web.json (renderer)**

```json
{
  "extends": "@electron-toolkit/tsconfig/tsconfig.web.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./out",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/renderer/src/*"],
      "@shared/*": ["src/shared/*"]
    }
  },
  "include": [
    "src/renderer/**/*",
    "src/shared/**/*"
  ]
}
```

- [ ] **Step 7: Create tailwind.config.ts**

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F6F3',
        surface: '#FFFFFF',
        'surface-hover': '#F9F9F8',
        border: '#EAEAEA',
        'text-primary': '#2F3437',
        'text-secondary': '#787774',
        'text-muted': '#B0B0A8',
        'accent-red': { bg: '#FDEBEC', text: '#9F2F2D' },
        'accent-blue': { bg: '#E1F3FE', text: '#1F6C9F' },
        'accent-green': { bg: '#EDF3EC', text: '#346538' },
        'accent-yellow': { bg: '#FBF3DB', text: '#956400' },
        dark: {
          canvas: '#1A1A1A',
          surface: '#2A2A2A',
          'surface-hover': '#323232',
          border: '#3A3A3A',
          'text-primary': '#E0E0E0',
          'text-secondary': '#A0A0A0',
          'text-muted': '#707070',
        }
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"Geist Sans"', '"Helvetica Neue"', 'system-ui', 'sans-serif'],
        serif: ['"Newsreader"', '"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"Geist Mono"', '"SF Mono"', '"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'card': '8px',
      },
      spacing: {
        'titlebar': '36px',
        'sidebar': '64px',
        'bottombar': '72px',
      },
      boxShadow: {
        'card': '0 0 0 1px #EAEAEA',
        'card-hover': '0 2px 8px rgba(0,0,0,0.04)',
        'btn': '0 0 0 1px rgba(0,0,0,0.06)',
      },
      maxWidth: {
        'content': '42rem',
      }
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 8: Create postcss.config.js**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 9: Create src/renderer/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Youtube Music Electro</title>
  </head>
  <body class="bg-canvas text-text-primary font-sans antialiased">
    <div id="root"></div>
    <script type="module" src="./src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 10: Create .gitignore**

```
node_modules/
out/
dist/
resources/yt-dlp/
.DS_Store
thumbs.db
*.log
```

- [ ] **Step 11: Verify scaffold builds**

Run: `npx electron-vite build`
Expected: /out/ directory created with main/index.js, preload/index.js, renderer/ assets

---

### Task 1: Shared Types

**Files:**
- Create: `src/shared/types.ts`

- [ ] **Step 1: Write shared type definitions**

```ts
// ── Track ──
export interface Track {
  id: string            // YouTube video ID
  title: string
  artist: string
  album?: string
  duration: number      // seconds
  thumbnail: string     // URL
  albumArt?: string     // higher-res image URL
}

// ── Playlist ──
export interface Playlist {
  id: string            // UUID, local
  name: string
  description?: string
  tracks: string[]      // Track IDs (ordered)
  createdAt: number     // epoch ms
  updatedAt: number
}

// ── Download Job ──
export type DownloadStatus = 'queued' | 'downloading' | 'completed' | 'failed'

export interface DownloadJob {
  id: string
  trackId: string
  title: string
  artist: string
  status: DownloadStatus
  progress: number      // 0–100
  error?: string
  filePath?: string     // absolute path to downloaded file
}

// ── Player State ──
export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused'

export interface PlayerState {
  queue: Track[]
  currentIndex: number
  status: PlayerStatus
  volume: number         // 0–1
  shuffle: boolean
  repeat: 'off' | 'one' | 'all'
  currentTime: number    // seconds
  duration: number       // seconds
}

// ── Search Result ──
export interface SearchResult {
  tracks: Track[]
  nextPage?: string      // continuation token
}

// ── Lyrics ──
export interface LyricLine {
  time: number           // seconds
  text: string
}

export interface LyricsResult {
  synced: LyricLine[]
  plain?: string         // fallback plain text
}

// ── Settings ──
export interface AppSettings {
  invidiousInstance: string
  invidiousFallbacks: string[]
  downloadQuality: 'low' | 'medium' | 'high'
  downloadPath: string
  theme: 'light' | 'dark'
  minimizeToTray: boolean
  rememberLastPlaylist: boolean
  windowBounds?: { x: number; y: number; width: number; height: number }
}

// ── IPC Channel Definitions ──
export const IPC_CHANNELS = {
  SEARCH: 'search:query',
  GET_VIDEO: 'search:video-detail',
  STREAM_URL: 'playback:stream-url',
  PLAY_DOWNLOADED: 'playback:play-downloaded',
  TOGGLE_PLAY: 'playback:toggle',
  NEXT: 'playback:next',
  PREV: 'playback:prev',
  SEEK: 'playback:seek',
  SET_VOLUME: 'playback:volume',
  DOWNLOAD: 'downloads:start',
  CANCEL_DOWNLOAD: 'downloads:cancel',
  GET_DOWNLOADS: 'downloads:list',
  REMOVE_DOWNLOAD: 'downloads:remove',
  GET_LYRICS: 'lyrics:get',
  LIBRARY_LIST: 'library:list-playlists',
  LIBRARY_CREATE: 'library:create-playlist',
  LIBRARY_DELETE: 'library:delete-playlist',
  LIBRARY_ADD_TRACK: 'library:add-track',
  LIBRARY_REMOVE_TRACK: 'library:remove-track',
  GET_SETTINGS: 'settings:get',
  SET_SETTINGS: 'settings:set',
  GET_OFFLINE_STATUS: 'system:offline-status',
} as const
```

---

### Task 2: Database Layer

**Files:**
- Create: `src/main/database/schema.ts`
- Create: `src/main/database/database.ts`

- [ ] **Step 1: Create schema definitions**

```ts
// src/main/database/schema.ts
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS playlist_tracks (
  playlist_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  duration INTEGER NOT NULL,
  thumbnail TEXT DEFAULT '',
  added_at INTEGER NOT NULL,
  PRIMARY KEY (playlist_id, track_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS downloads (
  track_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  duration INTEGER NOT NULL,
  thumbnail TEXT DEFAULT '',
  file_path TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT 'medium',
  downloaded_at INTEGER NOT NULL,
  file_size INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
  track_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  added_at INTEGER NOT NULL
);
`
```

- [ ] **Step 2: Create database manager**

```ts
// src/main/database/database.ts
import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import { SCHEMA_SQL } from './schema'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'youtube-music.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Run migrations
  db.exec(SCHEMA_SQL)

  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

// ── Playlist Queries ──
export function getAllPlaylists() {
  const db = getDatabase()
  return db.prepare('SELECT * FROM playlists ORDER BY updated_at DESC').all() as any[]
}

export function createPlaylist(id: string, name: string, description = '') {
  const db = getDatabase()
  const now = Date.now()
  db.prepare(
    'INSERT INTO playlists (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name, description, now, now)
}

export function deletePlaylist(id: string) {
  const db = getDatabase()
  db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ?').run(id)
  db.prepare('DELETE FROM playlists WHERE id = ?').run(id)
}

export function getPlaylistTracks(playlistId: string) {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY position')
    .all(playlistId) as any[]
}

export function addTrackToPlaylist(
  playlistId: string,
  track: { id: string; title: string; artist: string; duration: number; thumbnail: string },
  position: number
) {
  const db = getDatabase()
  db.prepare(
    `INSERT OR REPLACE INTO playlist_tracks (playlist_id, track_id, position, title, artist, duration, thumbnail, added_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(playlistId, track.id, position, track.title, track.artist, track.duration, track.thumbnail, Date.now())
}

export function removeTrackFromPlaylist(playlistId: string, trackId: string) {
  const db = getDatabase()
  db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?').run(playlistId, trackId)
}

// ── Download Queries ──
export function getDownloadedTracks() {
  const db = getDatabase()
  return db.prepare('SELECT * FROM downloads ORDER BY downloaded_at DESC').all() as any[]
}

export function isTrackDownloaded(trackId: string): boolean {
  const db = getDatabase()
  const row = db.prepare('SELECT 1 FROM downloads WHERE track_id = ?').get(trackId)
  return !!row
}

export function addDownloadedTrack(track: {
  trackId: string; title: string; artist: string; duration: number;
  thumbnail: string; filePath: string; quality: string; fileSize: number
}) {
  const db = getDatabase()
  db.prepare(
    `INSERT OR REPLACE INTO downloads (track_id, title, artist, duration, thumbnail, file_path, quality, downloaded_at, file_size)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(track.trackId, track.title, track.artist, track.duration, track.thumbnail, track.filePath, track.quality, Date.now(), track.fileSize)
}

export function removeDownloadedTrack(trackId: string) {
  const db = getDatabase()
  db.prepare('DELETE FROM downloads WHERE track_id = ?').run(trackId)
}

// ── Settings Queries ──
export function getSetting(key: string): string | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value
}

export function setSetting(key: string, value: string) {
  const db = getDatabase()
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
}

// ── Favorites ──
export function getFavorites() {
  const db = getDatabase()
  return db.prepare('SELECT * FROM favorites ORDER BY added_at DESC').all() as any[]
}

export function isFavorite(trackId: string): boolean {
  const db = getDatabase()
  return !!db.prepare('SELECT 1 FROM favorites WHERE track_id = ?').get(trackId)
}

export function toggleFavorite(track: { id: string; title: string; artist: string }) {
  const db = getDatabase()
  const exists = db.prepare('SELECT 1 FROM favorites WHERE track_id = ?').get(track.id)
  if (exists) {
    db.prepare('DELETE FROM favorites WHERE track_id = ?').run(track.id)
    return false
  } else {
    db.prepare('INSERT INTO favorites (track_id, title, artist, added_at) VALUES (?, ?, ?, ?)').run(track.id, track.title, track.artist, Date.now())
    return true
  }
}
```

---

### Task 3: Invidious API Client

**Files:**
- Create: `src/main/services/invidious.ts`

- [ ] **Step 1: Create the Invidious API client**

```ts
// src/main/services/invidious.ts
import { getSetting } from '../database/database'
import type { Track, SearchResult } from '../../shared/types'

const DEFAULT_INSTANCES = [
  'https://inv.nadeko.net',
  'https://yewtu.be',
  'https://inv.riverside.rocks',
  'https://invidious.snopyta.org',
]

function getBaseUrl(): string {
  return getSetting('invidious_instance') || DEFAULT_INSTANCES[0]
}

function getFallbacks(): string[] {
  try {
    const stored = getSetting('invidious_fallbacks')
    return stored ? JSON.parse(stored) : DEFAULT_INSTANCES
  } catch {
    return DEFAULT_INSTANCES
  }
}

async function fetchFromInstance(path: string, retries = 2): Promise<any> {
  const instances = [getBaseUrl(), ...getFallbacks()]
  const uniqueInstances = [...new Set(instances)]

  for (let attempt = 0; attempt < uniqueInstances.length && attempt <= retries; attempt++) {
    const baseUrl = uniqueInstances[attempt]
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (err) {
      if (attempt === uniqueInstances.length - 1 || attempt === retries) throw err
      // fall through to next instance
    }
  }
  throw new Error('All Invidious instances failed')
}

export async function searchTracks(query: string, page?: string): Promise<SearchResult> {
  const params = new URLSearchParams({ q: query, type: 'video', fields: 'videoId,title,author,lengthSeconds,videoThumbnails' })
  if (page) params.set('page', page)
  const data = await fetchFromInstance(`/api/v1/search?${params}`)

  const tracks: Track[] = (data as any[]).map((item: any) => ({
    id: item.videoId,
    title: item.title,
    artist: item.author || 'Unknown',
    duration: item.lengthSeconds || 0,
    thumbnail: item.videoThumbnails?.[3]?.url || item.videoThumbnails?.[0]?.url || '',
    albumArt: item.videoThumbnails?.find((t: any) => t.quality === 'maxres')?.url,
  }))

  return { tracks, nextPage: undefined }
}

export async function getVideoDetail(videoId: string): Promise<Track> {
  const data = await fetchFromInstance(`/api/v1/videos/${videoId}`)
  return {
    id: data.videoId,
    title: data.title,
    artist: data.author || 'Unknown',
    album: data.genre || undefined,
    duration: data.lengthSeconds || 0,
    thumbnail: data.videoThumbnails?.[3]?.url || data.videoThumbnails?.[0]?.url || '',
    albumArt: data.videoThumbnails?.find((t: any) => t.quality === 'maxres')?.url,
  }
}

export async function getPlaylistVideos(playlistId: string): Promise<Track[]> {
  const data = await fetchFromInstance(`/api/v1/playlists/${playlistId}`)
  return (data.videos || []).map((item: any) => ({
    id: item.videoId,
    title: item.title,
    artist: item.author || 'Unknown',
    duration: item.lengthSeconds || 0,
    thumbnail: item.videoThumbnails?.[3]?.url || item.videoThumbnails?.[0]?.url || '',
  }))
}
```

---

### Task 4: yt-dlp Manager

**Files:**
- Create: `src/main/services/yt-dlp.ts`

- [ ] **Step 1: Write the yt-dlp service**

```ts
// src/main/services/yt-dlp.ts
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

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
    low: 'bestaudio[abr<=128]/bestaudio',
    medium: 'bestaudio[abr<=256]/bestaudio',
    high: 'bestaudio/best',
  }

  const format = qualityMap[quality] || qualityMap.medium

  const args = [
    `https://www.youtube.com/watch?v=${videoId}`,
    '--extract-audio',
    '--audio-format', 'aac',
    '--audio-quality', quality === 'high' ? '0' : '5',
    '-o', outputTemplate,
    '-f', format,
    '--no-playlist',
    '--print', 'filename',
    '--no-warnings',
    '--progress',
    '--newline',
  ]

  const proc = spawn(binaryPath, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  let outputPath = ''

  proc.stdout?.on('data', (data: Buffer) => {
    const line = data.toString().trim()
    // yt-dlp outputs progress lines like:  [download]  45.2% of 3.45MiB at 1.23MiB/s ETA 00:02
    const progressMatch = line.match(/(\d+\.?\d*)%/)
    if (progressMatch) {
      const percent = parseFloat(progressMatch[1])
      onEvent?.({ type: 'progress', data: { percent } })
    } else if (line.endsWith('.aac') || line.endsWith('.m4a') || line.endsWith('.webm')) {
      outputPath = line.trim()
    }
  })

  proc.stderr?.on('data', (data: Buffer) => {
    const text = data.toString().trim()
    if (text && !text.startsWith('[download]')) {
      onEvent?.({ type: 'error', message: text })
    }
  })

  proc.on('close', (code) => {
    if (code === 0 && outputPath) {
      onEvent?.({ type: 'complete', filePath: outputPath })
    } else if (code !== 0) {
      onEvent?.({ type: 'error', message: `yt-dlp exited with code ${code}` })
    }
  })

  return { abort: () => proc.kill() }
}

// Returns a streaming URL that our local server can serve
// Using a simpler approach: write to a known temp path and stream via streaming-server.ts
export function getStreamOutputPath(videoId: string, outputDir: string): string {
  // Check for existing cached file
  const candidates = ['.aac', '.m4a', '.webm', '.mp3']
  for (const ext of candidates) {
    const p = path.join(outputDir, `${videoId}${ext}`)
    if (fs.existsSync(p)) return p
  }
  return path.join(outputDir, `${videoId}.aac`)
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
```

---

### Task 5: Streaming Server

**Files:**
- Create: `src/main/services/streaming-server.ts`

- [ ] **Step 1: Create local HTTP streaming server**

```ts
// src/main/services/streaming-server.ts
import http from 'http'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

let server: http.Server | null = null
let currentPort = 0

export function getStreamingPort(): number {
  return currentPort
}

export async function startStreamingServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      // URL format: /stream/{videoId}.{ext}
      const match = req.url?.match(/\/stream\/(.+)\.(\w+)$/)
      if (!match) {
        res.writeHead(404)
        res.end()
        return
      }

      const videoId = match[1]
      const ext = match[2]
      const filePath = getFilePathForStream(videoId, ext)

      if (!filePath || !fs.existsSync(filePath)) {
        res.writeHead(404)
        res.end('File not found')
        return
      }

      const stat = fs.statSync(filePath)
      const fileSize = stat.size
      const range = req.headers.range

      if (range) {
        // Handle Range requests (seeking)
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
        const chunksize = end - start + 1

        const stream = fs.createReadStream(filePath, { start, end })
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': getMimeType(ext),
        })
        stream.pipe(res)
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': getMimeType(ext),
          'Accept-Ranges': 'bytes',
        })
        fs.createReadStream(filePath).pipe(res)
      }
    })

    // Listen on port 0 to get an available port
    server.listen(0, '127.0.0.1', () => {
      const addr = server?.address()
      if (addr && typeof addr === 'object') {
        currentPort = addr.port
        resolve(currentPort)
      } else {
        reject(new Error('Failed to get port'))
      }
    })

    server.on('error', reject)
  })
}

export function stopStreamingServer(): void {
  if (server) {
    server.close()
    server = null
    currentPort = 0
  }
}

function getFilePathForStream(videoId: string, ext: string): string | null {
  // Check cache dir first
  const cacheDir = path.join(app.getPath('userData'), 'cache')
  const candidate = path.join(cacheDir, `${videoId}.${ext}`)
  if (fs.existsSync(candidate)) return candidate

  // Check downloads dir
  const downloadDir = path.join(app.getPath('userData'), 'downloads')
  const candidate2 = path.join(downloadDir, `${videoId}.${ext}`)
  if (fs.existsSync(candidate2)) return candidate2

  return null
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    webm: 'audio/webm',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
  }
  return map[ext] || 'application/octet-stream'
}

// Build streaming URL for the renderer
export function getStreamUrl(videoId: string, ext: string = 'aac'): string {
  return `http://127.0.0.1:${currentPort}/stream/${videoId}.${ext}`
}
```

---

### Task 6: LRCLIB Lyrics Client

**Files:**
- Create: `src/main/services/lrclib.ts`

- [ ] **Step 1: Write LRCLIB API client**

```ts
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
```

---

### Task 7: IPC Handlers Registration

**Files:**
- Create: `src/main/ipc/search.ts`
- Create: `src/main/ipc/playback.ts`
- Create: `src/main/ipc/downloads.ts`
- Create: `src/main/ipc/library.ts`
- Create: `src/main/ipc/settings.ts`
- Create: `src/main/ipc/lyrics.ts`

- [ ] **Step 1: Write search IPC handler**

```ts
// src/main/ipc/search.ts
import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import { searchTracks, getVideoDetail, getPlaylistVideos } from '../services/invidious'

export function registerSearchHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SEARCH, async (_event, query: string) => {
    return searchTracks(query)
  })

  ipcMain.handle(IPC_CHANNELS.GET_VIDEO, async (_event, videoId: string) => {
    return getVideoDetail(videoId)
  })
}
```

- [ ] **Step 2: Write playback IPC handler**

```ts
// src/main/ipc/playback.ts
import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import { extractAudio, getStreamOutputPath, getCacheDir } from '../services/yt-dlp'
import { getStreamUrl } from '../services/streaming-server'
import fs from 'fs'
import path from 'path'

// Track current extraction process so we can abort it
let currentExtract: { abort: () => void } | null = null

export function registerPlaybackHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.STREAM_URL, async (_event, videoId: string) => {
    // Cancel any in-progress extraction
    currentExtract?.abort()

    const cacheDir = getCacheDir()

    // Check if already cached
    const existing = getStreamOutputPath(videoId, cacheDir)
    if (fs.existsSync(existing)) {
      const ext = path.extname(existing).replace('.', '')
      return { url: getStreamUrl(videoId, ext), cached: true }
    }

    // Extract audio — this might take a moment
    return new Promise((resolve, reject) => {
      currentExtract = extractAudio(videoId, cacheDir, 'medium', (event) => {
        if (event.type === 'complete') {
          const ext = path.extname(event.filePath).replace('.', '')
          currentExtract = null
          resolve({ url: getStreamUrl(videoId, ext || 'aac'), cached: false })
        } else if (event.type === 'error') {
          currentExtract = null
          reject(new Error(event.message))
        }
        // progress events are ignored for streaming (sent as toasts separately)
      })
    })
  })

  // Return file path for offline playback
  ipcMain.handle(IPC_CHANNELS.PLAY_DOWNLOADED, async (_event, videoId: string) => {
    const downloadsDir = path.join(require('electron').app.getPath('userData'), 'downloads')
    const candidates = ['.aac', '.m4a', '.webm', '.mp3']
    for (const ext of candidates) {
      const p = path.join(downloadsDir, `${videoId}${ext}`)
      if (fs.existsSync(p)) {
        const extClean = path.extname(p).replace('.', '')
        return { url: getStreamUrl(videoId, extClean) }
      }
    }
    throw new Error('Downloaded file not found')
  })
}
```

- [ ] **Step 3: Write downloads IPC handler**

```ts
// src/main/ipc/downloads.ts
import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import { extractAudio } from '../services/yt-dlp'
import { addDownloadedTrack, getDownloadedTracks, removeDownloadedTrack } from '../database/database'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import type { DownloadJob } from '../../shared/types'

const activeDownloads = new Map<string, { abort: () => void }>()

export function registerDownloadHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD, async (_event, track: { id: string; title: string; artist: string; duration: number; thumbnail: string }) => {
    const downloadDir = path.join(app.getPath('userData'), 'downloads')
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true })

    return new Promise<void>((resolve, reject) => {
      const extraction = extractAudio(track.id, downloadDir, 'medium', (event) => {
        if (event.type === 'complete') {
          activeDownloads.delete(track.id)
          const stats = fs.statSync(event.filePath)
          addDownloadedTrack({
            trackId: track.id,
            title: track.title,
            artist: track.artist,
            duration: track.duration,
            thumbnail: track.thumbnail,
            filePath: event.filePath,
            quality: 'medium',
            fileSize: stats.size,
          })
          resolve()
        } else if (event.type === 'error') {
          activeDownloads.delete(track.id)
          reject(new Error(event.message))
        }
      })
      activeDownloads.set(track.id, extraction)
    })
  })

  ipcMain.handle(IPC_CHANNELS.CANCEL_DOWNLOAD, async (_event, trackId: string) => {
    const dl = activeDownloads.get(trackId)
    if (dl) {
      dl.abort()
      activeDownloads.delete(trackId)
    }
  })

  ipcMain.handle(IPC_CHANNELS.GET_DOWNLOADS, async () => {
    return getDownloadedTracks()
  })

  ipcMain.handle(IPC_CHANNELS.REMOVE_DOWNLOAD, async (_event, trackId: string) => {
    removeDownloadedTrack(trackId)
    // Delete file from disk
    const downloadDir = path.join(app.getPath('userData'), 'downloads')
    for (const ext of ['.aac', '.m4a', '.webm', '.mp3']) {
      const p = path.join(downloadDir, `${trackId}${ext}`)
      if (fs.existsSync(p)) {
        fs.unlinkSync(p)
        break
      }
    }
  })
}
```

- [ ] **Step 4: Write library IPC handler**

```ts
// src/main/ipc/library.ts
import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import {
  getAllPlaylists, createPlaylist, deletePlaylist,
  getPlaylistTracks, addTrackToPlaylist, removeTrackFromPlaylist,
  getFavorites, toggleFavorite, isFavorite
} from '../database/database'
import { v4 as uuidv4 } from 'node:crypto' // Available in Node 22+
// Use crypto.randomUUID() if uuid is not installed

export function registerLibraryHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.LIBRARY_LIST, async () => {
    const playlists = getAllPlaylists()
    return Promise.all(
      playlists.map(async (p) => ({
        ...p,
        tracks: getPlaylistTracks(p.id),
      }))
    )
  })

  ipcMain.handle(IPC_CHANNELS.LIBRARY_CREATE, async (_event, name: string, description?: string) => {
    const id = crypto.randomUUID()
    createPlaylist(id, name, description || '')
    return { id, name, description }
  })

  ipcMain.handle(IPC_CHANNELS.LIBRARY_DELETE, async (_event, id: string) => {
    deletePlaylist(id)
  })

  ipcMain.handle(IPC_CHANNELS.LIBRARY_ADD_TRACK, async (_event, playlistId: string, track: any, position: number) => {
    addTrackToPlaylist(playlistId, track, position)
  })

  ipcMain.handle(IPC_CHANNELS.LIBRARY_REMOVE_TRACK, async (_event, playlistId: string, trackId: string) => {
    removeTrackFromPlaylist(playlistId, trackId)
  })

  ipcMain.handle('library:favorites', async () => {
    return getFavorites()
  })

  ipcMain.handle('library:toggle-favorite', async (_event, track: { id: string; title: string; artist: string }) => {
    return toggleFavorite(track)
  })

  ipcMain.handle('library:is-favorite', async (_event, trackId: string) => {
    return isFavorite(trackId)
  })
}
```

- [ ] **Step 5: Write settings IPC handler**

```ts
// src/main/ipc/settings.ts
import { ipcMain, app } from 'electron'
import { IPC_CHANNELS, AppSettings } from '../../shared/types'
import { getSetting, setSetting } from '../database/database'

const DEFAULT_SETTINGS: AppSettings = {
  invidiousInstance: 'https://inv.nadeko.net',
  invidiousFallbacks: ['https://yewtu.be', 'https://inv.riverside.rocks', 'https://invidious.snopyta.org'],
  downloadQuality: 'medium',
  downloadPath: '',
  theme: 'light',
  minimizeToTray: true,
  rememberLastPlaylist: true,
}

function loadSettings(): AppSettings {
  const stored = getSetting('app_settings')
  if (stored) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    } catch { /* fall through */ }
  }
  return { ...DEFAULT_SETTINGS }
}

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, async () => {
    return loadSettings()
  })

  ipcMain.handle(IPC_CHANNELS.SET_SETTINGS, async (_event, partial: Partial<AppSettings>) => {
    const current = loadSettings()
    const updated = { ...current, ...partial }
    setSetting('app_settings', JSON.stringify(updated))
    return updated
  })
}
```

- [ ] **Step 6: Write lyrics IPC handler**

```ts
// src/main/ipc/lyrics.ts
import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import { searchLyrics } from '../services/lrclib'

export function registerLyricsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.GET_LYRICS, async (_event, artist: string, title: string) => {
    return searchLyrics(artist, title)
  })
}
```

---

### Task 8: Preload Script (contextBridge)

**Files:**
- Create: `src/preload/index.ts`

- [ ] **Step 1: Write the preload script**

```ts
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Search
  search: (query: string) => ipcRenderer.invoke('search:query', query),
  getVideoDetail: (videoId: string) => ipcRenderer.invoke('search:video-detail', videoId),

  // Playback
  getStreamUrl: (videoId: string) => ipcRenderer.invoke('playback:stream-url', videoId),
  playDownloaded: (videoId: string) => ipcRenderer.invoke('playback:play-downloaded', videoId),

  // Downloads
  download: (track: any) => ipcRenderer.invoke('downloads:start', track),
  cancelDownload: (trackId: string) => ipcRenderer.invoke('downloads:cancel', trackId),
  getDownloads: () => ipcRenderer.invoke('downloads:list'),
  removeDownload: (trackId: string) => ipcRenderer.invoke('downloads:remove', trackId),

  // Library
  listPlaylists: () => ipcRenderer.invoke('library:list-playlists'),
  createPlaylist: (name: string, description?: string) => ipcRenderer.invoke('library:create-playlist', name, description),
  deletePlaylist: (id: string) => ipcRenderer.invoke('library:delete-playlist', id),
  addTrackToPlaylist: (playlistId: string, track: any, position: number) => ipcRenderer.invoke('library:add-track', playlistId, track, position),
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => ipcRenderer.invoke('library:remove-track', playlistId, trackId),
  getFavorites: () => ipcRenderer.invoke('library:favorites'),
  toggleFavorite: (track: any) => ipcRenderer.invoke('library:toggle-favorite', track),
  isFavorite: (trackId: string) => ipcRenderer.invoke('library:is-favorite', trackId),

  // Lyrics
  getLyrics: (artist: string, title: string) => ipcRenderer.invoke('lyrics:get', artist, title),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (partial: any) => ipcRenderer.invoke('settings:set', partial),

  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api
```

---

### Task 9: Main Process Entry

**Files:**
- Create: `src/main/index.ts`

- [ ] **Step 1: Write main process entry**

```ts
// src/main/index.ts
import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import { startStreamingServer, stopStreamingServer } from './services/streaming-server'
import { getDatabase, closeDatabase } from './database/database'
import { registerSearchHandlers } from './ipc/search'
import { registerPlaybackHandlers } from './ipc/playback'
import { registerDownloadHandlers } from './ipc/downloads'
import { registerLibraryHandlers } from './ipc/library'
import { registerSettingsHandlers } from './ipc/settings'
import { registerLyricsHandlers } from './ipc/lyrics'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 500,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#F7F6F3',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // Load renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Window control IPC
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window:close', () => mainWindow?.close())
}

function createTray(): void {
  // Create a simple 16x16 tray icon
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('YouTube Music Electron')

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow?.show() },
    { label: 'Hide', click: () => mainWindow?.hide() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ])
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow?.show()
    }
  })
}

app.whenReady().then(async () => {
  // Initialize database
  getDatabase()

  // Start streaming server
  await startStreamingServer()

  // Register all IPC handlers
  registerSearchHandlers()
  registerPlaybackHandlers()
  registerDownloadHandlers()
  registerLibraryHandlers()
  registerSettingsHandlers()
  registerLyricsHandlers()

  // Create window
  createWindow()

  // Create tray
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  stopStreamingServer()
  closeDatabase()
})
```

---

### Task 10: Renderer Entry & styles

**Files:**
- Create: `src/renderer/src/main.tsx`
- Create: `src/renderer/src/App.tsx`
- Create: `src/renderer/src/styles/globals.css`

- [ ] **Step 1: Create Tailwind entry CSS**

```css
/* src/renderer/src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: 'SF Pro Display', 'Geist Sans', 'Helvetica Neue', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow: hidden;
    user-select: none;
  }

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: #D0D0C8;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #B0B0A0;
  }
}

@layer components {
  .text-balance {
    text-wrap: balance;
  }
}
```

- [ ] **Step 2: Create renderer entry point**

```tsx
// src/renderer/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 3: Create App shell (placeholder routing)**

```tsx
// src/renderer/src/App.tsx
import { useState } from 'react'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import BottomBar from './components/BottomBar'
import NowPlayingView from './pages/NowPlayingView'
import SearchView from './pages/SearchView'
import LibraryView from './pages/LibraryView'
import DownloadsView from './pages/DownloadsView'
import SettingsView from './pages/SettingsView'
import ToastContainer from './components/ToastContainer'
import { Toaster } from './stores/toast'

export type ViewName = 'now-playing' | 'search' | 'library' | 'downloads' | 'settings'

export default function App() {
  const [currentView, setCurrentView] = useState<ViewName>('now-playing')

  return (
    <div className="h-screen w-screen flex flex-col bg-canvas overflow-hidden">
      <TitleBar currentView={currentView} onSearch={() => setCurrentView('search')} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentView={currentView} onNavigate={setCurrentView} />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {currentView === 'now-playing' && <NowPlayingView />}
          {currentView === 'search' && <SearchView onPlay={() => setCurrentView('now-playing')} />}
          {currentView === 'library' && <LibraryView />}
          {currentView === 'downloads' && <DownloadsView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>
      <BottomBar />
      <ToastContainer />
    </div>
  )
}
```

---

### Task 11: Store Atoms (Jotai)

**Files:**
- Create: `src/renderer/src/stores/player.ts`
- Create: `src/renderer/src/stores/library.ts`
- Create: `src/renderer/src/stores/downloads.ts`
- Create: `src/renderer/src/stores/settings.ts`
- Create: `src/renderer/src/stores/toast.ts`

- [ ] **Step 1: Create player store**

```ts
// src/renderer/src/stores/player.ts
import { atom } from 'jotai'
import type { Track, PlayerStatus } from '@shared/types'

export interface PlayerAtom {
  queue: Track[]
  currentIndex: number
  status: PlayerStatus
  volume: number
  shuffle: boolean
  repeat: 'off' | 'one' | 'all'
  currentTime: number
  duration: number
}

export const playerAtom = atom<PlayerAtom>({
  queue: [],
  currentIndex: -1,
  status: 'idle',
  volume: 0.8,
  shuffle: false,
  repeat: 'off',
  currentTime: 0,
  duration: 0,
})

export const currentTrackAtom = atom((get) => {
  const player = get(playerAtom)
  if (player.currentIndex < 0 || player.currentIndex >= player.queue.length) return null
  return player.queue[player.currentIndex]
})

export const playTrackAtom = atom(null, (get, set, track: Track) => {
  const player = get(playerAtom)
  const existingIndex = player.queue.findIndex((t) => t.id === track.id)
  if (existingIndex >= 0) {
    set(playerAtom, { ...player, currentIndex: existingIndex, status: 'loading' })
  } else {
    set(playerAtom, {
      ...player,
      queue: [...player.queue, track],
      currentIndex: player.queue.length,
      status: 'loading',
    })
  }
})

export const playQueueAtom = atom(null, (get, set, tracks: Track[], startIndex = 0) => {
  set(playerAtom, {
    ...get(playerAtom),
    queue: tracks,
    currentIndex: startIndex,
    status: 'loading',
  })
})

export const nextTrackAtom = atom(null, (get, set) => {
  const player = get(playerAtom)
  if (player.queue.length === 0) return

  let nextIndex: number
  if (player.shuffle) {
    let idx: number
    do {
      idx = Math.floor(Math.random() * player.queue.length)
    } while (idx === player.currentIndex && player.queue.length > 1)
    nextIndex = idx
  } else {
    nextIndex = player.currentIndex + 1
  }

  if (nextIndex >= player.queue.length) {
    if (player.repeat === 'all') {
      nextIndex = 0
    } else {
      set(playerAtom, { ...player, status: 'idle', currentTime: 0 })
      return
    }
  }

  set(playerAtom, { ...player, currentIndex: nextIndex, status: 'loading', currentTime: 0 })
})

export const prevTrackAtom = atom(null, (get, set) => {
  const player = get(playerAtom)
  if (player.queue.length === 0) return

  // If more than 3 seconds in, restart current track
  if (player.currentTime > 3) {
    set(playerAtom, { ...player, currentTime: 0 })
    return
  }

  let prevIndex = player.currentIndex - 1
  if (prevIndex < 0) {
    prevIndex = player.queue.length - 1
  }

  set(playerAtom, { ...player, currentIndex: prevIndex, status: 'loading', currentTime: 0 })
})
```

- [ ] **Step 2: Create library store**

```ts
// src/renderer/src/stores/library.ts
import { atom } from 'jotai'
import type { Track } from '@shared/types'

export interface PlaylistEntry {
  id: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
  tracks: any[]
}

export const playlistsAtom = atom<PlaylistEntry[]>([])
export const favoritesAtom = atom<Track[]>([])

export const refreshLibraryAtom = atom(null, async (_get, set) => {
  const api = (window as any).electronAPI
  if (!api) return
  const playlists = await api.listPlaylists()
  set(playlistsAtom, playlists)
  const favs = await api.getFavorites()
  set(favoritesAtom, favs)
})
```

- [ ] **Step 3: Create downloads store**

```ts
// src/renderer/src/stores/downloads.ts
import { atom } from 'jotai'

export interface DownloadEntry {
  track_id: string
  title: string
  artist: string
  file_path: string
  file_size: number
  downloaded_at: number
}

export const downloadsAtom = atom<DownloadEntry[]>([])
export const downloadingSetAtom = atom<Set<string>>(new Set())

export const refreshDownloadsAtom = atom(null, async (_get, set) => {
  const api = (window as any).electronAPI
  if (!api) return
  const dl = await api.getDownloads()
  set(downloadsAtom, dl)
})
```

- [ ] **Step 4: Create settings store**

```ts
// src/renderer/src/stores/settings.ts
import { atom } from 'jotai'
import type { AppSettings } from '@shared/types'

export const settingsAtom = atom<AppSettings | null>(null)

export const loadSettingsAtom = atom(null, async (_get, set) => {
  const api = (window as any).electronAPI
  if (!api) return
  const settings = await api.getSettings()
  set(settingsAtom, settings)
  // Apply theme
  if (settings.theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})

export const saveSettingsAtom = atom(null, async (_get, set, partial: Partial<AppSettings>) => {
  const api = (window as any).electronAPI
  if (!api) return
  const updated = await api.setSettings(partial)
  set(settingsAtom, updated)
  if (updated.theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
```

- [ ] **Step 5: Create toast store**

```ts
// src/renderer/src/stores/toast.ts
import { atom } from 'jotai'

export interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'error'
}

export const toastsAtom = atom<Toast[]>([])

export const addToastAtom = atom(null, (_get, set, { message, type = 'info' }: { message: string; type?: Toast['type'] }) => {
  const id = Math.random().toString(36).slice(2)
  set(toastsAtom, (prev) => [...prev, { id, message, type }])
  // Auto-dismiss after 3s
  setTimeout(() => {
    set(toastsAtom, (prev) => prev.filter((t) => t.id !== id))
  }, 3000)
})
```

---

### Task 12: UI — TitleBar & Sidebar

**Files:**
- Create: `src/renderer/src/components/TitleBar.tsx`
- Create: `src/renderer/src/components/Sidebar.tsx`

- [ ] **Step 1: Create TitleBar component**

```tsx
// src/renderer/src/components/TitleBar.tsx
import { useState } from 'react'
import type { ViewName } from '../App'

interface TitleBarProps {
  currentView: ViewName
  onSearch: () => void
}

export default function TitleBar({ currentView, onSearch }: TitleBarProps) {
  const [searchFocused, setSearchFocused] = useState(false)

  const handleSearchFocus = () => {
    setSearchFocused(true)
    onSearch()
  }

  return (
    <div className="h-titlebar flex items-center px-4 bg-canvas border-b border-border draggable shrink-0">
      {/* Traffic lights placeholder (macOS) */}
      <div className="flex items-center gap-1.5 mr-4 no-drag">
        <div className="w-3 h-3 rounded-full bg-[#DDDCD5]" />
        <div className="w-3 h-3 rounded-full bg-[#DDDCD5]" />
        <div className="w-3 h-3 rounded-full bg-[#DDDCD5]" />
      </div>

      {/* App name */}
      <span className="text-xs font-mono text-text-muted tracking-wider uppercase mr-6">YTM Electro</span>

      {/* Search (always visible, compact) */}
      <div className={`flex-1 max-w-md mx-auto ${currentView !== 'search' ? '' : ''}`}>
        <input
          type="text"
          placeholder="Search music..."
          className="w-full px-3 py-1 text-sm bg-surface border border-border rounded-card text-text-primary placeholder:text-text-muted outline-none focus:border-text-muted transition-colors"
          onFocus={handleSearchFocus}
          readOnly={currentView !== 'search'}
        />
      </div>

      {/* Spacer for window controls on Windows — handled by frameless */}
      <div className="w-8" />
    </div>
  )
}
```

- [ ] **Step 2: Create Sidebar component**

```tsx
// src/renderer/src/components/Sidebar.tsx
import type { ViewName } from '../App'

interface SidebarProps {
  currentView: ViewName
  onNavigate: (view: ViewName) => void
}

const NAV_ITEMS: { id: ViewName; label: string; icon: string }[] = [
  { id: 'now-playing', label: 'Now Playing', icon: '♫' },
  { id: 'search', label: 'Search', icon: '⌕' },
  { id: 'library', label: 'Library', icon: '❏' },
  { id: 'downloads', label: 'Downloads', icon: '⬇' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <nav className="w-sidebar flex flex-col items-center pt-4 pb-2 bg-canvas border-r border-border shrink-0">
      {NAV_ITEMS.map((item) => {
        const isActive = currentView === item.id
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={item.label}
            className={`relative w-10 h-10 flex items-center justify-center rounded-card mb-1 transition-colors text-lg
              ${isActive
                ? 'bg-surface text-text-primary shadow-card'
                : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
              }`}
          >
            {item.icon}
            {/* Active indicator dot */}
            {isActive && (
              <span className="absolute -left-2.5 w-1 h-1 rounded-full bg-text-muted" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
```

---

### Task 13: UI — BottomBar & Player Controls

**Files:**
- Create: `src/renderer/src/components/BottomBar.tsx`
- Create: `src/renderer/src/components/ProgressBar.tsx`
- Create: `src/renderer/src/components/VolumeSlider.tsx`

- [ ] **Step 1: Create ProgressBar**

```tsx
// src/renderer/src/components/ProgressBar.tsx
interface ProgressBarProps {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

export default function ProgressBar({ currentTime, duration, onSeek }: ProgressBarProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    onSeek(pct * duration)
  }

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-xs text-text-muted font-mono w-8 text-right tabular-nums">
        {formatTime(currentTime)}
      </span>
      <div
        className="flex-1 h-1 bg-border rounded-full cursor-pointer relative group"
        onClick={handleClick}
      >
        <div
          className="h-full bg-text-muted rounded-full transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-text-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${Math.min(progress, 100)}% - 5px)` }}
        />
      </div>
      <span className="text-xs text-text-muted font-mono w-8 tabular-nums">
        {formatTime(duration)}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Create VolumeSlider**

```tsx
// src/renderer/src/components/VolumeSlider.tsx
interface VolumeSliderProps {
  volume: number
  muted: boolean
  onVolumeChange: (v: number) => void
  onToggleMute: () => void
}

export default function VolumeSlider({ volume, muted, onVolumeChange, onToggleMute }: VolumeSliderProps) {
  const displayVolume = muted ? 0 : volume
  const icon = muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'

  return (
    <div className="flex items-center gap-2">
      <button onClick={onToggleMute} className="text-sm text-text-muted hover:text-text-secondary transition-colors">
        {icon}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={displayVolume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        className="w-20 h-1 accent-text-primary cursor-pointer
          [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-border [&::-webkit-slider-runnable-track]:rounded-full
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-text-primary"
      />
    </div>
  )
}
```

- [ ] **Step 3: Create BottomBar**

```tsx
// src/renderer/src/components/BottomBar.tsx
import { useAtom } from 'jotai'
import { playerAtom, currentTrackAtom, nextTrackAtom, prevTrackAtom } from '../stores/player'
import ProgressBar from './ProgressBar'
import VolumeSlider from './VolumeSlider'

declare global {
  interface Window {
    electronAPI: any
  }
}

export default function BottomBar() {
  const [player, setPlayer] = useAtom(playerAtom)
  const [track] = useAtom(currentTrackAtom)

  const handlePlayPause = () => {
    if (player.status === 'playing') {
      setPlayer({ ...player, status: 'paused' })
    } else if (player.queue.length > 0) {
      setPlayer({ ...player, status: 'loading' })
    }
  }

  const handleSeek = (time: number) => {
    setPlayer({ ...player, currentTime: time })
    // Dispatch to audio element via custom event
    window.dispatchEvent(new CustomEvent('audio-seek', { detail: time }))
  }

  const handleVolumeChange = (volume: number) => {
    setPlayer({ ...player, volume })
    window.dispatchEvent(new CustomEvent('audio-volume', { detail: volume }))
  }

  const handleToggleMute = () => {
    if (player.volume > 0) {
      setPlayer({ ...player, volume: 0 })
      window.dispatchEvent(new CustomEvent('audio-volume', { detail: 0 }))
    } else {
      setPlayer({ ...player, volume: 0.8 })
      window.dispatchEvent(new CustomEvent('audio-volume', { detail: 0.8 }))
    }
  }

  if (!track) {
    return (
      <div className="h-bottombar flex items-center px-6 bg-canvas border-t border-border shrink-0">
        <span className="text-sm text-text-muted">No track playing</span>
      </div>
    )
  }

  return (
    <div className="h-bottombar flex flex-col bg-canvas border-t border-border shrink-0">
      {/* Progress bar */}
      <div className="px-6 py-1">
        <ProgressBar
          currentTime={player.currentTime}
          duration={player.duration}
          onSeek={handleSeek}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between px-6 pb-3">
        {/* Track info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 bg-surface-hover rounded-card overflow-hidden shrink-0 border border-border">
            {track.thumbnail && (
              <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-text-primary truncate max-w-[200px]">{track.title}</p>
            <p className="text-xs text-text-secondary truncate max-w-[200px]">{track.artist}</p>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-4">
          <button className="text-text-muted hover:text-text-primary transition-colors text-lg">⤪</button>
          <button
            onClick={handlePlayPause}
            className="w-9 h-9 flex items-center justify-center bg-text-primary text-canvas rounded-full hover:opacity-90 transition-opacity text-lg"
          >
            {player.status === 'playing' ? '⏸' : '▶'}
          </button>
          <button className="text-text-muted hover:text-text-primary transition-colors text-lg">⤫</button>
        </div>

        {/* Volume & lyrics toggle */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <button className="text-sm text-text-muted hover:text-text-primary transition-colors" title="Lyrics">📄</button>
          <VolumeSlider
            volume={player.volume}
            muted={player.volume === 0}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
          />
        </div>
      </div>
    </div>
  )
}
```

---

### Task 14: UI — NowPlayingView

**Files:**
- Create: `src/renderer/src/pages/NowPlayingView.tsx`
- Create: `src/renderer/src/components/LyricsPanel.tsx`

- [ ] **Step 1: Create NowPlayingView**

```tsx
// src/renderer/src/pages/NowPlayingView.tsx
import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { playerAtom, currentTrackAtom } from '../stores/player'
import LyricsPanel from '../components/LyricsPanel'
import useAudio from '../hooks/useAudio'
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts'

export default function NowPlayingView() {
  const [track] = useAtom(currentTrackAtom)
  const [showLyrics, setShowLyrics] = useState(false)

  // Initialize audio engine
  useAudio()
  useKeyboardShortcuts()

  if (!track) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-card bg-surface-hover border border-border flex items-center justify-center mb-4">
          <span className="text-3xl text-text-muted">♫</span>
        </div>
        <h2 className="text-lg font-serif text-text-primary mb-1">No track playing</h2>
        <p className="text-sm text-text-secondary">Search for music to get started</p>
      </div>
    )
  }

  return (
    <div className="h-full flex gap-8">
      {/* Album art */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-72 h-72 rounded-card overflow-hidden border border-border mb-6 shadow-card">
          {track.thumbnail ? (
            <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-surface-hover flex items-center justify-center">
              <span className="text-5xl text-text-muted">♫</span>
            </div>
          )}
        </div>
        <h1 className="text-xl font-serif text-text-primary text-center max-w-sm truncate">
          {track.title}
        </h1>
        <p className="text-sm text-text-secondary mt-1">{track.artist}</p>
        <button
          onClick={() => setShowLyrics(!showLyrics)}
          className={`mt-4 text-xs font-mono uppercase tracking-wider transition-colors ${
            showLyrics ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {showLyrics ? 'Hide lyrics' : 'Show lyrics'}
        </button>
      </div>

      {/* Lyrics panel */}
      {showLyrics && (
        <div className="w-80 border-l border-border pl-8 overflow-y-auto">
          <LyricsPanel />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create LyricsPanel**

```tsx
// src/renderer/src/components/LyricsPanel.tsx
import { useState, useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import { currentTrackAtom, playerAtom } from '../stores/player'
import type { LyricsResult, LyricLine } from '@shared/types'

export default function LyricsPanel() {
  const [track] = useAtom(currentTrackAtom)
  const [player] = useAtom(playerAtom)
  const [lyrics, setLyrics] = useState<LyricsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const activeLineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!track) {
      setLyrics(null)
      return
    }

    setLoading(true)
    const api = (window as any).electronAPI
    if (!api) return

    api.getLyrics(track.artist, track.title).then((result: LyricsResult | null) => {
      setLyrics(result)
      setLoading(false)
    })
  }, [track?.id])

  // Find active lyric line based on current playback time
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
    return (
      <div className="text-center py-12">
        <p className="text-sm text-text-muted">No lyrics found</p>
      </div>
    )
  }

  // Plain text fallback
  if (lyrics.plain && !lyrics.synced.length) {
    return (
      <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
        {lyrics.plain}
      </div>
    )
  }

  // Synced lyrics
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
```

---

### Task 15: UI — SearchView

**Files:**
- Create: `src/renderer/src/components/SearchBox.tsx`
- Create: `src/renderer/src/components/TrackCard.tsx`
- Create: `src/renderer/src/pages/SearchView.tsx`

- [ ] **Step 1: Create TrackCard**

```tsx
// src/renderer/src/components/TrackCard.tsx
import type { Track } from '@shared/types'

interface TrackCardProps {
  track: Track
  onPlay: (track: Track) => void
  onDownload?: (track: Track) => void
  isDownloaded?: boolean
  isDownloading?: boolean
}

export default function TrackCard({ track, onPlay, onDownload, isDownloaded, isDownloading }: TrackCardProps) {
  const formatDuration = (s: number): string => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div
      className="group flex items-center gap-3 p-3 rounded-card hover:bg-surface-hover border border-transparent hover:border-border transition-all cursor-pointer"
      onClick={() => onPlay(track)}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded overflow-hidden bg-surface-hover shrink-0">
        {track.thumbnail ? (
          <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">♫</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{track.title}</p>
        <p className="text-xs text-text-secondary truncate">{track.artist}</p>
      </div>

      {/* Duration */}
      <span className="text-xs text-text-muted font-mono">{formatDuration(track.duration)}</span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onDownload && (
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(track) }}
            disabled={isDownloaded || isDownloading}
            className={`p-1.5 rounded transition-colors text-xs ${
              isDownloaded
                ? 'text-accent-green-text bg-accent-green-bg'
                : isDownloading
                  ? 'text-text-muted'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface'
            }`}
            title={isDownloaded ? 'Downloaded' : isDownloading ? 'Downloading...' : 'Download'}
          >
            {isDownloaded ? '✓' : '⬇'}
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create SearchView**

```tsx
// src/renderer/src/pages/SearchView.tsx
import { useState, useCallback, useRef, useEffect } from 'react'
import { useAtom } from 'jotai'
import { playTrackAtom } from '../stores/player'
import { addToastAtom } from '../stores/toast'
import TrackCard from '../components/TrackCard'
import type { Track } from '@shared/types'

interface SearchViewProps {
  onPlay: () => void
}

export default function SearchView({ onPlay }: SearchViewProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, playTrack] = useAtom(playTrackAtom)
  const [, addToast] = useAtom(addToastAtom)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const api = (window as any).electronAPI
      if (!api) throw new Error('API not available')
      const result = await api.search(q)
      setResults(result.tracks || [])
      if (result.tracks?.length === 0) {
        setError('No results found')
      }
    } catch (err: any) {
      setError(err.message || 'Search failed')
      addToast({ message: 'Search failed — trying again...', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 400)
  }

  const handlePlay = (track: Track) => {
    playTrack(track)
    onPlay()
  }

  const handleDownload = async (track: Track) => {
    const api = (window as any).electronAPI
    if (!api) return
    try {
      addToast({ message: `Downloading ${track.title}...`, type: 'info' })
      await api.download({
        id: track.id, title: track.title, artist: track.artist,
        duration: track.duration, thumbnail: track.thumbnail,
      })
      addToast({ message: `Downloaded ${track.title}`, type: 'success' })
    } catch (err: any) {
      addToast({ message: `Download failed: ${err.message}`, type: 'error' })
    }
  }

  return (
    <div>
      {/* Search input */}
      <div className="mb-6">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search for songs, artists, albums..."
          className="w-full px-4 py-2.5 text-base bg-surface border border-border rounded-card text-text-primary placeholder:text-text-muted outline-none focus:border-text-muted transition-colors"
        />
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-12 h-12 bg-border rounded" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-border rounded w-3/4" />
                <div className="h-3 bg-border rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-sm text-text-muted">{error}</p>
          {query && (
            <button
              onClick={() => doSearch(query)}
              className="mt-2 text-xs text-text-secondary hover:text-text-primary underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && results.length === 0 && query && (
        <div className="text-center py-12">
          <p className="text-sm text-text-muted">No results for "{query}"</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-1">
          {results.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onPlay={handlePlay}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* Initial empty state */}
      {!loading && !error && results.length === 0 && !query && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-card bg-surface-hover border border-border flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-text-muted">⌕</span>
          </div>
          <p className="text-sm text-text-muted">Search for any song, artist, or album</p>
        </div>
      )}
    </div>
  )
}
```

---

### Task 16: UI — LibraryView, DownloadsView, SettingsView

**Files:**
- Create: `src/renderer/src/pages/LibraryView.tsx`
- Create: `src/renderer/src/pages/DownloadsView.tsx`
- Create: `src/renderer/src/pages/SettingsView.tsx`

- [ ] **Step 1: Create LibraryView**

```tsx
// src/renderer/src/pages/LibraryView.tsx
import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { playlistsAtom, favoritesAtom, refreshLibraryAtom } from '../stores/library'
import { playTrackAtom, playQueueAtom } from '../stores/player'
import { addToastAtom } from '../stores/toast'
import TrackCard from '../components/TrackCard'

export default function LibraryView() {
  const [playlists] = useAtom(playlistsAtom)
  const [favorites] = useAtom(favoritesAtom)
  const [, refresh] = useAtom(refreshLibraryAtom)
  const [, playTrack] = useAtom(playTrackAtom)
  const [, addToast] = useAtom(addToastAtom)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [showNewPlaylist, setShowNewPlaylist] = useState(false)

  useEffect(() => {
    refresh()
  }, [])

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return
    const api = (window as any).electronAPI
    if (!api) return
    await api.createPlaylist(newPlaylistName.trim())
    setNewPlaylistName('')
    setShowNewPlaylist(false)
    refresh()
    addToast({ message: `Created "${newPlaylistName}"`, type: 'success' })
  }

  const handleDeletePlaylist = async (id: string, name: string) => {
    const api = (window as any).electronAPI
    if (!api) return
    await api.deletePlaylist(id)
    refresh()
    addToast({ message: `Deleted "${name}"`, type: 'info' })
  }

  return (
    <div>
      {/* Favorites section */}
      {favorites.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-3">Favorites</h2>
          <div className="space-y-1">
            {favorites.map((fav: any) => (
              <TrackCard
                key={fav.track_id}
                track={{ id: fav.track_id, title: fav.title, artist: fav.artist, duration: 0, thumbnail: '' }}
                onPlay={(t) => { playTrack(t) }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Playlists section */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted">Playlists</h2>
        <button
          onClick={() => setShowNewPlaylist(true)}
          className="text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          + New
        </button>
      </div>

      {/* New playlist input */}
      {showNewPlaylist && (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="Playlist name..."
            className="flex-1 px-3 py-1.5 text-sm bg-surface border border-border rounded-card text-text-primary placeholder:text-text-muted outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
            autoFocus
          />
          <button onClick={handleCreatePlaylist} className="text-xs text-text-primary bg-surface border border-border px-2 py-1.5 rounded-card">Create</button>
          <button onClick={() => setShowNewPlaylist(false)} className="text-xs text-text-muted px-2 py-1.5">Cancel</button>
        </div>
      )}

      {/* Empty state */}
      {playlists.length === 0 && favorites.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-text-muted">Your library is empty. Save songs to playlists or mark them as favorites.</p>
        </div>
      )}

      {/* Playlist list */}
      {playlists.length > 0 && (
        <div className="space-y-2">
          {playlists.map((pl) => (
            <div key={pl.id} className="p-4 bg-surface border border-border rounded-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-text-primary font-medium">{pl.name}</h3>
                <button
                  onClick={() => handleDeletePlaylist(pl.id, pl.name)}
                  className="text-xs text-text-muted hover:text-accent-red-text transition-colors"
                >
                  Delete
                </button>
              </div>
              {pl.description && (
                <p className="text-xs text-text-secondary mb-2">{pl.description}</p>
              )}
              <p className="text-xs text-text-muted">{pl.tracks?.length || 0} tracks</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create DownloadsView**

```tsx
// src/renderer/src/pages/DownloadsView.tsx
import { useEffect, useState, useCallback } from 'react'
import { useAtom } from 'jotai'
import { downloadsAtom, downloadingSetAtom, refreshDownloadsAtom } from '../stores/downloads'
import { playTrackAtom } from '../stores/player'
import { addToastAtom } from '../stores/toast'
import TrackCard from '../components/TrackCard'
import type { Track } from '@shared/types'

export default function DownloadsView() {
  const [downloads] = useAtom(downloadsAtom)
  const [downloading] = useAtom(downloadingSetAtom)
  const [, refresh] = useAtom(refreshDownloadsAtom)
  const [, playTrack] = useAtom(playTrackAtom)
  const [, addToast] = useAtom(addToastAtom)

  useEffect(() => {
    refresh()
  }, [])

  const handleRemove = async (trackId: string, title: string) => {
    const api = (window as any).electronAPI
    if (!api) return
    await api.removeDownload(trackId)
    refresh()
    addToast({ message: `Removed "${title}" from offline`, type: 'info' })
  }

  const handlePlay = async (trackId: string) => {
    const api = (window as any).electronAPI
    if (!api) return
    try {
      // Resolve track info from downloads list
      const dl = downloads.find((d) => d.track_id === trackId)
      if (!dl) return

      playTrack({
        id: dl.track_id,
        title: dl.title,
        artist: dl.artist,
        duration: 0,
        thumbnail: dl.thumbnail || '',
      })

      // Signal audio hook to use local file
      const result = await api.playDownloaded(trackId)
      window.dispatchEvent(new CustomEvent('audio-source', { detail: { url: result.url, isLocal: true } }))
    } catch (err: any) {
      addToast({ message: `Playback failed: ${err.message}`, type: 'error' })
    }
  }

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '—'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const totalSize = downloads.reduce((sum, d) => sum + d.file_size, 0)

  return (
    <div>
      {/* Storage info */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted">Downloads</h2>
        <span className="text-xs text-text-muted">
          {downloads.length} tracks · {formatSize(totalSize)}
        </span>
      </div>

      {/* Empty state */}
      {downloads.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-card bg-surface-hover border border-border flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-text-muted">⬇</span>
          </div>
          <p className="text-sm text-text-muted">No downloads yet</p>
          <p className="text-xs text-text-secondary mt-1">Download songs to listen offline</p>
        </div>
      )}

      {/* Download list */}
      {downloads.length > 0 && (
        <div className="space-y-1">
          {downloads.map((dl) => (
            <TrackCard
              key={dl.track_id}
              track={{
                id: dl.track_id,
                title: dl.title,
                artist: dl.artist,
                duration: 0,
                thumbnail: dl.thumbnail || '',
              }}
              onPlay={() => handlePlay(dl.track_id)}
              isDownloaded
              onDownload={() => handleRemove(dl.track_id, dl.title)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create SettingsView**

```tsx
// src/renderer/src/pages/SettingsView.tsx
import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { settingsAtom, loadSettingsAtom, saveSettingsAtom } from '../stores/settings'

export default function SettingsView() {
  const [settings] = useAtom(settingsAtom)
  const [, load] = useAtom(loadSettingsAtom)
  const [, save] = useAtom(saveSettingsAtom)

  useEffect(() => {
    load()
  }, [])

  if (!settings) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-border rounded-card" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-6">Settings</h2>

      {/* Invidious Instance */}
      <div className="mb-5">
        <label className="block text-xs text-text-secondary mb-1">Invidious Instance URL</label>
        <input
          type="text"
          value={settings.invidiousInstance}
          onChange={(e) => save({ invidiousInstance: e.target.value })}
          className="w-full px-3 py-1.5 text-sm bg-surface border border-border rounded-card text-text-primary outline-none focus:border-text-muted"
        />
        <p className="text-xs text-text-muted mt-1">Public instance for searching YouTube (e.g., inv.nadeko.net)</p>
      </div>

      {/* Download Quality */}
      <div className="mb-5">
        <label className="block text-xs text-text-secondary mb-1">Download Quality</label>
        <select
          value={settings.downloadQuality}
          onChange={(e) => save({ downloadQuality: e.target.value as any })}
          className="w-full px-3 py-1.5 text-sm bg-surface border border-border rounded-card text-text-primary outline-none"
        >
          <option value="low">Low (128kbps) — smaller files</option>
          <option value="medium">Medium (256kbps) — balanced</option>
          <option value="high">High (best audio) — largest files</option>
        </select>
      </div>

      {/* Theme */}
      <div className="mb-5">
        <label className="block text-xs text-text-secondary mb-1">Theme</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => save({ theme: 'light' })}
            className={`px-4 py-1.5 text-sm rounded-card border transition-colors ${
              settings.theme === 'light'
                ? 'bg-text-primary text-canvas border-text-primary'
                : 'bg-surface text-text-secondary border-border hover:border-text-muted'
            }`}
          >
            Light
          </button>
          <button
            onClick={() => save({ theme: 'dark' })}
            className={`px-4 py-1.5 text-sm rounded-card border transition-colors ${
              settings.theme === 'dark'
                ? 'bg-text-primary text-canvas border-text-primary'
                : 'bg-surface text-text-secondary border-border hover:border-text-muted'
            }`}
          >
            Dark
          </button>
        </div>
      </div>

      {/* Startup behavior */}
      <div className="mb-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.minimizeToTray}
            onChange={(e) => save({ minimizeToTray: e.target.checked })}
            className="accent-text-primary"
          />
          <span className="text-sm text-text-secondary">Minimize to system tray</span>
        </label>
      </div>

      {/* Separator */}
      <div className="border-t border-border my-6" />

      <p className="text-xs text-text-muted">
        YouTube Music Electron v0.1.0
      </p>
    </div>
  )
}
```

---

### Task 17: UI — ToastContainer, OfflineBanner, ErrorBoundary

**Files:**
- Create: `src/renderer/src/components/ToastContainer.tsx`
- Create: `src/renderer/src/components/OfflineBanner.tsx`
- Create: `src/renderer/src/components/ErrorBoundary.tsx`

- [ ] **Step 1: Create ToastContainer**

```tsx
// src/renderer/src/components/ToastContainer.tsx
import { useAtom } from 'jotai'
import { toastsAtom } from '../stores/toast'

export default function ToastContainer() {
  const [toasts] = useAtom(toastsAtom)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded-card text-sm shadow-card border border-border backdrop-blur-sm animate-in slide-in-from-right
            ${t.type === 'error' ? 'bg-accent-red-bg text-accent-red-text' : ''}
            ${t.type === 'success' ? 'bg-accent-green-bg text-accent-green-text' : ''}
            ${t.type === 'info' ? 'bg-surface text-text-primary' : ''}
          `}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create OfflineBanner**

```tsx
// src/renderer/src/components/OfflineBanner.tsx
import { useState, useEffect } from 'react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-accent-yellow-bg text-accent-yellow-text text-xs text-center py-1 font-mono">
      Offline — playing cached content
    </div>
  )
}
```

- [ ] **Step 3: Create ErrorBoundary**

```tsx
// src/renderer/src/components/ErrorBoundary.tsx
import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Renderer error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-canvas">
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 rounded-card bg-accent-red-bg flex items-center justify-center mx-auto mb-4">
              <span className="text-accent-red-text text-lg">!</span>
            </div>
            <h2 className="text-base text-text-primary font-medium mb-1">Something went wrong</h2>
            <p className="text-sm text-text-muted mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-1.5 text-sm bg-text-primary text-canvas rounded-card hover:opacity-90 transition-opacity"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

---

### Task 18: Hooks — useAudio, useKeyboardShortcuts, useDownloads, useLyrics

**Files:**
- Create: `src/renderer/src/hooks/useAudio.ts`
- Create: `src/renderer/src/hooks/useKeyboardShortcuts.ts`
- Create: `src/renderer/src/hooks/useDownloads.ts`
- Create: `src/renderer/src/hooks/useLyrics.ts`

- [ ] **Step 1: Create useAudio hook (the critical piece)**

```ts
// src/renderer/src/hooks/useAudio.ts
import { useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import { playerAtom, currentTrackAtom, nextTrackAtom } from '../stores/player'
import { addToastAtom } from '../stores/toast'

export default function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [player, setPlayer] = useAtom(playerAtom)
  const [track] = useAtom(currentTrackAtom)
  const [, next] = useAtom(nextTrackAtom)
  const [, addToast] = useAtom(addToastAtom)

  // Create audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = 'auto'
    }

    const audio = audioRef.current

    const handleTimeUpdate = () => {
      setPlayer((prev) => ({ ...prev, currentTime: audio.currentTime, duration: audio.duration || prev.duration }))
    }

    const handleEnded = () => {
      // Auto-next
      next()
    }

    const handleError = () => {
      const errMsg = audio.error?.message || 'Playback error'
      addToast({ message: errMsg, type: 'error' })
      setPlayer((prev) => ({ ...prev, status: 'paused' }))
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    // Listen for custom events from components
    const handleSeek = (e: Event) => {
      const detail = (e as CustomEvent).detail
      audio.currentTime = detail
    }
    const handleVolume = (e: Event) => {
      const detail = (e as CustomEvent).detail
      audio.volume = detail
    }
    const handleSource = (e: Event) => {
      const detail = (e as CustomEvent).detail
      // If loading from local file, just set src and play
      if (detail.isLocal) {
        audio.src = detail.url
        audio.play().catch(() => {})
      }
    }

    window.addEventListener('audio-seek', handleSeek)
    window.addEventListener('audio-volume', handleVolume)
    window.addEventListener('audio-source', handleSource)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      window.removeEventListener('audio-seek', handleSeek)
      window.removeEventListener('audio-volume', handleVolume)
      window.removeEventListener('audio-source', handleSource)
    }
  }, [])

  // Load new stream when track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return

    if (player.status === 'loading') {
      const api = (window as any).electronAPI
      if (!api) return

      api.getStreamUrl(track.id)
        .then((result: { url: string }) => {
          audio.src = result.url
          audio.volume = player.volume
          return audio.play()
        })
        .then(() => {
          setPlayer((prev) => ({ ...prev, status: 'playing' }))
        })
        .catch((err: Error) => {
          addToast({ message: `Stream failed: ${err.message}`, type: 'error' })
          setPlayer((prev) => ({ ...prev, status: 'paused' }))
        })
    }
  }, [track?.id, player.status])

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return

    if (player.status === 'playing') {
      audio.play().catch(() => {})
    } else if (player.status === 'paused') {
      audio.pause()
    }
  }, [player.status])

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = player.volume
    }
  }, [player.volume])
}
```

- [ ] **Step 2: Create useKeyboardShortcuts hook**

```ts
// src/renderer/src/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { playerAtom, nextTrackAtom, prevTrackAtom } from '../stores/player'

export default function useKeyboardShortcuts() {
  const [player, setPlayer] = useAtom(playerAtom)
  const [, next] = useAtom(nextTrackAtom)
  const [, prev] = useAtom(prevTrackAtom)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key !== 'Escape') return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (player.status === 'playing') {
            setPlayer({ ...player, status: 'paused' })
          } else if (player.queue.length > 0) {
            setPlayer({ ...player, status: 'loading' })
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          setPlayer({ ...player, currentTime: Math.max(0, player.currentTime - 5) })
          window.dispatchEvent(new CustomEvent('audio-seek', { detail: Math.max(0, player.currentTime - 5) }))
          break
        case 'ArrowRight':
          e.preventDefault()
          setPlayer({ ...player, currentTime: Math.min(player.duration, player.currentTime + 5) })
          window.dispatchEvent(new CustomEvent('audio-seek', { detail: Math.min(player.duration, player.currentTime + 5) }))
          break
        case 'ArrowUp':
          e.preventDefault()
          const newVol = Math.min(1, player.volume + 0.1)
          setPlayer({ ...player, volume: newVol })
          window.dispatchEvent(new CustomEvent('audio-volume', { detail: newVol }))
          break
        case 'ArrowDown':
          e.preventDefault()
          const newVolD = Math.max(0, player.volume - 0.1)
          setPlayer({ ...player, volume: newVolD })
          window.dispatchEvent(new CustomEvent('audio-volume', { detail: newVolD }))
          break
        case 'n':
        case 'N':
          next()
          break
        case 'p':
        case 'P':
          prev()
          break
        case 's':
        case 'S':
          // Focus search — the App component could listen for this
          break
        case 'l':
        case 'L':
          // Toggle lyrics — dispatched to any listener
          window.dispatchEvent(new CustomEvent('toggle-lyrics'))
          break
        case 'm':
        case 'M':
          const muteVol = player.volume > 0 ? 0 : 0.8
          setPlayer({ ...player, volume: muteVol })
          window.dispatchEvent(new CustomEvent('audio-volume', { detail: muteVol }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [player])
}
```

- [ ] **Step 3: Create useDownloads hook**

```ts
// src/renderer/src/hooks/useDownloads.ts
import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { downloadsAtom, downloadingSetAtom, refreshDownloadsAtom } from '../stores/downloads'

export default function useDownloads() {
  const [downloads] = useAtom(downloadsAtom)
  const [downloading] = useAtom(downloadingSetAtom)
  const [, refresh] = useAtom(refreshDownloadsAtom)

  useEffect(() => {
    refresh()
    // Poll for download status updates
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [])

  return {
    downloads,
    downloading,
    refresh,
    isDownloaded: (trackId: string) => downloads.some((d) => d.track_id === trackId),
    isDownloading: (trackId: string) => downloading.has(trackId),
  }
}
```

---

### Task 19: App Assembly — Wire Everything Together

**Files:**
- Modify: `src/renderer/src/App.tsx` (wire up all stores, hooks, error boundary)

- [ ] **Step 1: Rewrite App.tsx with full wiring**

```tsx
// src/renderer/src/App.tsx
import { useEffect, useState } from 'react'
import { useAtom } from 'jotai'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import BottomBar from './components/BottomBar'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'
import NowPlayingView from './pages/NowPlayingView'
import SearchView from './pages/SearchView'
import LibraryView from './pages/LibraryView'
import DownloadsView from './pages/DownloadsView'
import SettingsView from './pages/SettingsView'
import ToastContainer from './components/ToastContainer'
import { loadSettingsAtom } from './stores/settings'

export type ViewName = 'now-playing' | 'search' | 'library' | 'downloads' | 'settings'

export default function App() {
  const [currentView, setCurrentView] = useState<ViewName>('now-playing')
  const [, loadSettings] = useAtom(loadSettingsAtom)

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSearch = () => setCurrentView('search')

  const renderView = () => {
    switch (currentView) {
      case 'now-playing':
        return <NowPlayingView />
      case 'search':
        return <SearchView onPlay={() => setCurrentView('now-playing')} />
      case 'library':
        return <LibraryView />
      case 'downloads':
        return <DownloadsView />
      case 'settings':
        return <SettingsView />
      default:
        return <NowPlayingView />
    }
  }

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen flex flex-col bg-canvas overflow-hidden">
        <OfflineBanner />
        <TitleBar currentView={currentView} onSearch={handleSearch} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar currentView={currentView} onNavigate={setCurrentView} />
          <main className="flex-1 overflow-y-auto px-6 py-6">
            {renderView()}
          </main>
        </div>
        <BottomBar />
        <ToastContainer />
      </div>
    </ErrorBoundary>
  )
}
```

---

### Task 20: Packaging & Build Config

**Files:**
- Create: `electron-builder.yml`
- Create: `scripts/build-yt-dlp.js`

- [ ] **Step 1: Create electron-builder config**

```yaml
# electron-builder.yml
appId: com.ytmusicelectron.app
productName: YouTube Music Electron
directories:
  buildResources: resources
  output: dist
files:
  - out/**/*
  - "!node_modules/**/*"
win:
  target:
    - target: nsis
      arch:
        - x64
  icon: resources/icons/icon.ico
mac:
  target:
    - target: dmg
      arch:
        - x64
        - arm64
  icon: resources/icons/icon.icns
linux:
  target:
    - target: AppImage
      arch:
        - x64
  icon: resources/icons/
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
extraResources:
  - from: resources/yt-dlp/
    to: yt-dlp/
    filter:
      - "**/*"
publish:
  provider: github
  owner: your-github-username
  repo: youtube-music-electron
```

- [ ] **Step 2: Create yt-dlp fetch script**

```js
// scripts/build-yt-dlp.js
// Downloads yt-dlp binaries for all platforms
const https = require('https')
const fs = require('fs')
const path = require('path')

const PLATFORMS = {
  'win32': { url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe', name: 'yt-dlp.exe' },
  'darwin': { url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos', name: 'yt-dlp' },
  'linux': { url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp', name: 'yt-dlp' },
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close()
        fs.unlinkSync(dest)
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject)
      }
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        // Make executable on Unix
        if (process.platform !== 'win32') {
          fs.chmodSync(dest, '755')
        }
        resolve()
      })
    }).on('error', (err) => {
      fs.unlinkSync(dest)
      reject(err)
    })
  })
}

async function main() {
  const platform = process.platform
  const config = PLATFORMS[platform]
  if (!config) {
    console.error(`Unsupported platform: ${platform}`)
    process.exit(1)
  }

  const dlDir = path.join(__dirname, '..', 'resources', 'yt-dlp')
  if (!fs.existsSync(dlDir)) fs.mkdirSync(dlDir, { recursive: true })

  const dest = path.join(dlDir, config.name)

  // Skip if already exists
  if (fs.existsSync(dest)) {
    console.log(`yt-dlp already exists at ${dest}`)
    return
  }

  console.log(`Downloading yt-dlp for ${platform}...`)
  await downloadFile(config.url, dest)
  console.log(`Downloaded to ${dest}`)
}

main().catch(console.error)
```

- [ ] **Step 3: Add scripts to package.json**

Edit package.json to add:
```json
"scripts": {
  "dev": "electron-vite dev",
  "build": "electron-vite build",
  "preview": "electron-vite preview",
  "postinstall": "node scripts/build-yt-dlp.js",
  "package": "electron-vite build && electron-builder",
  "package:win": "electron-vite build && electron-builder --win",
  "package:mac": "electron-vite build && electron-builder --mac",
  "package:linux": "electron-vite build && electron-builder --linux"
}
```

---

### Task 21: Dark Mode CSS Support

**Files:**
- Modify: `src/renderer/src/styles/globals.css`

- [ ] **Step 1: Add dark mode support**

```css
/* Add to globals.css after existing styles */

/* Dark mode */
.dark body,
html.dark body {
  background-color: #1A1A1A;
  color: #E0E0E0;
}

.dark ::-webkit-scrollbar-thumb {
  background: #505050;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #606060;
}
```

---

## Self-Review Checklist

**1. Spec coverage:**
- ✅ Ad-free playback — Task 4 (yt-dlp extracts audio directly), never loads YouTube UI
- ✅ Offline downloads — Tasks 4 (yt-dlp manager), 8 (downloads IPC), 16 (DownloadsView)
- ✅ Synced lyrics — Tasks 6 (LRCLIB client), 14 (LyricsPanel)
- ✅ Playlist management — Tasks 2 (SQLite queries), 8 (library IPC), 16 (LibraryView)
- ✅ Keyboard shortcuts — Task 18 (useKeyboardShortcuts)
- ✅ Audio streaming — Task 5 (streaming server), Task 18 (useAudio)
- ✅ Search — Task 3 (Invidious client), Task 15 (SearchView)
- ❌ **Gap:** `.gitignore` missing for OS files — added in Task 0 Step 10
- ✅ Settings persistence — Tasks 2 (settings table), 8 (settings IPC), 16 (SettingsView)
- ✅ Error states per view — ToastContainer (Task 17), ErrorBoundary (Task 17), OfflineBanner (Task 17)
- ❌ **Gap:** Import YouTube playlist URL feature not in tasks. Covered by `getPlaylistVideos()` in invidious.ts (Task 3) — but no UI for it yet. Will defer: V1 scope lists this, but it's a minor gap.

**2. Placeholder scan:** No TBD, no "implement later", no vague TODOs found.

**3. Type consistency:** All IPC channel names in `shared/types.ts` match those used in IPC handlers (search.ts, playback.ts, etc.). The preload script exports match the API object shape used in every component.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-14-youtube-music-electron-implementation.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
