# Visual style

## 2026-11-26 · Sleeve patch replaces the glass look

**Problem:** the owner found the look generic ("AI looking"), chiefly the sites menu: identical rounded glass cards, soft shadows,
glossy brand circles.

**Approaches weighed** (each mocked up in the idle, typing and menu states):
1. *Sleeve patch*: canvas, stitched gold stripe, sites as sewn badges. Medium effort; warm and dark by default.
2. *Wood type press*: slab letters in two inks. Medium effort; very readable; was the recommendation.
3. *Two-ink riso*: playful but loud on a screen seen all day.
4. *Enamel sign*: cheapest, least delicate.
5. *Brush and seal*: quietest; the animated stroke is the hardest to build.

**Chosen: 1, by the owner.** It replaces the old look rather than joining it as an option: two looks would double the styling to
maintain. The old look is the git tag `stable` (d11c203).

**Rules that follow:**
- Texture is two static CSS gradients (`--weave`): no images, no filters, so typing and morphs cost what they did before.
- A chevron stripe is four strokes of one path (`src/features/chevron/drawChevron.js`); the first-paint shell repeats them in SVG.
- Two threads. `thread` (cream everywhere) sews badges, which are dyed dark; `seam` sews the chevron and blob and follows the
  cloth, because a preset's dark-scheme chevron is pale. Neither follows the text colour. The stripe's shadow is a fixed
  translucent black. Selection and key letters use the text colour, since several presets' accents are too faint on cloth.
- Full settings stores from before diff-only persistence have the old default look removed by migration, so it is not kept as a
  choice.
- A site is felt cut from the first colour of its `bgColor`, dyed down, with its icon in `thread`. The macro's `textColor` and
  gradient no longer show on badges or the blob: cream thread on one cloth is the look, at some cost in brand recognition.
- Graduate is the display face only (query, blob label, clock, site names, headings); Onest stays for reading. It must be bundled
  (the static build runs from `file://`); until `scripts/owner/add-graduate-font.sh` has run, a system slab stands in.
- The other theme presets keep their colours and inherit canvas and stitching.

## 2026-11-26 · Into search: a line, then a long bounce

**Problem:** typing morphed the chevron into a straight line, then slid a separately outlined blob over it. The stitched stripe made
the two objects obvious: a stray bar at the edge, and a transition the owner rejected as not smooth.

**Approaches weighed:** narrowing and cross-fading the stripe (rejected); morphing straight into the curve (smooth, but lost the
line and the bounce the owner wanted); overshooting that morph (its overshoot points against the travel, so it read as a slow stop);
a small swell after arrival (not enough ground); **line, then spring (chosen, as the owner specified it).**

**Chosen:** the chevron is the blob's only outline. It becomes a straight line on the left edge, then a damped spring takes it from
there into the curve, about 23% past and back; the fill follows with a horizontal scale on the same spring. Leaving is one direct
morph. The canvas is 1.4 viewport heights square so the furthest swing is not cut. At the default speed the move takes about 0.8 s,
an owner-accepted exception to the 250 ms budget in `architecture.md`; input is never held. Reduced motion runs at speed zero.
