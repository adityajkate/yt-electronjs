// src/renderer/src/hooks/useAudio.ts
import { useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import { playerAtom, currentTrackAtom, nextTrackAtom } from '../stores/player'
import { addToastAtom } from '../stores/toast'

export default function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [player, setPlayer] = useAtom(playerAtom)
  const [track] = useAtom(currentTrackAtom)
  const [, next] = useAtom(nextTrackAtom)
  const [, addToast] = useAtom(addToastAtom)

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = 'auto'
    }
    const audio = audioRef.current

    const handleTimeUpdate = () => {
      setPlayer((prev) => ({ ...prev, currentTime: audio.currentTime, duration: audio.duration || prev.duration }))
    }
    const handleEnded = () => { next() }
    const handleError = () => {
      addToast({ message: audio.error?.message || 'Playback error', type: 'error' })
      setPlayer((prev) => ({ ...prev, status: 'paused' }))
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    const handleSeek = (e: Event) => { audio.currentTime = (e as CustomEvent).detail }
    const handleVolume = (e: Event) => { audio.volume = (e as CustomEvent).detail }
    const handleSource = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail.isLocal) { audio.src = detail.url; audio.play().catch(() => {}) }
    }

    window.addEventListener('audio-seek', handleSeek)
    window.addEventListener('audio-volume', handleVolume)
    window.addEventListener('audio-source', handleSource)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      window.removeEventListener('audio-seek', handleSeek)
      window.removeEventListener('audio-volume', handleVolume)
      window.removeEventListener('audio-source', handleSource)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return
    if (player.status === 'loading') {
      const api = (window as any).electronAPI
      if (!api) return
      api.getStreamUrl(track.id)
        .then((result: { url: string }) => { audio.src = result.url; audio.volume = player.volume; return audio.play() })
        .then(() => setPlayer((prev) => ({ ...prev, status: 'playing' })))
        .catch((err: Error) => { addToast({ message: `Stream failed: ${err.message}`, type: 'error' }); setPlayer((prev) => ({ ...prev, status: 'paused' })) })
    }
  }, [track?.id, player.status])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return
    if (player.status === 'playing') audio.play().catch(() => {})
    else if (player.status === 'paused') audio.pause()
  }, [player.status])

  useEffect(() => { if (audioRef.current) audioRef.current.volume = player.volume }, [player.volume])
}
