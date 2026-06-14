import { useState, useCallback, useRef, useEffect } from 'react'
import { useAtom } from 'jotai'
import { playTrackAtom } from '../stores/player'
import { addToastAtom } from '../stores/toast'
import TrackCard from '../components/TrackCard'
import { IconSearch } from '../components/icons'
import type { Track } from '@shared/types'

interface SearchViewProps { onPlay: () => void }

export default function SearchView({ onPlay }: SearchViewProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, playTrack] = useAtom(playTrackAtom)
  const [, addToast] = useAtom(addToastAtom)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setError(null); return }
    setLoading(true)
    setError(null)
    try {
      const api = (window as any).electronAPI
      if (!api) throw new Error('API not available')
      const result = await api.search(q)
      setResults(result.tracks || [])
      if (result.tracks?.length === 0) setError('No results found')
    } catch (err: any) {
      setError(err.message || 'Search failed')
      addToast({ message: 'Search failed — trying again...', type: 'error' })
    } finally { setLoading(false) }
  }, [addToast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 400)
  }

  const handlePlay = (track: Track) => { playTrack(track); onPlay() }

  const handleDownload = async (track: Track) => {
    const api = (window as any).electronAPI
    if (!api) return
    try {
      addToast({ message: `Downloading ${track.title}...`, type: 'info' })
      await api.download({ id: track.id, title: track.title, artist: track.artist, duration: track.duration, thumbnail: track.thumbnail })
      addToast({ message: `Downloaded ${track.title}`, type: 'success' })
    } catch (err: any) {
      addToast({ message: `Download failed: ${err.message}`, type: 'error' })
    }
  }

  return (
    <div>
      <div className="relative mb-8">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          <IconSearch size={16} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search for songs, artists, albums..."
          className="w-full pl-10 pr-4 py-2.5 text-base font-sans bg-surface border border-border rounded-card text-text-primary placeholder:text-text-muted outline-none focus:border-text-muted transition-colors"
        />
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-12 h-12 bg-border rounded" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-border rounded w-3/4" />
                <div className="h-3 bg-border rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-sm text-text-muted">{error}</p>
          {query && <button onClick={() => doSearch(query)} className="mt-2 text-xs text-text-secondary hover:text-text-primary underline">Retry</button>}
        </div>
      )}

      {!loading && !error && results.length === 0 && query && (
        <div className="text-center py-12"><p className="text-sm text-text-muted">No results for "{query}"</p></div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-1">
          {results.map((track, i) => (
            <div key={track.id} style={{ animationDelay: `${i * 40}ms` }} className="animate-fade-in-up">
              <TrackCard track={track} onPlay={handlePlay} onDownload={handleDownload} />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && results.length === 0 && !query && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-card bg-surface-hover border border-border flex items-center justify-center mx-auto mb-4">
            <IconSearch size={24} className="text-text-muted" />
          </div>
          <p className="text-sm text-text-muted font-sans">Search for any song, artist, or album</p>
        </div>
      )}
    </div>
  )
}
