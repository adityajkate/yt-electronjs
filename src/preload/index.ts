// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Search
  search: (query: string) => ipcRenderer.invoke('search:query', query),
  getVideoDetail: (videoId: string) => ipcRenderer.invoke('search:video-detail', videoId),

  // Playback
  getStreamUrl: (videoId: string) => ipcRenderer.invoke('playback:stream-url', videoId),
  playDownloaded: (videoId: string) => ipcRenderer.invoke('playback:play-downloaded', videoId),

  // Downloads
  download: (track: any) => ipcRenderer.invoke('downloads:start', track),
  cancelDownload: (trackId: string) => ipcRenderer.invoke('downloads:cancel', trackId),
  getDownloads: () => ipcRenderer.invoke('downloads:list'),
  removeDownload: (trackId: string) => ipcRenderer.invoke('downloads:remove', trackId),

  // Library
  listPlaylists: () => ipcRenderer.invoke('library:list-playlists'),
  createPlaylist: (name: string, description?: string) => ipcRenderer.invoke('library:create-playlist', name, description),
  deletePlaylist: (id: string) => ipcRenderer.invoke('library:delete-playlist', id),
  addTrackToPlaylist: (playlistId: string, track: any, position: number) => ipcRenderer.invoke('library:add-track', playlistId, track, position),
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => ipcRenderer.invoke('library:remove-track', playlistId, trackId),
  getFavorites: () => ipcRenderer.invoke('library:favorites'),
  toggleFavorite: (track: any) => ipcRenderer.invoke('library:toggle-favorite', track),
  isFavorite: (trackId: string) => ipcRenderer.invoke('library:is-favorite', trackId),

  // Lyrics
  getLyrics: (artist: string, title: string) => ipcRenderer.invoke('lyrics:get', artist, title),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (partial: any) => ipcRenderer.invoke('settings:set', partial),

  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api
