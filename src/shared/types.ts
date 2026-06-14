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

// ── Navigation ──
export type ViewName = 'now-playing' | 'search' | 'library' | 'downloads' | 'settings'
