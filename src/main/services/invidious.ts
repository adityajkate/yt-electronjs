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
