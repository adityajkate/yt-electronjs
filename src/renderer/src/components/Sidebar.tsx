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
    <nav className="w-14 flex flex-col items-center pt-3 pb-3 bg-canvas/70 border-r border-border shrink-0 relative z-[2]">
      {/* Monogram */}
      <div className="mb-6 mt-1 w-8 h-8 rounded-lg depth-1 flex items-center justify-center">
        <span className="text-[10px] font-mono text-text-muted font-semibold tracking-[0.15em]">Y</span>
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive = currentView === item.id
        const Icon = item.icon
        return (
          <div key={item.id} className="relative group">
            <button
              onClick={() => onNavigate(item.id)}
              className={`btn-icon mb-0.5 ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              <Icon size={20} />
            </button>

            {/* Active indicator bar — animated */}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-text-primary rounded-full animate-fade-in" />
            )}

            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none translate-x-[-4px] group-hover:translate-x-0 glass depth-1">
              {item.label}
            </div>
          </div>
        )
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom divider */}
      <div className="w-6 h-px bg-border/50 mt-auto mb-3" />
    </nav>
  )
}
