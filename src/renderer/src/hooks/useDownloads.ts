// src/renderer/src/hooks/useDownloads.ts
import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { downloadsAtom, downloadingSetAtom, refreshDownloadsAtom } from '../stores/downloads'

export default function useDownloads() {
  const [downloads] = useAtom(downloadsAtom)
  const [downloading] = useAtom(downloadingSetAtom)
  const [, refresh] = useAtom(refreshDownloadsAtom)

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [])

  return { downloads, downloading, refresh, isDownloaded: (trackId: string) => downloads.some((d) => d.track_id === trackId), isDownloading: (trackId: string) => downloading.has(trackId) }
}
