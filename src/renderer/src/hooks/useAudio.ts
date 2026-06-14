import { useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import { playerAtom, currentTrackAtom, nextTrackAtom } from '../stores/player'
import { addToastAtom } from '../stores/toast'

function getAudio(): HTMLAudioElement | null {
  return document.getElementById('app-audio') as HTMLAudioElement | null
}

export default function useAudio() {
  const [player, setPlayer] = useAtom(playerAtom)
  const [track] = useAtom(currentTrackAtom)
  const [, next] = useAtom(nextTrackAtom)
  const [, addToast] = useAtom(addToastAtom)
  const pendingFetchRef = useRef<AbortController | null>(null)

  // Set up event listeners — runs once, uses the persistent DOM <audio>
  useEffect(() => {
    const audio = getAudio()
    if (!audio) return

    const handleTimeUpdate = () => {
      setPlayer((prev) => ({ ...prev, currentTime: audio.currentTime, duration: audio.duration || prev.duration }))
    }

    const handleEnded = () => { next() }

    const handleError = () => {
      addToast({ message: audio.error?.message || 'Playback error', type: 'error' })
      setPlayer((prev) => ({ ...prev, status: 'paused' }))
    }

    const handleSeek = (e: Event) => { audio.currentTime = (e as CustomEvent).detail }
    const handleVolume = (e: Event) => {
      const vol = (e as CustomEvent).detail
      audio.volume = vol
      setPlayer((prev) => ({ ...prev, volume: vol }))
    }

    const handleSource = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail.isLocal) {
        audio.src = detail.url
        audio.play().catch(() => {})
        setPlayer((prev) => ({ ...prev, status: 'playing' }))
      }
    }

    const handleTogglePlay = () => {
      if (audio.paused && audio.src) {
        audio.play().catch(() => {})
        setPlayer((prev) => ({ ...prev, status: 'playing' }))
      } else if (!audio.paused) {
        audio.pause()
        setPlayer((prev) => ({ ...prev, status: 'paused' }))
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    window.addEventListener('audio-seek', handleSeek)
    window.addEventListener('audio-volume', handleVolume)
    window.addEventListener('audio-source', handleSource)
    window.addEventListener('toggle-play', handleTogglePlay)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      window.removeEventListener('audio-seek', handleSeek)
      window.removeEventListener('audio-volume', handleVolume)
      window.removeEventListener('audio-source', handleSource)
      window.removeEventListener('toggle-play', handleTogglePlay)
    }
  }, [])

  // Load new stream when track changes
  useEffect(() => {
    const audio = getAudio()
    if (!audio || !track) return

    if (player.status === 'loading') {
      // Cancel any in-flight fetch
      pendingFetchRef.current?.abort()
      const controller = new AbortController()
      pendingFetchRef.current = controller

      // Fully stop previous playback before loading new track
      audio.pause()
      audio.removeAttribute('src')
      audio.load()

      const api = (window as any).electronAPI
      if (!api) return

      api.getStreamUrl(track.id)
        .then((result: { url: string }) => {
          if (controller.signal.aborted) return
          audio.src = result.url
          audio.volume = player.volume
          return audio.play()
        })
        .then(() => {
          if (!controller.signal.aborted) {
            setPlayer((prev) => ({ ...prev, status: 'playing' }))
          }
        })
        .catch((err: Error) => {
          if (controller.signal.aborted) return
          addToast({ message: `Stream failed: ${err.message}`, type: 'error' })
          setPlayer((prev) => ({ ...prev, status: 'paused' }))
        })
    }
  }, [track?.id, player.status])

  // Sync play/pause state — but ONLY when not loading (avoids racing with track change)
  useEffect(() => {
    const audio = getAudio()
    if (!audio || !track) return

    // Skip if we're currently loading a new track — the loading effect handles play()
    if (player.status === 'loading') return

    if (player.status === 'playing') {
      if (audio.paused && audio.src) {
        audio.play().catch(() => {})
      }
    } else if (player.status === 'paused') {
      if (!audio.paused) {
        audio.pause()
      }
    }
  }, [player.status])

  // Sync volume
  useEffect(() => {
    const audio = getAudio()
    if (audio) audio.volume = player.volume
  }, [player.volume])
}
