# src/settings/NumberField.jsx

Number input that keeps its own text. A controlled number input bound straight to the setting turns "" into 0 and "1." into 1 as
the user types, so the value fights the caret. Here: in-range numbers apply live (settings change instantly), out-of-range or
partial text is held until blur, then the text snaps back to the stored value. Clamping while typing was rejected: typing "15" with a
minimum of 5 would be rewritten to "5" after the first keystroke.

External changes (reset, import) replace the draft only while the field is not focused; while the user types, nothing rewrites
the text (that also keeps a trailing dot), and blur snaps it to the stored value.
