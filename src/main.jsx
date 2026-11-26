import './storage/applyConfig'
import React from 'react'
import ReactDOM from 'react-dom/client'
import SettingsProvider from './settings/SettingsProvider'
import { UiStoreProvider } from './state/UiStore'
import SearchProvider from './search/SearchProvider'
import ErrorBoundary from './app/ErrorBoundary'
import App from './app/App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <UiStoreProvider>
          <SearchProvider>
            <App />
          </SearchProvider>
        </UiStoreProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
