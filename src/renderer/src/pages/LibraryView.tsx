import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { playlistsAtom, favoritesAtom, refreshLibraryAtom } from '../stores/library'
import { playTrackAtom } from '../stores/player'
import { addToastAtom } from '../stores/toast'
import TrackCard from '../components/TrackCard'
import { IconLibrary, IconAdd } from '../components/icons'

export default function LibraryView() {
  const [playlists] = useAtom(playlistsAtom)
  const [favorites] = useAtom(favoritesAtom)
  const [, refresh] = useAtom(refreshLibraryAtom)
  const [, playTrack] = useAtom(playTrackAtom)
  const [, addToast] = useAtom(addToastAtom)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [showNewPlaylist, setShowNewPlaylist] = useState(false)

  useEffect(() => { refresh() }, [])

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return
    const api = (window as any).electronAPI
    if (!api) return
    await api.createPlaylist(newPlaylistName.trim())
    setNewPlaylistName(''); setShowNewPlaylist(false); refresh()
    addToast({ message: `Created "${newPlaylistName}"`, type: 'success' })
  }

  const handleDeletePlaylist = async (id: string, name: string) => {
    const api = (window as any).electronAPI
    if (!api) return
    await api.deletePlaylist(id); refresh()
    addToast({ message: `Deleted "${name}"`, type: 'info' })
  }

  return (
    <div>
      {favorites.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-mono uppercase tracking-widest text-text-muted mb-4">Favorites</h2>
          <div className="space-y-1">
            {favorites.map((fav: any) => (
              <TrackCard
                key={fav.track_id}
                track={{ id: fav.track_id, title: fav.title, artist: fav.artist, duration: 0, thumbnail: '' }}
                onPlay={(t) => playTrack(t)}
              />
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-text-muted">Playlists</h2>
        <button onClick={() => setShowNewPlaylist(true)} className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors">
          <IconAdd size={14} /> New
        </button>
      </div>

      {showNewPlaylist && (
        <div className="flex items-center gap-2 mb-4">
          <input type="text" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="Playlist name..." autoFocus
            className="flex-1 px-3 py-1.5 text-sm font-sans bg-surface border border-border rounded-card text-text-primary placeholder:text-text-muted outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()} />
          <button onClick={handleCreatePlaylist} className="text-xs text-text-primary bg-surface border border-border px-3 py-1.5 rounded-card active:scale-95 transition-transform">Create</button>
          <button onClick={() => setShowNewPlaylist(false)} className="text-xs text-text-muted px-2 py-1.5">Cancel</button>
        </div>
      )}

      {playlists.length === 0 && favorites.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-card bg-surface-hover border border-border flex items-center justify-center mx-auto mb-4">
            <IconLibrary size={24} className="text-text-muted" />
          </div>
          <p className="text-sm text-text-muted font-sans">Your library is empty. Save songs to playlists or mark them as favorites.</p>
        </div>
      )}

      {playlists.length > 0 && (
        <div className="space-y-2">
          {playlists.map((pl) => (
            <div key={pl.id} className="p-4 bg-surface border border-border rounded-card transition-shadow hover:shadow-card-hover">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-text-primary font-medium">{pl.name}</h3>
                <button onClick={() => handleDeletePlaylist(pl.id, pl.name)} className="text-xs text-text-muted hover:text-accent-red-text transition-colors">Delete</button>
              </div>
              {pl.description && <p className="text-xs text-text-secondary mb-2">{pl.description}</p>}
              <p className="text-xs text-text-muted">{pl.tracks?.length || 0} tracks</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
