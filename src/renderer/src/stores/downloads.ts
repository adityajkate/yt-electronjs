// src/renderer/src/stores/downloads.ts
import { atom } from 'jotai'

export interface DownloadEntry {
  track_id: string
  title: string
  artist: string
  thumbnail?: string
  file_path: string
  file_size: number
  downloaded_at: number
}

export const downloadsAtom = atom<DownloadEntry[]>([])
export const downloadingSetAtom = atom(new Set<string>())

export const refreshDownloadsAtom = atom(null, async (_get, set) => {
  const api = (window as any).electronAPI
  if (!api) return
  const dl = await api.getDownloads()
  set(downloadsAtom, dl)
})
