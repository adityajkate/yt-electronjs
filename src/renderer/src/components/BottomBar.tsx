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

  const handleVolume = (volume: number) => {
    setPlayer({ ...player, volume })
    window.dispatchEvent(new CustomEvent('audio-volume', { detail: volume }))
  }

  const handleToggleMute = () => {
    const v = player.volume > 0 ? 0 : 0.8
    setPlayer({ ...player, volume: v })
    window.dispatchEvent(new CustomEvent('audio-volume', { detail: v }))
  }

  const handleLyrics = () => window.dispatchEvent(new CustomEvent('toggle-lyrics'))

  if (!track) {
    return (
      <div className="h-16 flex items-center justify-center glass shrink-0 relative z-[2]">
        <span className="caption text-text-muted">No track playing</span>
      </div>
    )
  }

  return (
    <div className="shrink-0 relative z-[2] glass">
      <div className="px-5 pt-1.5">
        <ProgressBar currentTime={player.currentTime} duration={player.duration} onSeek={handleSeek} />
      </div>
      <div className="flex items-center justify-between px-5 pb-2 h-14">
        {/* Track info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-[8px] overflow-hidden shrink-0 depth-1">
            {track.thumbnail ? (
              <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-hover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-text-primary truncate max-w-[180px] font-medium leading-tight">{track.title}</p>
            <p className="text-xs text-text-secondary truncate max-w-[180px] leading-relaxed">{track.artist}</p>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-1">
          <button className="btn-icon" title="Shuffle"><IconShuffle size={16} /></button>
          <button className="btn-icon" onClick={() => prev()} title="Previous"><IconSkipPrev size={17} /></button>
          <button className="btn-play" onClick={handlePlayPause} title={player.status === 'playing' ? 'Pause' : 'Play'}>
            {player.status === 'playing' ? <IconPause size={16} /> : <IconPlay size={16} />}
          </button>
          <button className="btn-icon" onClick={() => next()} title="Next"><IconSkipNext size={17} /></button>
          <button className="btn-icon" title="Repeat"><IconRepeat size={16} /></button>
        </div>

        {/* Volume & extras */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <button className="btn-icon" title="Like"><IconHeart size={16} /></button>
          <button className="btn-icon" onClick={handleLyrics} title="Lyrics"><IconLyrics size={16} /></button>
          <VolumeSlider volume={player.volume} muted={player.volume === 0} onVolumeChange={handleVolume} onToggleMute={handleToggleMute} />
        </div>
      </div>
    </div>
  )
}
