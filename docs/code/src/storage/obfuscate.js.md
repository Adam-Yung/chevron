# src/storage/obfuscate.js

Reversible XOR + base64 with prefix `OBF1:`. Not encryption: it only keeps API keys from being readable at a glance in devtools.
Deterministic (fixed salt, no nonce) so saving unchanged settings does not change the stored text. A value that decodes to
non-printable characters (older salt) becomes '' so the user re-enters the key once.

Reviewed: dff7d8fe
