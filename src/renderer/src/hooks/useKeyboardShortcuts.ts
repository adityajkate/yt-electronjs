// src/renderer/src/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { playerAtom, nextTrackAtom, prevTrackAtom } from '../stores/player'

export default function useKeyboardShortcuts() {
  const [player, setPlayer] = useAtom(playerAtom)
  const [, next] = useAtom(nextTrackAtom)
  const [, prev] = useAtom(prevTrackAtom)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key !== 'Escape') return
      }
      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (player.status === 'playing') setPlayer({ ...player, status: 'paused' })
          else if (player.queue.length > 0) setPlayer({ ...player, status: 'loading' })
          break
        case 'ArrowLeft':
          e.preventDefault()
          const newTimeL = Math.max(0, player.currentTime - 5)
          setPlayer({ ...player, currentTime: newTimeL })
          window.dispatchEvent(new CustomEvent('audio-seek', { detail: newTimeL }))
          break
        case 'ArrowRight':
          e.preventDefault()
          const newTimeR = Math.min(player.duration, player.currentTime + 5)
          setPlayer({ ...player, currentTime: newTimeR })
          window.dispatchEvent(new CustomEvent('audio-seek', { detail: newTimeR }))
          break
        case 'ArrowUp':
          e.preventDefault()
          const v = Math.min(1, player.volume + 0.1)
          setPlayer({ ...player, volume: v })
          window.dispatchEvent(new CustomEvent('audio-volume', { detail: v }))
          break
        case 'ArrowDown':
          e.preventDefault()
          const vd = Math.max(0, player.volume - 0.1)
          setPlayer({ ...player, volume: vd })
          window.dispatchEvent(new CustomEvent('audio-volume', { detail: vd }))
          break
        case 'n': case 'N': next(); break
        case 'p': case 'P': prev(); break
        case 'm': case 'M':
          const mv = player.volume > 0 ? 0 : 0.8
          setPlayer({ ...player, volume: mv })
          window.dispatchEvent(new CustomEvent('audio-volume', { detail: mv }))
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [player])
}
