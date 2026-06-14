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
