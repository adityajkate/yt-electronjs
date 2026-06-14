import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { settingsAtom, loadSettingsAtom, saveSettingsAtom } from '../stores/settings'

export default function SettingsView() {
  const [settings] = useAtom(settingsAtom)
  const [, load] = useAtom(loadSettingsAtom)
  const [, save] = useAtom(saveSettingsAtom)

  useEffect(() => { load() }, [])

  if (!settings) {
    return <div className="space-y-3 animate-pulse">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 bg-border/50 rounded-[8px]" />)}</div>
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted mb-6">Settings</h2>

      <div className="mb-6">
        <label className="block text-xs text-text-secondary mb-1.5 font-sans font-medium">Invidious Instance</label>
        <input type="text" value={settings.invidiousInstance}
          onChange={(e) => save({ invidiousInstance: e.target.value })}
          className="w-full px-3 py-1.5 text-sm font-sans bg-surface/80 border border-border rounded-[6px] text-text-primary outline-none focus:border-text-muted/50 transition-all" />
        <p className="text-xs text-text-muted mt-1">Public proxy for YouTube search</p>
      </div>

      <div className="mb-6">
        <label className="block text-xs text-text-secondary mb-1.5 font-sans font-medium">Download Quality</label>
        <select value={settings.downloadQuality}
          onChange={(e) => save({ downloadQuality: e.target.value as any })}
          className="w-full px-3 py-1.5 text-sm font-sans bg-surface/80 border border-border rounded-[6px] text-text-primary outline-none focus:border-text-muted/50 transition-all">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-xs text-text-secondary mb-1.5 font-sans font-medium">Theme</label>
        <div className="flex items-center gap-2">
          <button onClick={() => save({ theme: 'light' })}
            className={`px-5 py-1.5 text-sm font-sans rounded-[6px] border transition-all duration-200 active:scale-95 ${
              settings.theme === 'light'
                ? 'bg-text-primary text-canvas border-text-primary'
                : 'bg-surface text-text-secondary border-border hover:border-text-muted'
            }`}>Light</button>
          <button onClick={() => save({ theme: 'dark' })}
            className={`px-5 py-1.5 text-sm font-sans rounded-[6px] border transition-all duration-200 active:scale-95 ${
              settings.theme === 'dark'
                ? 'bg-text-primary text-canvas border-text-primary'
                : 'bg-surface text-text-secondary border-border hover:border-text-muted'
            }`}>Dark</button>
        </div>
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.minimizeToTray}
            onChange={(e) => save({ minimizeToTray: e.target.checked })}
            className="accent-text-primary rounded" />
          <span className="text-sm text-text-secondary font-sans">Minimize to tray</span>
        </label>
      </div>

      <div className="border-t border-border/50 my-6" />
      <p className="text-xs text-text-muted font-mono">YouTube Music Electron v0.1.0</p>
    </div>
  )
}
