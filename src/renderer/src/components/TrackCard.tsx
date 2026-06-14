import type { Track } from '@shared/types'
import { IconMusic, IconDownload, IconCheck } from './icons'

interface TrackCardProps {
  track: Track
  onPlay: (track: Track) => void
  onDownload?: (track: Track) => void
  isDownloaded?: boolean
  isDownloading?: boolean
}

export default function TrackCard({ track, onPlay, onDownload, isDownloaded, isDownloading }: TrackCardProps) {
  const formatDuration = (s: number): string => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div
      className="group flex items-center gap-3 p-3 rounded-card hover:bg-surface-hover border border-transparent hover:border-border transition-all duration-200 cursor-pointer active:scale-[0.99]"
      onClick={() => onPlay(track)}
    >
      <div className="w-12 h-12 rounded overflow-hidden bg-surface-hover shrink-0 border border-border">
        {track.thumbnail ? (
          <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            <IconMusic size={16} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate font-sans">{track.title}</p>
        <p className="text-xs text-text-secondary truncate font-sans">{track.artist}</p>
      </div>
      <span className="text-xs text-text-muted font-mono">{formatDuration(track.duration)}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onDownload && (
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(track) }}
            disabled={isDownloaded || isDownloading}
            className={`p-1.5 rounded transition-colors active:scale-90 ${
              isDownloaded
                ? 'text-accent-green-text bg-accent-green-bg'
                : isDownloading
                  ? 'text-text-muted'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface'
            }`}
            title={isDownloaded ? 'Downloaded' : isDownloading ? 'Downloading...' : 'Download'}
          >
            {isDownloaded ? <IconCheck size={14} /> : <IconDownload size={14} />}
          </button>
        )}
      </div>
    </div>
  )
}
