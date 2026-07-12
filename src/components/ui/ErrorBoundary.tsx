import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0a0a0f', color: '#f0f0f5', flexDirection: 'column', gap: 16, padding: 24,
          fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Что-то пошло не так</h1>
          <p style={{ color: '#8888a0', textAlign: 'center', maxWidth: 400 }}>
            {this.state.error?.message || 'Неизвестная ошибка'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
            style={{
              padding: '12px 24px', background: '#22c55e', color: '#fff', border: 'none',
              borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            Перезагрузить
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
