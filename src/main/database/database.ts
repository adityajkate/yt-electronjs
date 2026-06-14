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
