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
          <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted mb-4">Favorites</h2>
          <div className="space-y-0.5">
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
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted">Playlists</h2>
        <button onClick={() => setShowNewPlaylist(true)} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
          <IconAdd size={13} /> New
        </button>
      </div>

      {showNewPlaylist && (
        <div className="flex items-center gap-2 mb-4">
          <input type="text" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="Playlist name..." autoFocus
            className="flex-1 px-3 py-1.5 text-sm font-sans bg-surface/80 border border-border rounded-[6px] text-text-primary placeholder:text-text-muted outline-none focus:border-text-muted/50 transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()} />
          <button onClick={handleCreatePlaylist} className="btn-primary text-xs">Create</button>
          <button onClick={() => setShowNewPlaylist(false)} className="btn-ghost text-xs">Cancel</button>
        </div>
      )}

      {playlists.length === 0 && favorites.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-[14px] bg-surface/60 border border-border flex items-center justify-center mx-auto mb-4 shadow-card">
            <IconLibrary size={22} className="text-text-muted" />
          </div>
          <p className="text-sm text-text-muted font-sans">Your library is empty</p>
          <p className="text-xs text-text-secondary font-sans mt-1">Save songs to playlists or mark as favorites</p>
        </div>
      )}

      {playlists.length > 0 && (
        <div className="space-y-2">
          {playlists.map((pl) => (
            <div key={pl.id} className="p-4 bg-surface/60 border border-border rounded-[8px] transition-all duration-200 hover:shadow-card-hover">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-sm text-text-primary font-medium tracking-tight">{pl.name}</h3>
                <button onClick={() => handleDeletePlaylist(pl.id, pl.name)} className="text-xs text-text-muted hover:text-accent-red-text transition-colors">Delete</button>
              </div>
              {pl.description && <p className="text-xs text-text-secondary mb-1.5">{pl.description}</p>}
              <p className="text-xs text-text-muted">{pl.tracks?.length || 0} tracks</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
