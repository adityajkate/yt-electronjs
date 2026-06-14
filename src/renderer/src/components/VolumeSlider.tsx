import { IconVolume, IconVolumeMuted } from './icons'

interface VolumeSliderProps {
  volume: number
  muted: boolean
  onVolumeChange: (v: number) => void
  onToggleMute: () => void
}

export default function VolumeSlider({ volume, muted, onVolumeChange, onToggleMute }: VolumeSliderProps) {
  return (
    <div className="flex items-center gap-1.5">
      <button className="btn-icon !w-7 !h-7" onClick={onToggleMute} title={muted ? 'Unmute' : 'Mute'}>
        {muted || volume === 0 ? <IconVolumeMuted size={14} /> : <IconVolume size={14} />}
      </button>
      <input
        type="range"
        min={0} max={1} step={0.01}
        value={muted ? 0 : volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        className="range-thin w-16"
      />
    </div>
  )
}
