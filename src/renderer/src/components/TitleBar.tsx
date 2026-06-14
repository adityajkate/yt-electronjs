import type { ViewName } from '@shared/types'

interface TitleBarProps {
  currentView: ViewName
  onSearch: () => void
}

export default function TitleBar({ currentView, onSearch }: TitleBarProps) {
  const handleMinimize = () => (window as any).electronAPI?.minimize()
  const handleMaximize = () => (window as any).electronAPI?.maximize()
  const handleClose = () => (window as any).electronAPI?.close()

  return (
    <div className="h-titlebar flex items-center px-4 bg-canvas border-b border-border shrink-0 window-drag">
      {/* macOS-style traffic light window controls */}
      <div className="flex items-center gap-1.5 mr-4 window-no-drag">
        <button onClick={handleClose} className="w-3 h-3 rounded-full bg-[#DDDCD5] hover:bg-[#FF5F57] transition-colors focus:outline-none" title="Close" />
        <button onClick={handleMinimize} className="w-3 h-3 rounded-full bg-[#DDDCD5] hover:bg-[#FEBC2E] transition-colors focus:outline-none" title="Minimize" />
        <button onClick={handleMaximize} className="w-3 h-3 rounded-full bg-[#DDDCD5] hover:bg-[#28C840] transition-colors focus:outline-none" title="Maximize" />
      </div>
      <span className="text-xs font-mono text-text-muted tracking-wider uppercase mr-6 select-none">YTM</span>
      <div className="flex-1 max-w-md mx-auto window-no-drag">
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
