import { useAtom } from 'jotai'
import { playerAtom, currentTrackAtom } from '../stores/player'
import ProgressBar from './ProgressBar'
import VolumeSlider from './VolumeSlider'
import { IconPlay, IconPause, IconSkipPrev, IconSkipNext, IconLyrics } from './icons'

declare global {
  interface Window { electronAPI: any }
}

export default function BottomBar() {
  const [player, setPlayer] = useAtom(playerAtom)
  const [track] = useAtom(currentTrackAtom)

  const handlePlayPause = () => {
    if (player.status === 'playing') {
      setPlayer({ ...player, status: 'paused' })
    } else if (player.queue.length > 0) {
      setPlayer({ ...player, status: 'loading' })
    }
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

  if (!track) {
    return (
      <div className="h-bottombar flex items-center px-6 bg-canvas border-t border-border shrink-0">
        <span className="text-sm text-text-muted font-sans">No track playing</span>
      </div>
    )
  }

  return (
    <div className="h-bottombar flex flex-col bg-canvas border-t border-border shrink-0">
      <div className="px-6 py-1">
        <ProgressBar currentTime={player.currentTime} duration={player.duration} onSeek={handleSeek} />
      </div>
      <div className="flex items-center justify-between px-6 pb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 bg-surface-hover rounded-card overflow-hidden shrink-0 border border-border">
            {track.thumbnail && (
              <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-text-primary truncate max-w-[200px] font-sans">{track.title}</p>
            <p className="text-xs text-text-secondary truncate max-w-[200px] font-sans">{track.artist}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-text-muted hover:text-text-primary transition-colors active:scale-95">
            <IconSkipPrev size={18} />
          </button>
          <button
            onClick={handlePlayPause}
            className="w-9 h-9 flex items-center justify-center bg-text-primary text-canvas rounded-card hover:opacity-90 transition-all active:scale-95"
          >
            {player.status === 'playing' ? <IconPause size={18} /> : <IconPlay size={18} />}
          </button>
          <button className="text-text-muted hover:text-text-primary transition-colors active:scale-95">
            <IconSkipNext size={18} />
          </button>
        </div>
        <div className="flex items-center gap-3 flex-1 justify-end">
          <button className="text-text-muted hover:text-text-primary transition-colors active:scale-95" title="Show lyrics">
            <IconLyrics size={18} />
          </button>
          <VolumeSlider volume={player.volume} muted={player.volume === 0} onVolumeChange={handleVolumeChange} onToggleMute={handleToggleMute} />
        </div>
      </div>
    </div>
  )
}
