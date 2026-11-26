# scripts/owner/add-graduate-font.sh

Bundles the Graduate display face. A script for the owner because the agent session's permissions refused the download. It accepts
only a `fonts.gstatic.com` woff2, checks the file's magic bytes, and appends the `@font-face` only after the file is in place, since
the static build fails on a font URL with no file behind it.
