// src/main/ipc/playback.ts
import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import { extractAudio, getStreamOutputPath, getCacheDir } from '../services/yt-dlp'
import { getStreamUrl } from '../services/streaming-server'
import fs from 'fs'
import path from 'path'

let currentExtract: { abort: () => void } | null = null

export function registerPlaybackHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.STREAM_URL, async (_event, videoId: string) => {
    currentExtract?.abort()
    const cacheDir = getCacheDir()
    const existing = getStreamOutputPath(videoId, cacheDir)
    if (fs.existsSync(existing)) {
      const ext = path.extname(existing).replace('.', '')
      return { url: getStreamUrl(videoId, ext), cached: true }
    }
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
      })
    })
  })

  ipcMain.handle(IPC_CHANNELS.PLAY_DOWNLOADED, async (_event, videoId: string) => {
    const { app } = require('electron')
    const downloadsDir = path.join(app.getPath('userData'), 'downloads')
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
