# src/answers/units/tables.js

Data only: every unit family, its base unit, per-unit factor and aliases.

- Mass factors are exact definitions (lb = 453.59237 g), not the rounded values the first converter used.
- Months and years are averages (30.4375 and 365.25 days); this is stated in the feature page so nobody expects calendar months.
- Data units: SI prefixes for KB/MB/GB/TB/PB (1000) and explicit KiB/MiB/GiB/TiB (1024). Because matching is case-insensitive, `kb`/`mb`/`gb` mean bytes;
  bits need the word or `kbit`/`mbit`/`gbit`.
- Temperature units give `toBase`/`fromBase` (base = celsius) instead of a factor, because the conversion is affine.
- Unit keys double as the display symbol in the answer (`m²`, `°F`, `fl oz`). Aliases are normalised by `normaliseUnit` in `index.js`,
  so `m²`, `m^2` and `m2` are one alias, and dots are ignored (`fl. oz`).
- US customary volumes (cup, pint, quart, gallon) are US sizes, not imperial.
