import React from 'react'
import ReactDOM from 'react-dom/client'
import SettingsProvider from './contexts/Settings'
import { StoreProvider } from './contexts/Store'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import App from './App'

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
