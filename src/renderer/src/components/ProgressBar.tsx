interface ProgressBarProps {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

export default function ProgressBar({ currentTime, duration, onSeek }: ProgressBarProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    onSeek(pct * duration)
  }

  return (
    <div className="flex items-center gap-2.5 w-full">
      <span className="text-[10px] text-text-muted font-mono w-8 text-right tabular-nums leading-none">{formatTime(currentTime)}</span>
      <div className="flex-1 h-[3px] bg-border/70 rounded-full cursor-pointer relative group" onClick={handleClick}>
        <div className="h-full bg-text-muted rounded-full transition-all duration-100" style={{ width: `${Math.min(progress, 100)}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-text-primary rounded-full opacity-0 group-hover:opacity-100 transition-all duration-150 shadow-sm"
          style={{ left: `calc(${Math.min(progress, 100)}% - 5px)` }} />
      </div>
      <span className="text-[10px] text-text-muted font-mono w-8 tabular-nums leading-none">{formatTime(duration)}</span>
    </div>
  )
}
