// src/main/ipc/lyrics.ts
import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import { searchLyrics } from '../services/lrclib'

export function registerLyricsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.GET_LYRICS, async (_event, artist: string, title: string) => {
    return searchLyrics(artist, title)
  })
}
