# scripts/icons/iconsFile.mjs

Edits `public/icons.js` as text rather than parsing it: new entries go before the last `}`, so the file's comments and layout survive.
A name counts as present when `  name:` appears anywhere in the file. A comma is added when the text before the brace ends in a quote
or a comma.
