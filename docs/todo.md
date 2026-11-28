# Next work

In order. Delete an item when it lands; its outcome goes in `docs/status.md`.

## Waiting on the owner (found during the 2026-11 cleanup, not changed)
1. **Security:** `npm run icons` downloads with TLS verification off (`scripts/icons/fetch.mjs`), keeps `<script>`/`onload` in the
   SVG, and the app inserts icons with `innerHTML`.
2. AI follow-up questions get no context: any query edit unmounts the panel and its history.
3. A typed IP address is labelled by its last two octets (`192.168.1.1` shows "1.1"); `*.co.uk` addresses collapse the same way.
4. LM Studio and other OpenAI-compatible servers need a dummy API key.
5. A hand-edited, unparsable theme colour probably crashes the Appearance list (read from the code, not reproduced).
6. Stale hints: the offline pill promises a retry that never happens; the icon picker shows a `--write` flag that does not exist.
7. Windows service template breaks on a project path with spaces (read from the code, not run).
8. Code to delete or keep: unread settings `query.notifyAboutForcedSearchEngine` and `appearance.style`; macro `textColor` fields
   that are edited but never shown; glass mode; `scripts/owner/*.sh` (already applied); the `deploy` npm script (a second deploy
   path beside the Pages workflow); `services/`; test-only `setPropertyByPath` and `deepMerge`.
