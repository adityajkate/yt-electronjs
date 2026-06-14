// src/main/ipc/library.ts
import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import {
  getAllPlaylists, createPlaylist, deletePlaylist,
  getPlaylistTracks, addTrackToPlaylist, removeTrackFromPlaylist,
  getFavorites, toggleFavorite, isFavorite
} from '../database/database'

export function registerLibraryHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.LIBRARY_LIST, async () => {
    const playlists = getAllPlaylists()
    return Promise.all(
      playlists.map(async (p: any) => ({
        ...p,
        tracks: getPlaylistTracks(p.id),
      }))
    )
  })

  ipcMain.handle(IPC_CHANNELS.LIBRARY_CREATE, async (_event, name: string, description?: string) => {
    const id = crypto.randomUUID()
    createPlaylist(id, name, description || '')
    return { id, name, description }
  })

  ipcMain.handle(IPC_CHANNELS.LIBRARY_DELETE, async (_event, id: string) => {
    deletePlaylist(id)
  })

  ipcMain.handle(IPC_CHANNELS.LIBRARY_ADD_TRACK, async (_event, playlistId: string, track: any, position: number) => {
    addTrackToPlaylist(playlistId, track, position)
  })

  ipcMain.handle(IPC_CHANNELS.LIBRARY_REMOVE_TRACK, async (_event, playlistId: string, trackId: string) => {
    removeTrackFromPlaylist(playlistId, trackId)
  })

  ipcMain.handle('library:favorites', async () => {
    return getFavorites()
  })

  ipcMain.handle('library:toggle-favorite', async (_event, track: { id: string; title: string; artist: string }) => {
    return toggleFavorite(track)
  })

  ipcMain.handle('library:is-favorite', async (_event, trackId: string) => {
    return isFavorite(trackId)
  })
}
