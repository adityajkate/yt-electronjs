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
    <div className="h-titlebar flex items-center px-4 border-b border-border shrink-0 window-drag bg-canvas/80">
      {/* macOS-style traffic light window controls */}
      <div className="flex items-center gap-[5px] mr-5 window-no-drag">
        <button onClick={handleClose} className="w-[11px] h-[11px] rounded-full bg-[#DDDCD5] hover:bg-[#FF5F57] transition-colors duration-150 focus:outline-none" title="Close" />
        <button onClick={handleMinimize} className="w-[11px] h-[11px] rounded-full bg-[#DDDCD5] hover:bg-[#FEBC2E] transition-colors duration-150 focus:outline-none" title="Minimize" />
        <button onClick={handleMaximize} className="w-[11px] h-[11px] rounded-full bg-[#DDDCD5] hover:bg-[#28C840] transition-colors duration-150 focus:outline-none" title="Maximize" />
      </div>
      <span className="text-[10px] font-mono text-text-muted font-semibold tracking-[0.15em] uppercase mr-6 select-none">YTM</span>
      <div className="flex-1 max-w-md mx-auto window-no-drag">
        <input
          type="text"
          placeholder="Search music..."
          className="w-full px-3 py-[5px] text-xs font-sans bg-surface/80 border border-border rounded-[6px] text-text-primary placeholder:text-text-muted outline-none focus:border-text-muted/50 transition-all duration-200 cursor-pointer"
          onFocus={onSearch}
          readOnly
        />
      </div>
      <div className="w-8" />
    </div>
  )
}
