# src/features/settings-panel/GeocodeRow.jsx

City lookup for the weather tab. One request at a time: a new Resolve aborts the previous one, and closing the panel aborts the
pending one, so a late reply cannot write coordinates or set state after unmount. The API key is checked for the 32-hex shape before
any request so a typo costs no call. Picking a result writes city, lat and lon in one update and clears the cached forecast.

Reviewed: 2b242c58
