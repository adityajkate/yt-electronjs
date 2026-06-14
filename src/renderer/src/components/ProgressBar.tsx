interface ProgressBarProps {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

export default function ProgressBar({ currentTime, duration, onSeek }: ProgressBarProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const fmt = (s: number): string => {
    if (!isFinite(s) || s < 0) return '0:00'
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onSeek((e.clientX - rect.left) / rect.width * duration)
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-[10px] text-text-muted font-mono tabular-nums w-7 text-right">{fmt(currentTime)}</span>
      <div
        className="flex-1 h-[2px] bg-border/60 rounded-full cursor-pointer relative group py-2 -my-2"
        onClick={handleClick}
      >
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-[2px] bg-border/60 rounded-full" />
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-[2px] bg-text-primary rounded-full transition-all duration-75 group-hover:h-[3px]"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-text-primary rounded-full opacity-0 group-hover:opacity-100 transition-all duration-150 shadow-sm"
          style={{ left: `calc(${Math.min(progress, 100)}% - 5px)` }}
        />
      </div>
      <span className="text-[10px] text-text-muted font-mono tabular-nums w-7">{fmt(duration)}</span>
    </div>
  )
}
