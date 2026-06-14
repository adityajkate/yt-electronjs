// src/main/ipc/settings.ts
import { ipcMain } from 'electron'
import { IPC_CHANNELS, AppSettings } from '../../shared/types'
import { getSetting, setSetting } from '../database/database'

const DEFAULT_SETTINGS: AppSettings = {
  invidiousInstance: 'https://inv.nadeko.net',
  invidiousFallbacks: ['https://yewtu.be', 'https://inv.riverside.rocks', 'https://invidious.snopyta.org'],
  downloadQuality: 'medium',
  downloadPath: '',
  theme: 'light',
  minimizeToTray: true,
  rememberLastPlaylist: true,
}

function loadSettings(): AppSettings {
  const stored = getSetting('app_settings')
  if (stored) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    } catch { /* fall through */ }
  }
  return { ...DEFAULT_SETTINGS }
}

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, async () => {
    return loadSettings()
  })

  ipcMain.handle(IPC_CHANNELS.SET_SETTINGS, async (_event, partial: Partial<AppSettings>) => {
    const current = loadSettings()
    const updated = { ...current, ...partial }
    setSetting('app_settings', JSON.stringify(updated))
    return updated
  })
}
