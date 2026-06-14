// src/main/ipc/downloads.ts
import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import { extractAudio } from '../services/yt-dlp'
import { addDownloadedTrack, getDownloadedTracks, removeDownloadedTrack } from '../database/database'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

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
