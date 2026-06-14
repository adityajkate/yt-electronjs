import { IconVolume, IconVolumeMuted } from './icons'

interface VolumeSliderProps {
  volume: number
  muted: boolean
  onVolumeChange: (v: number) => void
  onToggleMute: () => void
}

export default function VolumeSlider({ volume, muted, onVolumeChange, onToggleMute }: VolumeSliderProps) {
  const displayVolume = muted ? 0 : volume

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onToggleMute} className="text-text-muted hover:text-text-primary transition-colors active:scale-90 p-0.5">
        {muted || volume === 0 ? <IconVolumeMuted size={14} /> : <IconVolume size={14} />}
      </button>
      <input
        type="range"
        min={0} max={1} step={0.01}
        value={displayVolume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        className="w-16 h-[3px] accent-text-primary cursor-pointer
          [&::-webkit-slider-runnable-track]:h-[3px] [&::-webkit-slider-runnable-track]:bg-border/70 [&::-webkit-slider-runnable-track]:rounded-full
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-text-primary [&::-webkit-slider-thumb]:shadow-sm"
      />
    </div>
  )
}
