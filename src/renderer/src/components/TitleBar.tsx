import type { ViewName } from '@shared/types'

interface TitleBarProps {
  currentView: ViewName
  onSearch: () => void
}

export default function TitleBar({ currentView, onSearch }: TitleBarProps) {
  return (
    <div className="h-titlebar flex items-center px-4 bg-canvas border-b border-border draggable shrink-0">
      <div className="flex items-center gap-1.5 mr-4 no-drag">
        <div className="w-3 h-3 rounded-full bg-[#DDDCD5]" />
        <div className="w-3 h-3 rounded-full bg-[#DDDCD5]" />
        <div className="w-3 h-3 rounded-full bg-[#DDDCD5]" />
      </div>
      <span className="text-xs font-mono text-text-muted tracking-wider uppercase mr-6 select-none">YTM</span>
      <div className="flex-1 max-w-md mx-auto">
        <input
          type="text"
          placeholder="Search music..."
          className="w-full px-3 py-1 text-sm font-sans bg-surface border border-border rounded-card text-text-primary placeholder:text-text-muted outline-none focus:border-text-muted transition-colors cursor-pointer"
          onFocus={onSearch}
          readOnly
        />
      </div>
      <div className="w-8" />
    </div>
  )
}
