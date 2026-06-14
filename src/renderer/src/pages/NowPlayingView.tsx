import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { currentTrackAtom } from '../stores/player'
import LyricsPanel from '../components/LyricsPanel'
import { IconMusic } from '../components/icons'

export default function NowPlayingView() {
  const [track] = useAtom(currentTrackAtom)
  const [showLyrics, setShowLyrics] = useState(false)

  useEffect(() => {
    const handler = () => setShowLyrics((v) => !v)
    window.addEventListener('toggle-lyrics', handler)
    return () => window.removeEventListener('toggle-lyrics', handler)
  }, [])

  if (!track) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-[16px] bg-surface/60 border border-border flex items-center justify-center mb-5 shadow-card">
          <IconMusic size={30} className="text-text-muted" />
        </div>
        <h2 className="text-2xl font-serif text-text-primary mb-1.5 tracking-tight">No track playing</h2>
        <p className="text-sm text-text-secondary font-sans">Search for music to get started</p>
      </div>
    )
  }

  return (
    <div className="h-full flex gap-10">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Album art with elevated shadow */}
        <div className="w-72 h-72 rounded-[16px] overflow-hidden mb-7 shadow-elevated">
          {track.thumbnail ? (
            <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-surface-hover flex items-center justify-center">
              <IconMusic size={48} className="text-text-muted" />
            </div>
          )}
        </div>
        {/* Dramatic typography */}
        <h1 className="text-3xl font-serif text-text-primary text-center max-w-sm truncate tracking-tight leading-tight">
          {track.title}
        </h1>
        <p className="text-sm text-text-secondary mt-1.5 font-sans tracking-wide">{track.artist}</p>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => setShowLyrics(!showLyrics)}
            className={`text-[11px] font-mono uppercase tracking-[0.15em] transition-all duration-200 active:scale-95 px-4 py-1.5 rounded-[6px] ${
              showLyrics
                ? 'bg-text-primary text-canvas'
                : 'text-text-muted hover:text-text-secondary border border-border hover:border-text-muted'
            }`}
          >
            {showLyrics ? 'Hide lyrics' : 'Show lyrics'}
          </button>
        </div>
      </div>
      {showLyrics && (
        <div className="w-80 border-l border-border/50 pl-8 overflow-y-auto">
          <LyricsPanel />
        </div>
      )}
    </div>
  )
}
