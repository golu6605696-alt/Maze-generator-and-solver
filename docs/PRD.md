# PRD: Expedition Cartographer

> Maze generation, solving and racing, as a playable expedition and a working lab.
> Supersedes the earlier "Maze Generator & Solver" PRD. Its Must/Should/Could tiers are re-mapped in section 6.

---

## 1. Executive Summary & Product Vision

**Expedition Cartographer** is a browser-based platform where classic data-structure and graph algorithms are experienced as an expedition rather than watched as a demo.

- **Expedition Mode** is a playable game. A scout enters a maze under fog-of-war, spends a limited stamina budget across weighted terrain, collects relics, and races automated solver "phantoms" (DFS, BFS, A*, Dijkstra, Wall Follower walking the same maze).
- **Cartographer Mode** is the lab. The same maze can be generated, replayed step by step, edited, raced and benchmarked, with exact complexity notes beside every algorithm.

**Vision statement:** *Playing the maze teaches you what the algorithm is up against. Watching the algorithm teaches you what your instincts were doing.*

**Why it is different**
1. One deterministic engine drives both the game and the lab, so every Expedition can be replayed or audited in the lab.
2. Algorithms are first-class game opponents, each with a legible personality (section 5.5).
3. Visuals follow a fixed "field terminal / modern cartography" language (see DESIGN.md), not a generic dashboard template.

**Technical thesis (for evaluators):** Stack, Queue, MinHeap and Disjoint-Set Union are each load-bearing in at least one shipped feature and covered by property tests (ARCHITECTURE.md section 9).

---

## 2. Goals / Non-Goals

### Goals
- G1. Demonstrate Stack, Queue, Priority Queue, DSU and graph traversal through working features.
- G2. Make every algorithm step observable (playback) and measurable (benchmarks).
- G3. Make the game fair: every seed is completable, scored by a published formula (RULES.md).
- G4. Total reproducibility: same Expedition Code gives the same maze, terrain, relics and phantom behavior on every machine.
- G5. 60 FPS on a 100 x 100 grid on a mid-range laptop.

### Non-Goals
- Multiplayer, accounts, leaderboards on a server (a local best-times table is in scope).
- 3D or WebGL-heavy rendering. WebGL2 is reserved as an optional Phase 3 renderer behind the same interface.
- Native mobile apps. Touch support in the browser is in scope.
- Runtime UI frameworks or component libraries. Zero runtime dependencies is a hard constraint.

---

## 3. Personas

### 3.1 Player Personas

| Persona | Profile | Needs | Success looks like |
|---|---|---|---|
| **Dev, the Expedition Player** | 22, plays puzzle and roguelike games, no DSA background | Tight controls, clear risk/reward, short runs (2 to 6 min) | Finishes a Surveyor expedition, beats one phantom, replays the same seed to improve |
| **Mira, the Lab Student** | 2nd-year CS, learning graph algorithms for exams | Step-by-step playback, pseudocode-adjacent labels, complexity next to behavior | Can explain why BFS expands more nodes than A* after watching a race |
| **Kabir, the Tinkerer** | Hobbyist who likes mazes and generative art | Seeds, PNG export, editing, braid and terrain knobs | Shares an Expedition Code and a PNG of a favorite maze |

### 3.2 Academic Evaluator Persona

**Prof. Rao, the Evaluator** reviews many student projects against a rubric and has about 15 minutes.

| Rubric concern | What the product provides |
|---|---|
| Correctness | Headless test suite; spanning-tree property tests; BFS = A* = Dijkstra on unit weights |
| Complexity understanding | Every algorithm card lists time and space; the benchmark dashboard plots measured growth against size |
| Data structure usage | Algorithm-to-structure map shown in-app (the "Ledger" panel) and in ARCHITECTURE.md |
| Reproducibility | Expedition Code, plus run replay verification (`Verify Run` re-scores a saved JSON headlessly) |
| Engineering quality | Core has no DOM dependency (enforced by tsconfig), documented rules, phased TASK.md |
| Originality | Game layer with phantoms, fog-of-war and scoring built on the same engine |

---

## 4. User Stories

### 4.1 Expedition Play

| ID | Story | Acceptance (summary) |
|---|---|---|
| EX-1 | As a player, I pick a difficulty and seed (or take a random one) and start an expedition. | Briefing screen shows size, stamina budget, fog radius, phantom roster, Expedition Code |
| EX-2 | As a player, I move with WASD, arrows or hjkl and see only what my lantern reveals. | Fog follows RULES.md section 2; remembered cells stay drawn dim |
| EX-3 | As a player, I see terrain cost before stepping. | Terrain glyphs and an on-hover cost readout for adjacent visible cells |
| EX-4 | As a player, I manage stamina and lose when it hits zero. | Stamina bar, per-move cost animation, defeat screen with a map reveal |
| EX-5 | As a player, I collect relics for bonuses and take risks to reach them. | Relics appear on dead ends; pickup effects per RULES.md |
| EX-6 | As a player, I race phantoms and see their progress on a race strip. | Phantoms advance on the shared tick clock; finish order shown |
| EX-7 | As a player, I get a score, a grade and a post-run map showing my route vs the optimal route. | Score breakdown follows the published formula |
| EX-8 | As a player, I replay the same seed or play the Daily Expedition. | Same Expedition Code reproduces identically; daily seed derives from the UTC date |

### 4.2 Cartographer Lab

| ID | Story | Acceptance (summary) |
|---|---|---|
| CA-1 | As a student, I choose size, generator, seed, braid % and terrain density, then watch generation. | Playback honors speed, pause, single-step, scrub back to start |
| CA-2 | As a student, I pick a solver and watch exploration (heat map), then the final path. | Visited order and frequency heat modes; path drawn last |
| CA-3 | As a student, I race 2 to 4 solvers on one maze in lockstep. | Shared tick clock; each solver on its own mini-canvas or an overlay |
| CA-4 | As a student, I edit walls, move start/end, paint terrain. | Edits keep walls symmetric; validator report updates live |
| CA-5 | As an evaluator, I run the benchmark dashboard and export results. | JSON and CSV export; median and spread per algorithm |
| CA-6 | As a hobbyist, I export the maze as PNG and as JSON. | PNG includes a cartouche with the Expedition Code |
| CA-7 | As an evaluator, I load a saved run and verify its score. | `Verify Run` recomputes the score headlessly and shows pass/fail |

---

## 5. Feature Specifications

### 5.1 Tier Map (replaces the old Must / Should / Could tiers)

| Tier | Contents | Roadmap phases (TASK.md) |
|---|---|---|
| **MVP** | Core engine, 3 generators, 4 solvers, Cartographer playback, single-run stats, seeds, Expedition play with fog and stamina | Phases 0 to 4 |
| **Phase 2** | Weighted terrain with Dijkstra, braid, phantom race, benchmark dashboard, editor, JSON/PNG export, sound | Phases 3 to 5 (partly overlapping MVP polish) |
| **Phase 3** | Wilson's, Recursive Division as full-fidelity, replay verification, Daily Expedition, optional WebGL2 renderer, beacons | Phase 5 and post-release |

The table in 5.7 gives the exact tier for each feature ID.

### 5.2 Fog-of-War Player Movement

| Item | Spec |
|---|---|
| Input | WASD, arrow keys, Vim `h j k l`; touch: swipe or on-screen D-pad; gamepad deferred |
| Movement | One cell per input, 4-directional, blocked by walls. Held key repeats after 220 ms, then every 110 ms |
| Cost | Entering a cell spends its terrain weight in stamina (RULES.md section 1) |
| Bump | Moving into a wall costs nothing, plays a "thud", increments the bump counter (stat only) |
| Fog states | `UNSEEN`, `REMEMBERED`, `VISIBLE` per cell (stored in a `Uint8Array`) |
| Vision | Euclidean lantern radius with wall-blocked line of sight (RULES.md section 2) |
| Rendering | Fog mask is composited on a dedicated layer; remembered cells draw with desaturated ink |
| Undo | None. Retracing costs stamina; this is the core tension |

### 5.3 Algorithmic Generators and Solvers (exact complexities)

V = number of cells (rows x cols), E = number of grid adjacencies (about 2V). All complexities assume the data structures in ARCHITECTURE.md.

**Generators**

| Algorithm | Key structure | Time | Extra space | Maze character |
|---|---|---|---|---|
| Recursive Backtracker (iterative DFS) | Stack | `O(V)` | `O(V)` | Long winding corridors, few dead ends, low branching |
| Randomized Prim's (frontier list) | Array with swap-remove | `O(V)` | `O(V)` | Many short dead ends, radial feel |
| Randomized Kruskal's | DSU (path compression + union by rank), shuffled edge list | `O(E * alpha(V))` = near-linear | `O(V + E)` | Uniform-looking, many short branches |
| Wilson's | Visited set, loop-erased random walk (next-pointer array) | Expected `O(V log V)` on grids (mean hitting time); no hard worst-case bound | `O(V)` | Uniform spanning tree (unbiased) |
| Recursive Division (iterative with explicit stack) | Stack of sub-rectangles | `O(V)` | `O(R)`, where R is the maximum pending rectangles | Long straight walls, strong rectilinear bias |

**Solvers**

| Algorithm | Key structure | Time | Space | Optimal? |
|---|---|---|---|---|
| DFS | Stack, visited set, parent map | `O(V + E)` | `O(V)` | No |
| BFS | Queue, visited set, parent map | `O(V + E)` | `O(V)` | Fewest steps only. Not cost-optimal on weighted terrain |
| Dijkstra | Binary MinHeap, distance array | `O((V + E) log V)` | `O(V)` | Yes (positive integer weights) |
| A* (Manhattan, scaled by min weight) | MinHeap on `f = g + h` | `O((V + E) log V)` worst case; typically far fewer expansions | `O(V)` | Yes (heuristic is admissible and consistent) |
| Wall Follower (right-hand rule, with loop guard) | Current cell and heading | `O(V)` steps on a perfect maze (each passage traversed at most twice); loop-guarded elsewhere | `O(V)` for the guard set | No. Complete only on simply connected mazes |

Heuristic: `h(n) = MIN_WEIGHT * (|dr| + |dc|)` with `MIN_WEIGHT = 1`, so A* stays admissible on weighted mazes.

### 5.4 Terrain Elevation and Weights

Every cell has a **terrain type** (drives weight) and an **elevation tier** (drives contour lines and the topographic look).

| Terrain | Entry cost | Notes |
|---|---|---|
| Plain | 1 | Default |
| Bridge | 2 | Planked crossing inside a mud patch |
| Mud (swamp) | 3 | Generated in coherent patches |
| Ruins (crumbling) | 4 | After the player leaves a ruin cell it becomes rubble (cost 6) for the rest of the run |

- Elevation tiers are `0..3`, produced from the same value-noise field as terrain patches. In MVP they are cosmetic (contour lines); an optional slope surcharge is a Phase 3 experiment.
- Terrain density `t` (0 to 40 percent of cells, default 15) is a generation parameter.
- **Design consequence (stated explicitly for evaluators):** in a *perfect* maze there is exactly one route, so weights cannot change the optimum. Weighted terrain only matters when loops exist. Expedition mode therefore enforces `braid >= 15 percent`, and the lab shows a warning when `braid = 0` and `terrain > 0`.

### 5.5 Head-to-Head Phantom Race Mode

A **phantom** is a solver rendered as an opponent. Phantoms and the player share one tick clock: entering a cell of weight `w` costs `w` ticks for everyone.

| Phantom | Algorithm | Behavior | Personality |
|---|---|---|---|
| The Hound | DFS | Physically walks its exploration trace, including backtracking | Fast and reckless, often lost |
| The Wallhugger | Wall Follower | Physically walks the right-hand rule | Slow and steady, predictable |
| The Surveyor | BFS | Surveys outward (idle ticks proportional to cells expanded), then marches the shortest hop-path | Thorough, ignores terrain cost |
| The Pathfinder | A* | Surveys with a short delay (few expansions), then marches the optimal path | Efficient, direct |
| The Auditor | Dijkstra | Surveys fully, then marches the lowest-cost path | Optimal, patient |

Rules for timing and fairness are in RULES.md section 3. In Cartographer mode, race mode is real-time playback instead (CA-3), with a selectable tick rate.

### 5.6 Performance Benchmark Dashboard and Exports

**Dashboard**
- Select solvers, grid sizes (for example 20, 40, 60, 80, 100), generator, braid %, terrain %, and trial count (default 15, after 3 warm-up runs).
- Measured per solver: median time (ms), IQR, cells expanded, frontier peak, path hops, path cost, optimality flag.
- Charts: time vs size, expansions vs size, grouped bars at a fixed size. Drawn with Canvas 2D by the app, not a chart library.
- Large batches run in a Web Worker and stream progress (cancelable).
- Timing method: batch each sample until at least 5 ms elapsed, divide by repetitions, to survive coarse `performance.now()` resolution.

**Export formats**

| Format | Content |
|---|---|
| Maze JSON (`.maze.json`) | Schema v2: dimensions, seed, algorithm/version stamps, wall array, terrain, elevation, start/end, relics (ARCHITECTURE.md section 8) |
| Run JSON (`.run.json`) | Expedition Code, move string, final score breakdown, phantom results; re-verifiable |
| Benchmark JSON / CSV | Environment info, parameters, per-trial samples, summary stats |
| PNG | Canvas composite at 1x, 2x or 4x with a map cartouche (title, code, scale bar, legend). The player can toggle fog/heat/path layers before export |

### 5.7 Feature Register

| ID | Feature | Tier |
|---|---|---|
| F01 | Perfect maze on `rows x cols`, each side 5 to 100 | MVP |
| F02 | Generators: Backtracker, Prim's, Kruskal's | MVP |
| F03 | Solvers: DFS, BFS, A* | MVP |
| F04 | Step-by-step playback (play, pause, step, scrub, speed) | MVP |
| F05 | Seeded determinism and Expedition Code | MVP |
| F06 | Single-run stats: hops, cost, expanded, peak frontier, time | MVP |
| F07 | Expedition: movement, fog, stamina, win/lose | MVP |
| F08 | Scoring and grades | MVP |
| F09 | Dijkstra and weighted terrain | Phase 2 |
| F10 | Braid mode (percentage) | Phase 2 |
| F11 | Phantom race (Expedition) and lockstep race (Lab) | Phase 2 |
| F12 | Benchmark dashboard, JSON/CSV export | Phase 2 |
| F13 | Maze editor (walls, start/end, terrain paint) | Phase 2 |
| F14 | Maze JSON save/load, PNG export | Phase 2 |
| F15 | Relics and pickups | Phase 2 |
| F16 | Sound and haptics | Phase 2 |
| F17 | Wilson's and Recursive Division | Phase 3 |
| F18 | Wall Follower solver and phantom | Phase 3 |
| F19 | Run replay and `Verify Run` | Phase 3 |
| F20 | Daily Expedition | Phase 3 |
| F21 | Beacons (3 chalk marks per run) | Phase 3 |
| F22 | Optional WebGL2 renderer | Phase 3 |

---

## 6. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance (headless) | 100 x 100: generate in <= 150 ms and solve in <= 50 ms (median, mid-range laptop, any single algorithm) |
| Performance (render) | Sustained 60 FPS on 100 x 100 during playback and Expedition play; frame work <= 8 ms scripting |
| Correctness | BFS, Dijkstra, A* produce equal optimal cost on every test maze; generators always yield valid spanning trees |
| Determinism | Bit-identical mazes and results across Node and browsers for the same Expedition Code |
| Accessibility | Full keyboard operation; no information by color alone; `prefers-reduced-motion` respected; contrast checked in both themes |
| Bundle | Production build under 150 KB gzipped JS plus self-hosted fonts |
| Offline | Works offline after first load (static hosting, optional service worker) |
| Browsers | Current Chrome, Firefox, Safari, Edge |

---

## 7. Edge Cases

| Case | Required behavior |
|---|---|
| Size < 5 or > 100 | Reject at the Controller with an inline message; no state change |
| Non-square sizes | Supported (rows and cols independent) |
| Start equals end, or out of bounds | Rejected with message; editor snaps back to the previous valid cell |
| User edits create an unreachable end | Validator warns; solvers return `found: false` and never throw; Expedition refuses to start from an unsolvable maze |
| User edits create loops or islands | Allowed in the lab; the validator shows loop count and island count; Expedition requires a connected maze |
| Empty or whitespace seed | A random seed is generated and displayed |
| Non-ASCII or very long seed text | Normalized (NFC, trimmed, max 64 chars) then hashed |
| Braid target exceeds achievable dead-end removals | Achieved percentage is reported; no error |
| Terrain density with `braid = 0` | Warning that weights cannot change the optimum |
| Browser tab hidden during playback | Ticker pauses automatically; on return it resumes without catch-up bursts |
| Window resize mid-run | Canvases rebuild at the new devicePixelRatio; game state untouched |
| Save file corrupt or unknown version | Validation fails with a precise message; current maze untouched |
| Stamina reaches 0 exactly on the exit | Win. The exit is entered, then stamina is checked |
| Tie in the phantom race | Dead heat: no bonus, no penalty |
| Rapid input during animation | Inputs are queued (max 1 pending) and never dropped silently into the wrong cell |
| Worker unavailable | Benchmark falls back to main-thread chunks with yielding |

---

## 8. Determinism and Seed Specification

### 8.1 Expedition Code
A compact string that fully describes a maze and its run parameters:

```
v1/<rows>x<cols>/<gen>/<seed>/b<braidPct>/t<terrainPct>/<difficulty>
example:  v1/25x25/bkt/7K3Q9M2D/b20/t15/srv
```

| Field | Meaning |
|---|---|
| `v1` | Engine/algorithm version stamp. Bumped whenever any algorithm output changes |
| `gen` | `bkt` (backtracker), `prm`, `krk`, `wil`, `div` |
| `seed` | Random seeds are 40 bits as 8 Crockford base32 characters. Typed text seeds are accepted and hashed |
| `b`, `t` | Integer percentages |
| difficulty | `scn` (Scout), `srv` (Surveyor), `pth` (Pathfinder), `nmr` (Nightmare); omitted in lab-only codes |

### 8.2 RNG pipeline
1. Normalize seed text, hash with `xmur3` into four 32-bit words.
2. Initialize `sfc32` (fast, small state, good statistical quality, passes common test batteries).
3. **Independent streams** are forked by label: `rng.fork("gen")`, `"braid"`, `"terrain"`, `"relics"`, `"phantom"`. A fork hashes the parent seed with the label. Consequence: changing terrain density never changes maze topology, and changing braid never changes terrain.
4. `Math.random`, `Date`, and `performance.now` are forbidden inside `core/` (enforced by lint rule and review).

### 8.3 Determinism rules
- Cell index = `row * cols + col`. All iteration is in index order.
- Neighbor order is always N, E, S, W.
- Heap ties break by insertion sequence number, then cell index.
- Shuffles use Fisher-Yates driven by the injected RNG only.
- Golden-fingerprint tests: for a fixed list of codes, an FNV-1a hash of the wall array must match committed values. A mismatch means either a bug or an intentional version bump (new `v` stamp plus fixture update).

### 8.4 Daily Expedition
Seed = hash of the UTC date string `YYYY-MM-DD` with the salt `"daily"`; size, generator, braid, terrain and difficulty are fixed by the engine version. Everyone gets the same maze on the same UTC day.

---

## 9. Success Metrics

| Metric | Target |
|---|---|
| All MVP features demonstrated | 100 percent |
| Spanning-tree property tests (generators x sizes x 200 seeds) | 0 failures |
| Solver optimality cross-checks | 0 mismatches |
| Golden fingerprints | Stable across Node and the three browser engines |
| 100 x 100 render | >= 58 FPS average over a 30 s Expedition |
| A new user starts an Expedition without reading docs | Under 30 seconds |
| Evaluator can verify a run | `Verify Run` passes on exported JSON |

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| Game layer overshadows algorithms | Engine and tests are built and green headless before any UI (Phases 0 to 2) |
| Visuals drift into generic dashboard styling | DESIGN.md manifesto is part of review; screenshots checked against the ban list |
| Animation lag on 100 x 100 | Dual-layer canvas, dirty rects, adaptive steps per frame, worker for batches |
| Cross-browser float differences break determinism | Core uses integer arithmetic only; no `Math.sin` or float-dependent branching |
| Fairness complaints about phantoms | Published timing rules; every seed is verified solvable within budget |
| Scope creep | Tier map in 5.1 and RULES.md scope rule: finish MVP before Phase 2 items |

---

## 11. Open Questions
- Should the Daily Expedition best time sync anywhere? Current answer: no, local only.
- Is a gamepad mapping worth Phase 3? Deferred pending playtest feedback.
