import { useAtom } from 'jotai'
import { playerAtom, currentTrackAtom, nextTrackAtom, prevTrackAtom } from '../stores/player'
import ProgressBar from './ProgressBar'
import VolumeSlider from './VolumeSlider'
import { IconPlay, IconPause, IconSkipPrev, IconSkipNext, IconHeart, IconLyrics, IconShuffle, IconRepeat } from './icons'

declare global {
  interface Window { electronAPI: any }
}

export default function BottomBar() {
  const [player, setPlayer] = useAtom(playerAtom)
  const [track] = useAtom(currentTrackAtom)
  const [, next] = useAtom(nextTrackAtom)
  const [, prev] = useAtom(prevTrackAtom)

  const handlePlayPause = () => {
    if (player.status === 'playing') setPlayer({ ...player, status: 'paused' })
    else if (player.queue.length > 0) setPlayer({ ...player, status: 'loading' })
  }

  const handleSeek = (time: number) => {
    setPlayer({ ...player, currentTime: time })
    window.dispatchEvent(new CustomEvent('audio-seek', { detail: time }))
  }

  const handleVolumeChange = (volume: number) => {
    setPlayer({ ...player, volume })
    window.dispatchEvent(new CustomEvent('audio-volume', { detail: volume }))
  }

  const handleToggleMute = () => {
    const newVol = player.volume > 0 ? 0 : 0.8
    setPlayer({ ...player, volume: newVol })
    window.dispatchEvent(new CustomEvent('audio-volume', { detail: newVol }))
  }

  const handleToggleLyrics = () => window.dispatchEvent(new CustomEvent('toggle-lyrics'))

  if (!track) {
    return (
      <div className="h-bottombar flex items-center justify-center glass border-t border-border shrink-0 relative z-[2]">
        <span className="text-sm text-text-muted font-sans tracking-wide">No track playing</span>
      </div>
    )
  }

  return (
    <div className="h-bottombar flex flex-col shrink-0 relative z-[2] glass border-t border-border">
      <div className="px-6 pt-1">
        <ProgressBar currentTime={player.currentTime} duration={player.duration} onSeek={handleSeek} />
      </div>
      <div className="flex items-center justify-between px-6 pb-2 flex-1">
        {/* Track info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-[6px] overflow-hidden shrink-0 shadow-card">
            {track.thumbnail ? (
              <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-hover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-text-primary truncate max-w-[200px] font-sans font-medium leading-tight">{track.title}</p>
            <p className="text-xs text-text-secondary truncate max-w-[200px] font-sans leading-relaxed">{track.artist}</p>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-text-muted hover:text-text-secondary transition-colors active:scale-90" title="Shuffle">
            <IconShuffle size={16} />
          </button>
          <button onClick={() => prev()} className="p-1.5 text-text-muted hover:text-text-primary transition-colors active:scale-90" title="Previous">
            <IconSkipPrev size={18} />
          </button>
          <button
            onClick={handlePlayPause}
            className="w-9 h-9 flex items-center justify-center bg-text-primary text-canvas rounded-[8px] hover:opacity-85 transition-all active:scale-90"
            title={player.status === 'playing' ? 'Pause' : 'Play'}
          >
            {player.status === 'playing' ? <IconPause size={17} /> : <IconPlay size={17} />}
          </button>
          <button onClick={() => next()} className="p-1.5 text-text-muted hover:text-text-primary transition-colors active:scale-90" title="Next">
            <IconSkipNext size={18} />
          </button>
          <button className="p-1.5 text-text-muted hover:text-text-secondary transition-colors active:scale-90" title="Repeat">
            <IconRepeat size={16} />
          </button>
        </div>

        {/* Volume & extras */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <button className="text-text-muted hover:text-accent-red-text transition-colors active:scale-90" title="Like">
            <IconHeart size={16} />
          </button>
          <button onClick={handleToggleLyrics} className="text-text-muted hover:text-text-primary transition-colors active:scale-90" title="Lyrics">
            <IconLyrics size={16} />
          </button>
          <VolumeSlider volume={player.volume} muted={player.volume === 0} onVolumeChange={handleVolumeChange} onToggleMute={handleToggleMute} />
        </div>
      </div>
    </div>
  )
}
