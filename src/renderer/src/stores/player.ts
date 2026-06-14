// src/renderer/src/stores/player.ts
import { atom } from 'jotai'
import type { Track, PlayerStatus } from '@shared/types'

export interface PlayerAtom {
  queue: Track[]
  currentIndex: number
  status: PlayerStatus
  volume: number
  shuffle: boolean
  repeat: 'off' | 'one' | 'all'
  currentTime: number
  duration: number
}

export const playerAtom = atom<PlayerAtom>({
  queue: [],
  currentIndex: -1,
  status: 'idle',
  volume: 0.8,
  shuffle: false,
  repeat: 'off',
  currentTime: 0,
  duration: 0,
})

export const currentTrackAtom = atom((get) => {
  const player = get(playerAtom)
  if (player.currentIndex < 0 || player.currentIndex >= player.queue.length) return null
  return player.queue[player.currentIndex]
})

export const playTrackAtom = atom(null, (get, set, track: Track) => {
  const player = get(playerAtom)
  const existingIndex = player.queue.findIndex((t) => t.id === track.id)
  if (existingIndex >= 0) {
    set(playerAtom, { ...player, currentIndex: existingIndex, status: 'loading' })
  } else {
    set(playerAtom, {
      ...player,
      queue: [...player.queue, track],
      currentIndex: player.queue.length,
      status: 'loading',
    })
  }
})

export const playQueueAtom = atom(null, (get, set, tracks: Track[], startIndex: number = 0) => {
  set(playerAtom, {
    ...get(playerAtom),
    queue: tracks,
    currentIndex: startIndex,
    status: 'loading',
  })
})

export const nextTrackAtom = atom(null, (get, set) => {
  const player = get(playerAtom)
  if (player.queue.length === 0) return

  let nextIndex: number
  if (player.shuffle) {
    let idx: number
    do {
      idx = Math.floor(Math.random() * player.queue.length)
    } while (idx === player.currentIndex && player.queue.length > 1)
    nextIndex = idx
  } else {
    nextIndex = player.currentIndex + 1
  }

  if (nextIndex >= player.queue.length) {
    if (player.repeat === 'all') {
      nextIndex = 0
    } else {
      set(playerAtom, { ...player, status: 'idle', currentTime: 0 })
      return
    }
  }

  set(playerAtom, { ...player, currentIndex: nextIndex, status: 'loading', currentTime: 0 })
})

export const prevTrackAtom = atom(null, (get, set) => {
  const player = get(playerAtom)
  if (player.queue.length === 0) return

  if (player.currentTime > 3) {
    set(playerAtom, { ...player, currentTime: 0 })
    return
  }

  let prevIndex = player.currentIndex - 1
  if (prevIndex < 0) {
    prevIndex = player.queue.length - 1
  }

  set(playerAtom, { ...player, currentIndex: prevIndex, status: 'loading', currentTime: 0 })
})
