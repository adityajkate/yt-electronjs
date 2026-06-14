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
    <nav className="w-sidebar flex flex-col items-center pt-3 pb-3 bg-canvas/80 border-r border-border shrink-0 relative z-[2]">
      {/* Sidebar top spacer with subtle app mark */}
      <div className="mb-6 mt-1 w-8 h-8 rounded-lg bg-text-primary/5 flex items-center justify-center">
        <span className="text-xs font-mono text-text-muted font-semibold tracking-widest">Y</span>
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive = currentView === item.id
        const Icon = item.icon
        return (
          <div key={item.id} className="relative group">
            <button
              onClick={() => onNavigate(item.id)}
              title={item.label}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
            </button>
            {/* Tooltip label on hover */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none
              glass shadow-glass -translate-x-1 group-hover:translate-x-0">
              {item.label}
            </div>
          </div>
        )
      })}
    </nav>
  )
}
