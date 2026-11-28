# src/lib/isMobile.js

UA-based mobile guess replacing `react-device-detect` (about 30 KB). Errs toward desktop. Only `isTouch` (coarse pointer, the real input modality) is exported; the UA guess is its fallback where `matchMedia` is missing.
