# src/features/status/OfflineIndicator.jsx

Pill shown while `navigator.onLine` is false. Always mounted (so screen readers get the `aria-live` announcement) and shown by a CSS
class; `pointer-events: none`, so it never blocks input. Takes no props.
