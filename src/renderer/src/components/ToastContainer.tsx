import { useAtom } from 'jotai'
import { toastsAtom } from '../stores/toast'

export default function ToastContainer() {
  const [toasts] = useAtom(toastsAtom)
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-24 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div key={t.id}
          className={`px-4 py-2 rounded-card text-sm shadow-card border border-border backdrop-blur-sm animate-fade-in font-sans
            ${t.type === 'error' ? 'bg-accent-red-bg text-accent-red-text border-accent-red-bg' : ''}
            ${t.type === 'success' ? 'bg-accent-green-bg text-accent-green-text border-accent-green-bg' : ''}
            ${t.type === 'info' ? 'bg-surface text-text-primary' : ''}
          `}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
