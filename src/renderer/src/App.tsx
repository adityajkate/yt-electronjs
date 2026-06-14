// src/renderer/src/App.tsx
import { useEffect, useState } from 'react'
import { useAtom } from 'jotai'
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

export default function App() {
  const [currentView, setCurrentView] = useState<ViewName>('now-playing')
  const [, loadSettings] = useAtom(loadSettingsAtom)

  useEffect(() => {
    loadSettings()
  }, [])

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
