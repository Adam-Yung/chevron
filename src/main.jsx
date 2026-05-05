import React from 'react'
import ReactDOM from 'react-dom/client'
import SettingsProvider from './contexts/Settings'
import { StoreProvider } from './contexts/Store'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import { applyPersistedConfigToWindow } from './classes/localStorage/config'
import App from './App'

// If the user has saved a custom macros/commands/engines override in
// localStorage (via the Phase 4 macros editor), apply it onto
// window.CONFIG before any consumer reads from it.
applyPersistedConfigToWindow()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <StoreProvider>
          <App/>
        </StoreProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
