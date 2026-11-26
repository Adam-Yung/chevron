# src/features/macros-editor/configFiles.js

Browser file I/O for export and import. Export wraps the config with the schema version so `src/storage/macrosConfig.js` can recognise it; the object URL is revoked right after the click to avoid leaking the blob.
