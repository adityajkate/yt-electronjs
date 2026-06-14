import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Renderer error:', error, info.componentStack) }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-canvas">
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 rounded-card bg-accent-red-bg flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent-red-text">
                <circle cx="10" cy="10" r="8" />
                <path d="M10 6v5M10 14v.01" />
              </svg>
            </div>
            <h2 className="text-base text-text-primary font-medium mb-1 font-sans">Something went wrong</h2>
            <p className="text-sm text-text-muted mb-4 font-sans">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button onClick={() => window.location.reload()}
              className="px-5 py-1.5 text-sm font-sans bg-text-primary text-canvas rounded-card active:scale-95 transition-transform">Reload</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
