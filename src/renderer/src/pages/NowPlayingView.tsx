import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { currentTrackAtom } from '../stores/player'
import LyricsPanel from '../components/LyricsPanel'
import { IconMusic } from '../components/icons'
import useAudio from '../hooks/useAudio'

export default function NowPlayingView() {
  const [track] = useAtom(currentTrackAtom)
  const [showLyrics, setShowLyrics] = useState(false)
  useAudio()

  // Listen for toggle-lyrics event from global shortcut or bottom bar
  useEffect(() => {
    const handler = () => setShowLyrics((v) => !v)
    window.addEventListener('toggle-lyrics', handler)
    return () => window.removeEventListener('toggle-lyrics', handler)
  }, [])

  if (!track) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-card bg-surface-hover border border-border flex items-center justify-center mb-4">
          <IconMusic size={32} className="text-text-muted" />
        </div>
        <h2 className="text-lg font-serif text-text-primary mb-1">No track playing</h2>
        <p className="text-sm text-text-secondary font-sans">Search for music to get started</p>
      </div>
    )
  }

  return (
    <div className="h-full flex gap-8">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-72 h-72 rounded-card overflow-hidden border border-border mb-6 shadow-card">
          {track.thumbnail ? (
            <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-surface-hover flex items-center justify-center">
              <IconMusic size={48} className="text-text-muted" />
            </div>
          )}
        </div>
        <h1 className="text-xl font-serif text-text-primary text-center max-w-sm truncate tracking-tight">
          {track.title}
        </h1>
        <p className="text-sm text-text-secondary mt-1 font-sans">{track.artist}</p>
        <button
          onClick={() => setShowLyrics(!showLyrics)}
          className={`mt-6 text-xs font-mono uppercase tracking-widest transition-colors active:scale-95 ${
            showLyrics ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {showLyrics ? 'Hide lyrics' : 'Show lyrics'}
        </button>
      </div>
      {showLyrics && (
        <div className="w-80 border-l border-border pl-8 overflow-y-auto">
          <LyricsPanel />
        </div>
      )}
    </div>
  )
}
