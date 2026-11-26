# src/lib/normaliseURL.js

Reduces a URL to its last two host labels (`mail.google.com` -> `google.com`), used to key macros. Known limit: public suffixes with two parts collapse (`bbc.co.uk` -> `co.uk`); a test documents it.
