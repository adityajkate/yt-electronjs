import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { downloadsAtom, downloadingSetAtom, refreshDownloadsAtom } from '../stores/downloads'
import { playerAtom } from '../stores/player'
import { addToastAtom } from '../stores/toast'
import TrackCard from '../components/TrackCard'
import { IconDownload } from '../components/icons'

export default function DownloadsView() {
  const [downloads] = useAtom(downloadsAtom)
  const [downloading] = useAtom(downloadingSetAtom)
  const [, refresh] = useAtom(refreshDownloadsAtom)
  const [, setPlayer] = useAtom(playerAtom)
  const [, addToast] = useAtom(addToastAtom)

  useEffect(() => { refresh() }, [])

  const handleRemove = async (trackId: string, title: string) => {
    const api = (window as any).electronAPI
    if (!api) return
    await api.removeDownload(trackId); refresh()
    addToast({ message: `Removed "${title}" from offline`, type: 'info' })
  }

  const handlePlay = async (trackId: string) => {
    const api = (window as any).electronAPI
    if (!api) return
    try {
      const dl = downloads.find((d) => d.track_id === trackId)
      if (!dl) return
      setPlayer((prev) => ({
        ...prev,
        queue: [{ id: dl.track_id, title: dl.title, artist: dl.artist, duration: 0, thumbnail: dl.thumbnail || '' }],
        currentIndex: 0, status: 'idle',
      }))
      const result = await api.playDownloaded(trackId)
      window.dispatchEvent(new CustomEvent('audio-source', { detail: { url: result.url, isLocal: true } }))
    } catch (err: any) {
      addToast({ message: `Playback failed: ${err.message}`, type: 'error' })
    }
  }

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '—'
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  const totalSize = downloads.reduce((sum, d) => sum + d.file_size, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted">Downloads</h2>
        <span className="text-xs text-text-muted font-mono tabular-nums">{downloads.length} tracks · {formatSize(totalSize)}</span>
      </div>

      {downloads.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-[14px] bg-surface/60 border border-border flex items-center justify-center mx-auto mb-4 shadow-card">
            <IconDownload size={22} className="text-text-muted" />
          </div>
          <p className="text-sm text-text-muted font-sans">No downloads yet</p>
          <p className="text-xs text-text-secondary font-sans mt-1">Download songs to listen offline</p>
        </div>
      )}

      {downloads.length > 0 && (
        <div className="space-y-0.5">
          {downloads.map((dl) => (
            <TrackCard
              key={dl.track_id}
              track={{ id: dl.track_id, title: dl.title, artist: dl.artist, duration: 0, thumbnail: dl.thumbnail || '' }}
              onPlay={() => handlePlay(dl.track_id)} isDownloaded
              onDownload={() => handleRemove(dl.track_id, dl.title)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
