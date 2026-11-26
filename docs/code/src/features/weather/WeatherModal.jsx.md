# src/features/weather/WeatherModal.jsx

Portalled forecast dialog (hero with animated scene, stats, per-day strip).

- The backdrop owns the keyboard (`data-keep-focus`), so global shortcuts ignore it, and handles Escape from anywhere inside.
- Entrance is a CSS animation only. The previous version wrapped the dialog in its own `AnimatePresence`, which unmounted together with
  the component, so the exit animation never ran; closing now unmounts at once and nothing can be left half-faded.
- Backdrop closes on `pointerdown` so a text selection dragged out of the dialog does not dismiss it.
- Focus goes into the dialog on mount and back to the previously focused element on unmount.
