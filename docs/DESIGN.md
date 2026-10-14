# DESIGN: Expedition Field Terminal / Modern Cartography

> Supersedes the earlier UI/UX document (its blue/orange/green utility palette is retired).
> The interface should feel like a ruggedized survey instrument built by someone who loves maps, not like a SaaS dashboard.

---

## 1. Anti-AI Aesthetic Manifesto

### 1.1 Banned (reject in review, no exceptions)

| Category | Banned |
|---|---|
| Color | Indigo/violet/purple anywhere; blue-to-purple or any decorative gradient; cyan or magenta neon; glow effects (`box-shadow` with blur as "glow"); pure `#000` and pure `#fff` |
| Surfaces | Glassmorphism and `backdrop-filter: blur`; frosted cards; soft diffuse drop shadows; uniformly rounded `rounded-2xl` cards; pill buttons |
| Type | Inter, Geist, Roboto, Poppins, system-ui as a visible face; gradient-filled text; centered hero headline with a subheading and two buttons |
| Layout | Three identical feature cards in a row; symmetrical "bento" grids used as decoration; floating blobs; stock illustrations |
| Iconography | Emoji as UI; Lucide/Heroicons-style stroke icon sets; sparkle glyphs; robot motifs |
| Motion | Bouncy springs, parallax, fade-up-on-scroll, shimmer skeletons, confetti |
| Copy | "Supercharge", "seamless", "unlock", "powered by AI"; exclamation marks in UI text |

### 1.2 Required instead

1. **Every decorative element must have a job.** Rulers measure, hatching encodes terrain, registration marks align exports.
2. **Hard geometry.** Corner radius is `0` or `2px`. Shadows are hard offsets (`2px 2px 0`), never blurred.
3. **Mechanical motion.** Things move in detents (stepped easing, `steps(3)`), as if a switch had travel, not as if physics were simulated.
4. **Information density with hierarchy.** Dense like an instrument panel, but readable: three type sizes per panel at most.
5. **A voice.** Labels read like field-notebook entries: `SURVEY`, `LANTERN`, `RATIONS`, `BEARING`, `PHANTOM LEDGER`.
6. **One accent.** Brass amber is the only saturated color in chrome. Other hues appear only as data (phantoms, terrain, heat).
7. **Slight imperfection by design.** Paper grain, ink-darkened wall endpoints, a 1px registration offset on cartouches. Subtle and deterministic, never random wobble that hurts legibility.

---

## 2. Design System

### 2.1 Color Tokens

Two render themes share the same layout. **Field Terminal** (default, CRT-leaning, dark) and **Survey Sheet** (paper, light). Tokens are CSS custom properties on `:root[data-theme]`.

#### Core surfaces and text

| Token | Field Terminal | Survey Sheet | Use |
|---|---|---|---|
| `--ink` | `#0f1416` | `#1b2224` | Primary dark; Terminal page background, Sheet text |
| `--stone` | `#1b2224` | `#d9d4c5` | Panels / secondary surface |
| `--stone-2` | `#243033` | `#cbc5b3` | Raised or pressed surfaces, keycaps |
| `--parchment` | `#e6e2d8` | `#e6e2d8` | Terminal text / Sheet page ground |
| `--rule` | `#3a4649` | `#9a9684` | Borders, rulers, hairlines |
| `--rule-strong` | `#55645f` | `#6f6b5a` | Engraved outer borders, wall lines (UI) |
| `--text-dim` | `#8d978f` | `#5d5e53` | Secondary text. Contrast checked >= 4.5:1 on its surface |
| `--brass` | `#e5a93b` | `#a8741a` | The single chrome accent (Sheet uses a darker brass for contrast) |
| `--brass-dim` | `#9c7424` | `#7a561a` | Inactive accent, disabled engraving |
| `--danger` | `#c4572f` | `#a8431f` | Stamina critical, defeat (terracotta, not pure red) |
| `--ok` | `#7fa070` | `#4f7345` | Success states (lichen green) |

Page background in Terminal is `--ink`; panels are `--stone` with a 1px `--rule` border. Pure white and black are never used.

#### Canvas tokens

| Token | Terminal | Sheet | Meaning |
|---|---|---|---|
| `--cv-ground` | `#0f1416` | `#e6e2d8` | Maze floor |
| `--cv-wall` | `#d8d2c0` | `#1b2224` | Walls |
| `--cv-wall-edge` | `#e5a93b` at 25% | `#0f1416` at 25% | Wall end-cap darkening |
| `--cv-contour` | `#2d393c` | `#bdb7a3` | Elevation contour hairlines |
| `--fog-unseen` | `#080b0c` | `#b9b39f` | Unseen cells (with 45-degree hatch) |
| `--fog-remembered` | `#1b2224` (walls `#6d776f`) | `#d3cdbb` (walls `#6f6b5a`) | Seen earlier, not in view |
| `--start` | `#e5a93b` | `#a8741a` | Start marker |
| `--end` | `#c4572f` | `#a8431f` | Exit marker |
| `--path` | `#e5a93b` | `#a8741a` | Final path line |
| `--player` | `#e6e2d8` | `#1b2224` | Scout marker body (brass ring in both) |

#### Terrain (always paired with a pattern, never color alone)

| Terrain | Fill (Terminal / Sheet) | Pattern | Cost label |
|---|---|---|---|
| Plain | none | none | `1` |
| Bridge | `#7a6648` / `#b79d72` | Two parallel plank lines across the move axis | `2` |
| Mud | `#3b3a26` / `#a89f77` | Stipple dots, density medium | `3` |
| Ruins | `#4a3a33` / `#a38b78` | Broken cross-hatch with gaps | `4` |
| Rubble (after crumbling) | `#4a3a33` / `#a38b78` | Dense cross-hatch, no gaps | `6` |

#### Heat map (explored cells), 5-stop ramp, low to high
Terminal: `#1f2b28` -> `#3f5240` -> `#7d8a45` -> `#e5a93b` -> `#d8663a`
Sheet: `#dcd7c4` -> `#c4c79a` -> `#c9b565` -> `#d99a2b` -> `#c4572f`
Drawn at 55% alpha under walls, with a legend scale bar showing the min and max value.

#### Phantom colors (data hues, desaturated)

| Phantom | Terminal | Sheet |
|---|---|---|
| Hound (DFS) | `#c4572f` | `#a8431f` |
| Wallhugger | `#9c8f6a` | `#6e6445` |
| Surveyor (BFS) | `#7fa070` | `#4f7345` |
| Pathfinder (A*) | `#e5a93b` | `#a8741a` |
| Auditor (Dijkstra) | `#8398a6` | `#546a78` |

Each phantom also carries a distinct **glyph** (circle, square, triangle, diamond, cross) so identification never depends on color.

### 2.2 Typography

| Role | Family | Settings |
|---|---|---|
| Display / titles | **Fraunces** (variable) | `opsz` 72, `SOFT` 0, `WONK` 0 for headings; weight 600 |
| Data, labels, controls, body | **JetBrains Mono** | `font-variant-numeric: tabular-nums slashed-zero` |

Both self-hosted as WOFF2, subsetted to Latin, preloaded, `font-display: swap`. Fallback stacks: `"Iowan Old Style", Georgia, serif` and `ui-monospace, "SFMono-Regular", Consolas, monospace` (fallback only, never primary).

**Scale** (base 14 px, ratio about 1.25, snapped to whole pixels)

| Token | Size / line | Face | Use |
|---|---|---|---|
| `--t-label` | 11 / 14, caps, tracking `0.14em` | Mono 500 | Panel headers, engraved labels |
| `--t-data` | 13 / 18 | Mono 400 | Readouts, tables |
| `--t-body` | 14 / 20 | Mono 400 | Descriptions, tooltips |
| `--t-h3` | 18 / 24 | Fraunces 600 | Panel titles |
| `--t-h2` | 28 / 32 | Fraunces 600 | Screen titles |
| `--t-h1` | 44 / 48 | Fraunces 600, tight tracking | Menu masthead, result grade |
| `--t-grade` | 96 / 96 | Fraunces 700 | Rank letter on result screen |

Rule: Fraunces never appears below 18 px; Mono never appears above 28 px except the stamina digit readout (36 px).

### 2.3 Spacing, Borders, Elevation

- Spacing unit 4 px; scale `4, 8, 12, 16, 24, 32, 48`.
- Radius `0` (panels, keycaps) or `2px` (inputs).
- **Engraved border:** outer 1px `--rule-strong`; inner 1px `--rule` inset by 3 px; four corner tick marks (6 px) at the outer corners. Implemented with a pseudo-element, no images.
- **Raised key:** 1px `--rule-strong` border, top highlight `inset 0 1px 0 rgba(230,226,216,.08)`, bottom `inset 0 -2px 0 rgba(0,0,0,.45)`, hard offset shadow `2px 2px 0 #000000` at 100% on Terminal only when pressed-up. Pressed state removes the shadow and translates the key by `(2px, 2px)`.
- **Paper grain:** a 128 px tileable SVG noise at 4 percent opacity over the page background; disabled under `prefers-reduced-motion` and `prefers-contrast: more`.

---

## 3. Tactile Component Library

All controls are native Web Components built on semantic elements (real `<button>`, `<input type="checkbox">`, `<input type="range">`) so keyboard and screen readers work unchanged.

### 3.1 Mechanical Toggle (`<mech-toggle>`)
- 44 x 22 px slot, engraved legend `OFF` / `ON` printed beside the switch.
- Lever is a rectangular block that travels along the slot in 3 stepped frames (`steps(3)`, 90 ms), with a visible detent notch.
- On state: brass lever face and a small brass indicator pip. Off state: stone lever, dark pip.
- Sound: low "clack" on engage, higher on release (see section 6).
- Used for: Sound, Fog assist, Weighted terrain, Braid on/off, Heat mode, Theme (Terminal / Sheet).

### 3.2 Detent Dial (`<detent-dial>`)
- Replaces the speed slider. A circular dial with notch marks; each notch is a stop: `1 · 2 · 5 · 10 · 30 · 100 · 300 · 1000 · MAX` steps per second.
- Pointer drag snaps to the nearest notch; arrow keys step one notch; implemented as `role="slider"` with `aria-valuetext` such as "30 steps per second".
- A tick sound plays on each notch crossing.

### 3.3 Cassette Transport (`<transport-bar>`)
Five keycaps in a row, hardware style, with engraved SVG glyphs (drawn as simple filled shapes, not an icon library):

`|<  Rewind` `<<  Step back` `>  Play` `||  Pause` `>>  Step` `>|  End`

- Play and Pause share one latching key (depresses when active, like a cassette deck).
- Disabled keys show `--brass-dim` glyphs on a flat key.
- Keyboard: Space = play/pause, Right/Left = step, Home/End = rewind/end, `R` = reset.

### 3.4 Coordinate Readouts (`<coord-readout>`)
- Bracketed LCD-style cells: `[R:042 C:017]  [EL:+2]  [COST:3]  [T:00137]`.
- Zero-padded tabular numerals, `--brass` on `--ink`, with a faint segment-ghost underlay (unlit digits at 8 percent opacity).
- Values update with a 60 ms flicker (alternate two frames) on change; disabled for reduced motion.

### 3.5 Stamina Gauge
- A horizontal ruled bar of segmented cells (1 segment = 1 stamina unit up to 40, then 1 segment = 2 units, labeled).
- Brass fill; below 25 percent it switches to `--danger` and the digit readout pulses once (no loop).
- Numeric readout beside it in the 36 px mono face: `STAMINA 047/062`.

### 3.6 Rulers and Scale Bar
- Top and left canvas edges carry rulers: tick every cell where cell size >= 12 px, otherwise every 5; labeled every 10.
- A scale bar in the bottom right of exports and the canvas: `0 5 10 CELLS` with alternating filled segments.
- Ruler ticks follow the hovered cell with a brass index line.

### 3.7 Panels, Tabs, Tables
- Panels use the engraved border and a caps label at the top-left breaking the border line (like a map legend title).
- Tabs are index tabs: rectangular, square-cornered, the active tab merges with its panel and is marked by a brass bottom rule.
- Tables: hairline row rules, right-aligned tabular numerals, sort indicator is a small filled triangle; no zebra striping.

### 3.8 Result Cartouche
The result screen and the PNG export use the same cartouche: double-ruled title block with the grade letter in Fraunces, score breakdown as a ledger, Expedition Code in mono, and a registration cross in each corner.

---

## 4. Canvas Visual Language

### 4.1 Cell and Wall Drawing Rules
1. **Walls, not cells.** Cells have no borders. Only walls are drawn, as lines, so passages read as continuous space.
2. **Wall thickness** `max(1, round(cellPx * 0.12))` device pixels; always an integer. `lineCap = "square"` so joints close cleanly.
3. **Outer boundary** is drawn as a double rule (outer 2x thickness, 1 cell-fraction gap, inner 1x), like a map neatline.
4. **Pixel snapping:** coordinates are rounded and offset by 0.5 when thickness is odd.
5. **Batching:** one path per wall color.
6. **Ink darkening:** wall endpoints (junction ends with exactly one wall touching) get a 1 px darker dot in Sheet theme to imitate pen pressure. Skipped below 8 px cells.
7. **Contours:** where two adjacent cells have different elevation tiers, a 1 px dashed `--cv-contour` line is drawn on their shared edge (only where there is no wall).
8. **Terrain patterns** are clipped to the cell rectangle inset by one wall thickness, never overlapping walls.
9. **Start / end:** start is a filled square with letter `S`, end is an outlined square with a flag-like `E` mark; letters scale with cell size and hide below 10 px (the colored marker remains, plus a ruler highlight).
10. **LOD:** below 8 px cell size, terrain patterns collapse to flat fills (the cost legend remains) and ruler labels thin out.

### 4.2 Player Avatar (the Scout)
- A **survey pointer**: a solid triangle (bone) with a brass ring, 70 percent of cell width, oriented to the last move direction.
- On move: a 90 ms stepped slide (3 frames), never an eased glide.
- When the lantern boost is active, the ring becomes a double ring.
- Under reduced motion the avatar jumps to the next cell with no slide.

### 4.3 Trail Particles (dissipating chalk dust)
- Spawn 2 particles per move at the previous cell, each a 2 x 1 px dash rotated to the heading plus jitter derived from a **render-only** RNG (cosmetic randomness is allowed here and only here; it never touches game state).
- Alpha curve `1 -> 0` with ease-out over 1400 ms; speed 4 px/s drift opposite the heading.
- Pooled ring buffer of 64; oldest overwritten. A persistent faint "footprint" tick remains on remembered cells as the route record.

### 4.4 Heat-Map of Explored Nodes
Two modes selectable by toggle:
- **Order:** value = visit order normalized to `[0,1]` (cold early, hot late). Shows how search fronts expand: BFS looks like rings, DFS like a vine, A* like a funnel toward the exit.
- **Frequency:** value = visit count with log normalization (`log2(1 + n)`), exposing backtracking.
Drawn on L1 at 55 percent alpha, below walls. A legend ramp with numeric min/max accompanies the canvas.

### 4.5 Fog of War
- `UNSEEN`: flat `--fog-unseen` with 45-degree hatch lines every 4 px at 12 percent opacity (reads as unsurveyed paper).
- `REMEMBERED`: ground plus walls in the desaturated remembered color; terrain patterns at 50 percent; no relics shown unless collected (relics are only drawn while visible).
- `VISIBLE`: full palette.
- Transitions between states are instantaneous (no blur or feathering); the hatch edge is the boundary.

### 4.6 Phantoms
- Drawn as hollow glyphs in their data color with a 1 px outline in `--parchment`; visible only while inside the player's line of sight (plus on the race strip always).
- Race strip: one horizontal lane per phantom plus the player, ruler ticks every 10 world ticks, markers jump in whole ticks.

### 4.7 Path Line
Final path: 3 px brass line, square caps and mitered joins, drawn over terrain and under the player. In the post-run view the player's route is a dashed bone line and the optimal route is solid brass.

---

## 5. Layout and Responsiveness

### 5.1 Screens
`Menu` (masthead, two large "dispatch" panels: Expedition and Cartographer) -> `Briefing` -> `Play` / `Lab` -> `Result` / `Bench`.

### 5.2 Breakpoints

| Width | Layout |
|---|---|
| >= 1280 | Three columns: **Instrument Rail** (240 px: seed, generator, solver, toggles, dial, transport), **Map** (flexible, square-fit), **Ledger** (300 px: stats, phantom ledger, algorithm card with complexity) |
| 900 to 1279 | Two columns: Map plus a tabbed side panel (Instruments / Ledger) |
| 600 to 899 | Map on top at full width; instruments in a bottom deck with tabs; ledger behind a tab |
| < 600 | Expedition: full-bleed map, HUD condensed to a top strip (stamina, radius, tick), swipe to move, optional on-screen D-pad (44 px keys). Lab: view-only playback with a single control sheet |

- Canvas fit: `cell = floor(min(availW / cols, availH / rows))`, centered inside a fixed neatline margin sized for the rulers.
- Minimum touch target 44 x 44 px. Controls never rely on hover.

### 5.3 Accessibility
- Full keyboard path through every control; focus ring is a 2px brass outline with a 2px offset (never removed).
- Live region announces moves in terse form: "Moved east. Mud, cost 3. Stamina 41." Toggle in settings (off by default to avoid noise; auto-on for screen readers via `aria-live="polite"` summary at run end).
- Color-independent encoding for terrain (patterns), phantoms (glyphs), fog (hatch).
- `prefers-reduced-motion`: no flicker, no slide, no particles (replaced by static footprint ticks).
- Contrast: all text pairs verified >= 4.5:1; large text >= 3:1.

---

## 6. Sound and Haptic FX Design

All sound is synthesized with the Web Audio API (no audio files). Audio starts on first user gesture. Master gain default `0.35`. A global rate limiter allows at most 30 sounds per second; the `MAX` playback speed mutes tick sounds entirely.

### 6.1 Acoustic profile

The world sounds like **small mechanical hardware in a quiet room**: dry, short, slightly woody. No reverb, no musical stings, no melodic jingles.

| Sound | Trigger | Synthesis recipe | Duration | Gain |
|---|---|---|---|---|
| `tick` | Playback step, dial notch | Square wave 1.2 kHz, attack 1 ms, exponential decay to -60 dB, band-passed at 2 kHz (Q 2) | 8 ms | 0.18 |
| `step` | Expedition move, plain | Filtered noise burst (low-pass 900 Hz) plus a 140 Hz sine thump | 40 ms | 0.20 |
| `step-mud` | Move into mud | Noise low-passed 400 Hz, with a downward pitch glide 180 to 90 Hz | 90 ms | 0.22 |
| `step-bridge` | Move onto bridge | Two quick 220 Hz triangle knocks 35 ms apart | 80 ms | 0.20 |
| `step-ruins` | Move onto ruins | Noise burst high-passed 1.5 kHz plus a 3-grain crackle | 70 ms | 0.20 |
| `crumble` | Leaving a ruin | 4 to 6 random-length noise grains, descending band center 3 kHz to 800 Hz | 160 ms | 0.18 |
| `thud` | Bumping a wall | 90 Hz sine, 15 ms decay, plus a 5 ms noise click | 30 ms | 0.25 |
| `clack-on` / `clack-off` | Mechanical toggle | Two overlapping clicks (noise 3 kHz band, 4 ms) then a 260 Hz / 200 Hz thunk | 35 ms | 0.28 |
| `relic` | Pickup | Two sine partials at 880 and 1320 Hz, soft attack 3 ms, 220 ms decay, slight detune; no melody | 220 ms | 0.20 |
| `lantern` | Radius boost | Noise swell low-passed 600 Hz rising to 2 kHz | 180 ms | 0.15 |
| `low-stamina` | Stamina under 25 percent (once) | Two 440 Hz triangle pips 120 ms apart | 200 ms | 0.18 |
| `win` | Reach the exit | Three stepped square-wave notes (C4, E4, G4 equivalents), 60 ms each, then a latch click | 260 ms | 0.20 |
| `lose` | Stamina exhausted | Single 110 Hz saw with a downward glide and a lowpass sweep | 400 ms | 0.20 |

Sound toggle (mechanical switch) is persisted in local storage. A separate "Tick sounds in playback" toggle exists because repeated ticks can fatigue.

### 6.2 Haptics (touch devices with `navigator.vibrate`)

| Event | Pattern (ms) |
|---|---|
| Move | `8` |
| Mud move | `14` |
| Bump | `[10, 20, 10]` |
| Relic | `[12, 30, 12]` |
| Win | `[20, 40, 20, 40, 60]` |
| Lose | `[80]` |

Haptics default on for touch devices and respect the same Sound/Reduced-motion preferences. Never used in Lab playback.

---

## 7. Screen Notes

### 7.1 Menu
Masthead set in Fraunces: **Expedition Cartographer**, with a ruled sub-line in mono: `FIELD TERMINAL // BUILD 1.0`. Two dispatch panels, left-aligned, unequal widths (Expedition larger). No hero image; a faint topographic contour field generated from today's Daily seed sits behind the text at 6 percent opacity.

### 7.2 Briefing
Looks like a mission slip: Expedition Code, size, difficulty, stamina budget, lantern radius, phantom roster (glyph plus name plus algorithm), and a cost legend. A mechanical `DEPART` keycap starts the run.

### 7.3 Result
Cartouche layout (3.8) beside a post-run map: your route dashed, optimal route solid, phantom routes as thin colored lines (toggle each), plus `Replay`, `Same Seed`, `Open in Cartographer`, `Export PNG`, `Export Run JSON`.

### 7.4 Benchmark
Table on the left (sortable), Canvas 2D charts on the right with ruler-style axes, solver legend using the phantom glyphs. A run summary strip shows environment info (browser, cores if available) and parameters, so results are citable.

---

## 8. Design QA Checklist (part of Definition of Done for UI tasks)

- [ ] No banned color, font or effect (section 1.1) appears; a full-page screenshot was compared against the list.
- [ ] Radii are 0 or 2 px; shadows are hard offsets only.
- [ ] Every status conveyed by color also has a pattern, glyph or label.
- [ ] All text pairs meet contrast thresholds in both themes.
- [ ] Reduced-motion mode verified.
- [ ] 100 x 100 grid screenshot at 1x and 2x DPR is crisp (no half-pixel walls).
- [ ] Keyboard-only run of an Expedition completed.
- [ ] Fonts load from the app origin; no third-party requests in the network panel.
