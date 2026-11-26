# src/features/settings-panel/SettingsSidebar.jsx

Category tabs and the three sidebar actions. Reset settings and Clean history confirm, clear their key, and reload: the stores are
read once at import, so a reload is the only way to be sure nothing stale remains in memory. A reset within 300 ms of an edit can be undone by the
`pagehide` flush of that pending edit; accepted, since the confirm dialog makes it practically unreachable.
