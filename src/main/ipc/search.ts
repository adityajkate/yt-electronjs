// src/main/ipc/search.ts
import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import { searchTracks, getVideoDetail } from '../services/invidious'
import { searchYoutube } from '../services/yt-dlp'

export function registerSearchHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SEARCH, async (_event, query: string) => {
    // Try Invidious first (fast, sub-second)
    try {
      const result = await searchTracks(query)
      if (result.tracks.length > 0) return result
    } catch {
      // Fall through to yt-dlp
    }

    // Fallback: yt-dlp search (slower but always works)
    const tracks = await searchYoutube(query, 10)
    return { tracks, nextPage: undefined }
  })

  ipcMain.handle(IPC_CHANNELS.GET_VIDEO, async (_event, videoId: string) => {
    try {
      return await getVideoDetail(videoId)
    } catch {
      // For single video, return minimal info from yt-dlp
      const tracks = await searchYoutube(videoId, 1)
      if (tracks.length > 0) return tracks[0]
      throw new Error('Could not fetch video details')
    }
  })
}
