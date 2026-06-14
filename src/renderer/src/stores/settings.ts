// src/renderer/src/stores/settings.ts
import { atom } from 'jotai'
import type { AppSettings } from '@shared/types'

export const settingsAtom = atom<AppSettings | null>(null)

export const loadSettingsAtom = atom(null, async (_get, set) => {
  const api = (window as any).electronAPI
  if (!api) return
  const settings = await api.getSettings()
  set(settingsAtom, settings)
  if (settings.theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})

export const saveSettingsAtom = atom(null, async (_get, set, partial: Partial<AppSettings>) => {
  const api = (window as any).electronAPI
  if (!api) return
  const updated = await api.setSettings(partial)
  set(settingsAtom, updated)
  if (updated.theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
