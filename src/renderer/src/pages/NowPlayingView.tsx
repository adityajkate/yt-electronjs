import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { currentTrackAtom, playerAtom } from '../stores/player'
import LyricsPanel from '../components/LyricsPanel'
import { IconMusic } from '../components/icons'

export default function NowPlayingView() {
  const [track] = useAtom(currentTrackAtom)
  const [player] = useAtom(playerAtom)
  const [showLyrics, setShowLyrics] = useState(false)

  useEffect(() => {
    const handler = () => setShowLyrics((v) => !v)
    window.addEventListener('toggle-lyrics', handler)
    return () => window.removeEventListener('toggle-lyrics', handler)
  }, [])

  const isPlaying = player.status === 'playing'

  if (!track) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8 animate-fade-in">
        <div className="w-24 h-24 rounded-[20px] bg-surface/50 border border-border flex items-center justify-center mb-6 depth-2">
          <IconMusic size={36} className="text-text-muted" />
        </div>
        <h2 className="heading-lg text-text-primary mb-2">No track playing</h2>
        <p className="caption max-w-xs">Search for music to get started</p>
      </div>
    )
  }

  return (
    <div className="h-full flex gap-10 animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Glow orb behind album art when playing */}
        {isPlaying && (
          <div className="absolute w-96 h-96 rounded-full bg-accent-yellow-text/5 blur-[80px] -z-0 animate-breathe" />
        )}

        {/* Album art with pulsing glow when playing */}
        <div className={`relative z-[1] mb-8 ${isPlaying ? 'animate-breathe' : ''}`}>
          <div className="w-80 h-80 rounded-[20px] overflow-hidden depth-4">
            {track.thumbnail ? (
              <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-hover flex items-center justify-center">
                <IconMusic size={56} className="text-text-muted" />
              </div>
            )}
          </div>
          {/* Gradient border ring — sits behind art */}
          <div className="absolute -inset-[2px] rounded-[22px] bg-gradient-to-b from-border/50 to-transparent -z-10" />
        </div>

        {/* Track info — dramatic typography */}
        <div className="text-center max-w-md z-[1]">
          <h1 className="heading-xl text-text-primary truncate mb-2">
            {track.title}
          </h1>
          <p className="body-sm text-text-secondary mb-6">{track.artist}</p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              className={`text-[11px] font-mono uppercase tracking-[0.15em] transition-all duration-300 active:scale-95 px-5 py-2 rounded-[8px] ${
                showLyrics
                  ? 'bg-text-primary text-canvas'
                  : 'border border-border text-text-muted hover:text-text-secondary hover:border-text-muted'
              }`}
            >
              {showLyrics ? 'Hide lyrics' : 'Show lyrics'}
            </button>
          </div>
        </div>
      </div>

      {/* Lyrics Panel */}
      {showLyrics && (
        <div className="w-80 border-l border-border/50 pl-8 overflow-y-auto animate-slide-up">
          <LyricsPanel />
        </div>
      )}
    </div>
  )
}
