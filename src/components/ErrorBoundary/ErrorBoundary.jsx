import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[Chevron] Uncaught error:', error, info)
  }

  handleReload = () => {
    location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          fontFamily: 'sans-serif',
          color: '#d2d2d2',
          background: '#1a1a1a',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.25rem' }}>Something went wrong.</div>
          <div style={{ opacity: 0.7, fontSize: '0.9rem', maxWidth: 600 }}>
            {String(this.state.error?.message || this.state.error)}
          </div>
          <button
            onClick={this.handleReload}
            style={{
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              background: 'transparent',
              color: 'inherit',
              border: '1px solid currentColor',
              borderRadius: 4
            }}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
