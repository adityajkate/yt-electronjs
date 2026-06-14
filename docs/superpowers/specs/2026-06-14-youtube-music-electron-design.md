# YouTube Music Electron — Free, Advanced Desktop Player

**Date:** 2026-06-14
**Status:** Design — approved, ready for implementation planning

---

## 1. Purpose

A free, open-source Electron desktop app that wraps YouTube Music without requiring YouTube Premium. Provides ad-free playback, offline downloads, synced lyrics, advanced audio controls, and playlist management behind a warm minimalist UI.

**Key goals:** zero ads, full offline capability, high-quality audio extraction, clean editorial interface.

---

## 2. Architecture

### 2.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────┐
│              Renderer Process (React + Vite)             │
│   ┌───────────┐  ┌──────────┐  ┌───────────────────┐   │
│   │ Player UI  │  │ Library  │  │ Search / Browse    │   │
│   │ (controls, │  │ (playlists,│ │ (discover music)   │   │
│   │  progress) │  │  downloads)│ │                    │   │
│   └─────┬─────┘  └────┬─────┘  └─────────┬─────────┘   │
│         │             │                  │              │
│   ┌─────┴─────────────┴──────────────────┴──────────┐  │
│   │         IPC Bridge (electron contextBridge)       │  │
│   └──────────────────────┬───────────────────────────┘  │
├──────────────────────────┼──────────────────────────────┤
│              Main Process (Electron)                    │
│   ┌──────────────────────┴───────────────────────────┐  │
│   │              IPC Handler Layer                    │  │
│   └──┬───────────┬───────────┬──────────────────────┘  │
│   ┌──┴──────┐ ┌──┴──────┐ ┌──┴─────────────┐         │
│   │ yt-dlp  │ │ SQLite   │ │ Invidious API  │         │
│   │ Manager  │ │ Database│ │ Client          │         │
│   └─────────┘ └─────────┘ └─────────────────┘         │
│   ┌──────────────────────────────────────────────┐     │
│   │  Media Controls (OS media keys, tray)        │     │
│   │  Local Streaming Server (for live playback)   │     │
│   └──────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Audio Pipeline

- **Search:** Renderer → IPC → Invidious API Client → YouTube search results
- **Live streaming:** yt-dlp extracts audio stream → local HTTP server → `<audio>` element
- **Offline playback:** yt-dlp downloads full audio file (AAC) → saved to app data dir → SQLite tracks availability → plays from disk
- **Cache:** Recently played tracks auto-cached locally to avoid re-downloading

### 2.3 Process Separation

All I/O lives exclusively in the main process:
- Renderer never calls yt-dlp, Invidious, or SQLite directly
- Every operation goes through `contextBridge` + `ipcMain`
- Streaming avoids complex stream piping by writing to a temp file served via a local Node.js HTTP server
- This also means crashes in the renderer never lose playback or downloads

### 2.4 Error Handling Strategy

Every IPC call uses a `.catch()` handler that maps failures to user-facing messages:

| Error | User Experience |
|-------|-----------------|
| No network | Offline banner, cached content only |
| Invidious instance down | Try next instance from fallback list |
| yt-dlp rate-limit | Toast + auto-retry with backoff |
| Stream failed | Auto-skip to next track in queue |
| Disk full | Warning toast, pause downloads |

---

## 3. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Desktop shell | Electron 33+ | Cross-platform, mature ecosystem |
| UI framework | React 18 + Vite | Fast HMR, best ecosystem for audio UIs |
| State management | Jotai | Minimal boilerplate, signals-style reactivity |
| Styling | Tailwind (custom warm-minimalist theme) | Per design directive; no default Tailwind shadows |
| Database | better-sqlite3 | Synchronous, fast, no setup overhead |
| Audio extraction | yt-dlp (embedded binary) | Industry standard, actively maintained |
| Search/metadata | Invidious API (REST, no auth) | Open-source YouTube frontend, self-hostable |
| Lyrics | LRCLIB API (REST, no auth) | Open, synced lyrics, no registration |
| IPC | contextBridge + ipcMain | Standard Electron secure IPC |
| Bundler | electron-builder (NSIS/DMG/AppImage) | Mature packaging for all platforms |

---

## 4. Folder Structure

```
yt-electronjs/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── ipc/                 # IPC handlers per domain
│   │   │   ├── search.ts
│   │   │   ├── playback.ts
│   │   │   ├── downloads.ts
│   │   │   ├── library.ts
│   │   │   └── settings.ts
│   │   ├── services/
│   │   │   ├── yt-dlp.ts        # yt-dlp command builder + child process wrapper
│   │   │   ├── invidious.ts     # Invidious API client
│   │   │   ├── lrclib.ts        # LRCLIB lyrics fetcher
│   │   │   ├── cache.ts         # Stream cache management
│   │   │   └── streaming-server.ts  # Local HTTP streaming
│   │   ├── database/
│   │   │   ├── schema.ts        # Table definitions
│   │   │   ├── migrations.ts    # Versioned migrations
│   │   │   └── queries.ts       # Prepared queries
│   │   ├── media/
│   │   │   ├── tray.ts          # System tray
│   │   │   └── media-keys.ts    # Global media key bindings (MSM)
│   │   └── window.ts            # BrowserWindow setup, config persistence
│   ├── renderer/                # React app
│   │   ├── components/
│   │   │   ├── TitleBar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BottomBar.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── VolumeSlider.tsx
│   │   │   ├── SearchBox.tsx
│   │   │   ├── TrackCard.tsx
│   │   │   ├── PlaylistCard.tsx
│   │   │   ├── LyricsPanel.tsx
│   │   │   ├── DownloadQueue.tsx
│   │   │   ├── ToastContainer.tsx
│   │   │   ├── OfflineBanner.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── pages/
│   │   │   ├── NowPlayingView.tsx
│   │   │   ├── SearchView.tsx
│   │   │   ├── LibraryView.tsx
│   │   │   ├── DownloadsView.tsx
│   │   │   └── SettingsView.tsx
│   │   ├── stores/
│   │   │   ├── player.ts
│   │   │   ├── library.ts
│   │   │   ├── downloads.ts
│   │   │   └── settings.ts
│   │   ├── hooks/
│   │   │   ├── useAudio.ts
│   │   │   ├── useKeyboardShortcuts.ts
│   │   │   ├── useDownloads.ts
│   │   │   └── useLyrics.ts
│   │   ├── styles/
│   │   │   └── globals.css     # Tailwind entry + minimalist theme
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── shared/
│       └── types.ts             # Track, Playlist, DownloadJob, IPC channel names
├── resources/
│   ├── yt-dlp/                  # Bundled yt-dlp binaries per-platform
│   ├── icons/                   # App icons (macOS .icns, Windows .ico, Linux .png)
│   └── tray/                    # Tray icons (light/dark variants)
├── scripts/
│   ├── build-yt-dlp.js          # Script to fetch + verify yt-dlp binaries
│   └── postinstall.js
├── electron-builder.yml
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. UI Layout & Component Tree

### 5.1 Window Chrome

- Frameless window with custom title bar (macOS traffic-light window controls)
- Default: 1100×720, persists position between launches
- Title bar is ~36px, shows app name in monospace, search box centered

### 5.2 Screen Layout

```
┌──────────────────────────────────────────────────┐
│  ● ● ●          ◁ ▷ ⋮ ─ [search]    [⚙️]       │
├────────┬─────────────────────────────────────────┤
│        │                                         │
│  ♫ Now │        [ Main Content Area ]            │
│   Playing│                                       │
│        │                                         │
│  ❏ Library│                                     │
│        │                                         │
│  ⬇ Downloads│                                   │
│        │                                         │
│  ▤ Playlists│                                   │
│        │                                         │
│        │                                         │
├────────┴─────────────────────────────────────────┤
│  ♫ Song Title · Artist           ═══●═══   3:42  │
│              Prev  ▶⏸  Next  ♡                   │
└──────────────────────────────────────────────────┘
```

### 5.3 Component Tree

```
App
├── TitleBar            # Frameless drag region, traffic-light controls, search
├── Sidebar             # 5 compact nav items (Now Playing, Search, Library, Downloads, Settings)
├── MainContent         # Route-driven: Router renders one of:
│   ├── NowPlayingView  # Album art (~60%), lyrics side-panel (togglable), queue drawer
│   ├── SearchView      # Input → bento-grid results (asymmetrical CSS grid)
│   ├── LibraryView     # Playlist cards + "Favorites" section
│   ├── DownloadsView   # Table/grid of offline tracks + storage usage indicator
│   └── SettingsView    # Instance URL, quality, download path, theme, startup behavior
├── BottomBar           # Persistent mini-player (always visible)
│   ├── TrackInfo       # 40×40 cover, title (truncated), artist
│   ├── ProgressBar     # Thin clickable/draggable line
│   ├── PlaybackControls# Prev, Play/Pause, Next, Shuffle toggle, Repeat toggle
│   └── VolumeSlider    # Compact horizontal slider
└── ToastContainer      # Non-intrusive bottom-right notifications
```

### 5.4 Styling Constraints (Minimalist-UI Directive)

- **Colors:** Warm monochrome palette — canvas `#F7F6F3`, cards `#FFFFFF`, borders `1px solid #EAEAEA`
- **Accents:** Only desaturated pastels — pale red `#FDEBEC`, pale blue `#E1F3FE`, pale green `#EDF3EC`
- **Typography:** Sans-serif for UI (SF Pro Display/Geist), serif for headings (Newsreader/Instrument Serif), monospace for metadata (Geist Mono/JetBrains Mono). Body text never `#000000` — use `#2F3437`.
- **Shapes:** Border-radius `8px` or `12px` max, no `rounded-full` on containers. `rounded-full` allowed only on tags/badges.
- **Shadows:** None or ultra-subtle (`rgba(0,0,0,0.04)`). No `shadow-md`/`shadow-lg`.
- **Dark mode:** Inverted warm-dark palette — canvas `#1A1A1A`, surface `#2A2A2A`, cards `#2E2E2E`, borders `#3A3A3A`, body text `#E0E0E0`. Accent pastels shift to darker variants (e.g., muted red `#4A2020`/`#FFB3B3`).
- **Motion:** Scroll entry fade-in (`translateY(12px)` + opacity over 600ms). Hover card lift (`0 2px 8px rgba(0,0,0,0.04)`). Staggered reveals via `--index` delay. `transform` + `opacity` only.

---

## 6. Features

### 6.1 Ad-Free Playback

No ad-blocker needed. The app never loads YouTube's UI or player — audio is extracted directly via yt-dlp and played in our own `<audio>` element. YouTube ads cannot reach the user.

### 6.2 Offline Downloads

- Background download queue (browse while downloading)
- Tracks encoded to AAC (~3 MB/track, excellent quality-to-size ratio)
- Interrupted downloads resume on restart
- Each track shows download status icon; right-click → remove offline copy
- Offline-first: downloaded tracks play from disk even when online
- SQLite index tracks what is available offline

### 6.3 Synced Lyrics (LRCLIB)

- Button in bottom bar toggles lyrics panel (slides in from right)
- Queries LRCLIB API by artist + title on track change
- Synced lines highlight in real-time against audio progress
- Falls back to plain text if synced unavailable
- Gracefully shows nothing if track not found on LRCLIB

### 6.4 Playlist Management

- Create, edit, delete playlists (persisted in SQLite)
- Drag-and-drop reorder within queue
- "Add to playlist" context menu on any track
- Import YouTube playlist URLs (resolves via Invidious API)
- All playlists local-only (no cloud sync in V1)

### 6.5 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` / `→` | Rewind / Forward 5s |
| `↑` / `↓` | Volume up / down |
| `N` | Next track |
| `P` | Previous track |
| `S` | Focus search |
| `L` | Toggle lyrics panel |
| `F` | Toggle fullscreen |
| `M` | Mute |
| `/` | Quick search |

### 6.6 Settings Panel

- **Invidious Instance URL** — configurable, with known-good fallback list
- **Download quality** — low (128kbps AAC/m4a), medium (256kbps AAC), high (best audio — yt-dlp `-f bestaudio`)
- **Download location** — custom directory picker
- **Theme** — light / dark mode toggle
- **Startup behavior** — minimize to tray, remember last playlist
- **Auto-update** — enabled by default (GitHub Releases)

---

## 7. Data Flow & State Architecture (Jotai)

```typescript
// Player
playerAtom = atom<{
  queue: Track[]
  currentIndex: number
  status: 'idle' | 'loading' | 'playing' | 'paused'
  volume: number
  shuffle: boolean
  repeat: 'off' | 'one' | 'all'
}>

// Library
libraryAtom = atom<{
  playlists: Playlist[]
  favorites: Set<string>   // track IDs
}>

// Downloads
downloadsAtom = atom<{
  queue: DownloadJob[]
  completed: string[]       // track IDs available offline
  storageUsed: number       // bytes
}>

// Derived
isOfflineAtom = atom((get) => !navigator.onLine)
currentTrackAtom = atom((get) => get(playerAtom).queue[get(playerAtom).currentIndex])
```

- Queue is ephemeral (memory only — lost on restart unless saved as playlist)
- Download queue is persistent (SQLite — survives restarts, supports resume)
- All state updates go through IPC to keep main process authoritative on what's downloaded

---

## 8. Testing

| Layer | Tool | Scope |
|-------|------|-------|
| Unit (renderer) | Vitest + RTL | Component states (loading, empty, error, edge cases), store logic, shortcuts |
| Unit (main) | Vitest | yt-dlp command builder, Invidious API response parsing, SQLite query correctness |
| Integration | Playwright for Electron | Full flows: search → play → add to playlist → download → restart → play offline |
| E2E smoke | Manual checklist | Clean install, launch, search, play 3 tracks, download 1, restart, play offline |

Every UI component renders the following states:
- **Loading** — skeleton placeholders
- **Empty** — clean illustration + message
- **Error** — inline message + retry button (never a crash dialog)
- **Offline** — persistent thin banner: "Offline — showing cached content"

---

## 9. Packaging & Distribution

| Platform | Format | Notes |
|----------|--------|-------|
| Windows | NSIS installer | Via electron-builder |
| macOS | DMG | Not code-signed for V1 |
| Linux | AppImage | Tested on Ubuntu/Debian |
| Updates | Auto-updater | Pointed at GitHub Releases |

**Estimated bundle size:** 60–80 MB (Electron + yt-dlp binary + codecs + React app)

---

## 10. V1 Scope Boundary (explicitly excluded)

- YouTube login / importing likes or history
- Podcast support
- Video playback (audio-only by design)
- Music recommendations / algorithmic discovery
- Cloud sync of playlists (local-only)
- Chromecast / AirPlay / Spotify Connect
- Equalizer / audio DSP

---

## 11. Error States Per View

| View | Error Scenario | UX |
|------|---------------|----|
| Any | No network | Offline banner, cached content still playable |
| Search | Invidious down | Toast: "Search unavailable — trying another instance" |
| Playback | Stream failed | Auto-skip to next track |
| Download | Disk full | Toast: "Not enough disk space" |
| Download | yt-dlp error | Toast with specific error (rate-limit, geo-block, age-restriction) |
| Lyrics | Not found | Empty panel — no toast, no error message |
| Settings | Invalid instance URL | Inline validation error |
