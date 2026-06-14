import type { ViewName } from '@shared/types'
import { IconNowPlaying, IconSearch, IconLibrary, IconDownload, IconSettings } from './icons'

interface SidebarProps {
  currentView: ViewName
  onNavigate: (view: ViewName) => void
}

const NAV_ITEMS: { id: ViewName; label: string; icon: React.ElementType }[] = [
  { id: 'now-playing', label: 'Now Playing', icon: IconNowPlaying },
  { id: 'search', label: 'Search', icon: IconSearch },
  { id: 'library', label: 'Library', icon: IconLibrary },
  { id: 'downloads', label: 'Downloads', icon: IconDownload },
  { id: 'settings', label: 'Settings', icon: IconSettings },
]

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <nav className="w-sidebar flex flex-col items-center pt-3 pb-2 bg-canvas border-r border-border shrink-0">
      {NAV_ITEMS.map((item) => {
        const isActive = currentView === item.id
        const Icon = item.icon
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={item.label}
            className={`relative w-10 h-10 flex items-center justify-center rounded-card mb-1 transition-all duration-200
              ${isActive
                ? 'bg-surface text-text-primary shadow-card'
                : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
              } active:scale-95`}
          >
            <Icon size={20} />
            {isActive && (
              <span className="absolute -left-2.5 w-1 h-1 rounded-full bg-text-muted" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
