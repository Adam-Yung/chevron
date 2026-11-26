# src/settings/themeTypes.jsx

Colour entries and the theme structure. `Theme.structure` lists every colour with the colour it must contrast against and which
other colours follow it (`dependants`), so editing primary/secondary/accent recolours the rest. `Theme.defaultColors` fills the
primaries a partial theme omits. The colour picker is imported here, which is why these classes are not in `controlTypes.jsx`.

`thread` follows nothing: it sews badges, which are always dyed dark. `seam` follows `secondary`: it sews the chevron, which a
dark theme draws pale.
