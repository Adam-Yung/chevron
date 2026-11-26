# src/settings/useColorSchemeDetector.js

Subscribes to the OS `prefers-color-scheme` so `colorScheme: 'auto'` follows the system live. `useSyncExternalStore` keeps it correct
under concurrent rendering. The media query object is created once at import.
