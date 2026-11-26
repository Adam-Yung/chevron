# src/features/macros-editor/validateConfig.js

Turns a config into human-readable problems that name the macro (name and position), command or engine and the field.

- Errors block saving: forbidden URL schemes (reusing `findForbiddenUrls` from `src/storage/macrosConfig.js`, so the guard has one definition), empty names or URLs, empty command types, engine query types without a template.
- Warnings never block: a trigger used by two macros (the first one wins when matching).
- `describePath` maps the dotted paths from `findForbiddenUrls` back to labels; paths it does not recognise are shown raw rather than hidden.
