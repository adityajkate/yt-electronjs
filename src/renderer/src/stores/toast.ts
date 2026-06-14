// src/renderer/src/stores/toast.ts
import { atom } from 'jotai'

export interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'error'
}

export const toastsAtom = atom<Toast[]>([])

export const addToastAtom = atom(null, (_get, set, { message, type = 'info' }: { message: string; type?: Toast['type'] }) => {
  const id = Math.random().toString(36).slice(2)
  set(toastsAtom, (prev) => [...prev, { id, message, type }])
  setTimeout(() => {
    set(toastsAtom, (prev) => prev.filter((t) => t.id !== id))
  }, 3000)
})
