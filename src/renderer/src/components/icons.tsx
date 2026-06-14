// src/renderer/src/components/icons.tsx
// Clean monochrome SVG icon set — phosphor-inspired, consistent 16px/20px viewBox

type IconProps = { size?: number; className?: string }

function Icon({ children, size = 20, className }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  )
}

export function IconMusicNote({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M8 15V4l8-1.5v11" />
      <circle cx="5.5" cy="15.5" r="2.5" />
      <circle cx="15.5" cy="13.5" r="2.5" />
    </Icon>
  )
}

export function IconSearch({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <circle cx="9" cy="9" r="5" />
      <path d="M12.5 12.5L16 16" />
    </Icon>
  )
}

export function IconLibrary({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <rect x="2" y="3" width="4" height="14" rx="1" />
      <rect x="8" y="1" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="12" rx="1" />
    </Icon>
  )
}

export function IconDownload({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M10 2v11M6 9l4 4 4-4" />
      <path d="M2 16h16" />
    </Icon>
  )
}

export function IconSettings({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 1.5v2M10 16.5v2M3.5 4l1.7 1M14.8 15l1.7 1M1.5 10h2M16.5 10h2M4 14.8l1-1.7M15 5.8l1-1.7" />
    </Icon>
  )
}

export function IconPlay({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M5 3l12 7-12 7V3z" />
    </Icon>
  )
}

export function IconPause({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <rect x="5" y="3" width="3" height="14" rx="1" />
      <rect x="12" y="3" width="3" height="14" rx="1" />
    </Icon>
  )
}

export function IconSkipPrev({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M4 4v12M6 10l11-6v12L6 10z" />
    </Icon>
  )
}

export function IconSkipNext({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M16 4v12M14 10L3 4v12l11-6z" />
    </Icon>
  )
}

export function IconShuffle({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M14 2l4 2-4 2" />
      <path d="M18 4h-3a4 4 0 00-4 4v4a4 4 0 01-4 4H2" />
      <path d="M14 14l4 2-4 2" />
      <path d="M18 16h-3a4 4 0 01-4-4V8a4 4 0 00-4-4H2" />
    </Icon>
  )
}

export function IconRepeat({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M3 8V6a3 3 0 013-3h8" />
      <path d="M17 12v2a3 3 0 01-3 3H6" />
      <path d="M14 2l3 3-3 3" />
      <path d="M6 12l-3 3 3 3" />
    </Icon>
  )
}

export function IconVolume({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M8 5l5-3v16l-5-3H3V5h5z" />
      <path d="M14 7.5a4 4 0 010 5" />
    </Icon>
  )
}

export function IconVolumeMuted({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M8 5l5-3v16l-5-3H3V5h5z" />
      <path d="M16 8l-4 4M12 8l4 4" />
    </Icon>
  )
}

export function IconLyrics({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <rect x="2" y="4" width="16" height="12" rx="2" />
      <path d="M6 8h8M6 11h6M6 14h4" />
    </Icon>
  )
}

export function IconHeart({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M10 17l-1.5-1.4C4.5 12 2 9.8 2 7a4 4 0 017-2 4 4 0 017 2c0 2.8-2.5 5-6.5 8.6L10 17z" />
    </Icon>
  )
}

export function IconHeartFilled({ size, className }: IconProps) {
  return (
    <svg width={size || 20} height={size || 20} viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10 17l-1.5-1.4C4.5 12 2 9.8 2 7a4 4 0 017-2 4 4 0 017 2c0 2.8-2.5 5-6.5 8.6L10 17z" />
    </svg>
  )
}

export function IconAdd({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M10 4v12M4 10h12" />
    </Icon>
  )
}

export function IconClose({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M5 5l10 10M15 5L5 15" />
    </Icon>
  )
}

export function IconCheck({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M4 10l4 4 8-8" />
    </Icon>
  )
}

export function IconAlert({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <circle cx="10" cy="10" r="8" />
      <path d="M10 6v5M10 14v.01" />
    </Icon>
  )
}

export function IconNowPlaying({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <rect x="2" y="4" width="4" height="12" rx="1" />
      <rect x="8" y="2" width="4" height="14" rx="1" />
      <rect x="14" y="6" width="4" height="10" rx="1" />
      <path d="M14 11l4-2" />
    </Icon>
  )
}

export function IconMusic({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M16 3L8 5v9.5" />
      <circle cx="6" cy="15" r="3" />
      <circle cx="15" cy="14" r="3" />
      <path d="M8 5l8-2v7l-8 2V5z" />
    </Icon>
  )
}

export function IconDelete({ size, className }: IconProps) {
  return (
    <Icon size={size} className={className}>
      <path d="M3 5h14M8 5V3a1 1 0 011-1h2a1 1 0 011 1v2M16 5l-1 12a2 2 0 01-2 2H7a2 2 0 01-2-2L4 5" />
    </Icon>
  )
}
