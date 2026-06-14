// src/renderer/src/App.tsx
import { useEffect, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import type { ViewName } from '@shared/types'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import BottomBar from './components/BottomBar'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'
import NowPlayingView from './pages/NowPlayingView'
import SearchView from './pages/SearchView'
import LibraryView from './pages/LibraryView'
import DownloadsView from './pages/DownloadsView'
import SettingsView from './pages/SettingsView'
import ToastContainer from './components/ToastContainer'
import { loadSettingsAtom } from './stores/settings'
import { playerAtom, nextTrackAtom, prevTrackAtom } from './stores/player'
import useAudio from './hooks/useAudio'

export default function App() {
  const [currentView, setCurrentView] = useState<ViewName>('now-playing')
  const [, loadSettings] = useAtom(loadSettingsAtom)
  const player = useAtomValue(playerAtom)
  const [, next] = useAtom(nextTrackAtom)
  const [, prev] = useAtom(prevTrackAtom)

  useEffect(() => {
    loadSettings()
  }, [])

  // Single persistent audio engine — lives at App root, survives view changes
  useAudio()

  // Global keyboard shortcuts (active on all views)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur()
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('toggle-play'))
          break
        case 'ArrowLeft':
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('audio-seek', { detail: Math.max(0, player.currentTime - 5) }))
          break
        case 'ArrowRight':
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('audio-seek', { detail: Math.min(player.duration, player.currentTime + 5) }))
          break
        case 'ArrowUp':
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('audio-volume', { detail: Math.min(1, player.volume + 0.1) }))
          break
        case 'ArrowDown':
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('audio-volume', { detail: Math.max(0, player.volume - 0.1) }))
          break
        case 'n': case 'N': next(); break
        case 'p': case 'P': prev(); break
        case 'm': case 'M':
          window.dispatchEvent(new CustomEvent('audio-volume', { detail: player.volume > 0 ? 0 : 0.8 }))
          break
        case 's': case 'S': setCurrentView('search'); break
        case 'l': case 'L': window.dispatchEvent(new CustomEvent('toggle-lyrics')); break
        case 'f': case 'F': document.documentElement.requestFullscreen?.().catch(() => {}); break
        case '/': setCurrentView('search'); break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [player.volume, player.currentTime, player.duration])

  const handleSearch = () => setCurrentView('search')

  const renderView = () => {
    switch (currentView) {
      case 'now-playing': return <NowPlayingView />
      case 'search': return <SearchView onPlay={() => setCurrentView('now-playing')} />
      case 'library': return <LibraryView />
      case 'downloads': return <DownloadsView />
      case 'settings': return <SettingsView />
      default: return <NowPlayingView />
    }
  }

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen flex flex-col bg-canvas overflow-hidden">
        {/*
          Hidden audio element — lives at App root so it persists across all views.
          Created once, destroyed once (when the app closes).
        */}
        <audio id="app-audio" preload="auto" />

        <OfflineBanner />
        <TitleBar currentView={currentView} onSearch={handleSearch} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar currentView={currentView} onNavigate={setCurrentView} />
          <main className="flex-1 overflow-y-auto px-6 py-6">
            {renderView()}
          </main>
        </div>
        <BottomBar />
        <ToastContainer />
      </div>
    </ErrorBoundary>
  )
}
