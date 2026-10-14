# TASK: Expedition Cartographer

Legend: `[ ]` todo, `[~]` in progress, `[x]` done.
A task is **done** only when its *Verify* criterion has been executed and passed (RULES.md section 5.4).

> Reset note: the previous TASK.md declared "all phases complete" and contained unresolved merge-conflict markers (`<<<<<<< HEAD` ... `>>>>>>>`) in "Current Focus". This roadmap starts clean. Reuse existing code where it meets the new interfaces (generator functions, typed arrays, seeded streams), but re-verify against the checks below before ticking anything.

## Current Focus
Phase 0: Core Engine

## Blocked / Questions
- (none)

---

## Phase 0: Core Engine (foundations, structures, grid)

| ID | Task | Verify / Definition of Done |
|---|---|---|
| [ ] 0.1 | Scaffold Vite + TypeScript (strict), `tsconfig.json` and `tsconfig.core.json` (no DOM lib), Vitest, fast-check, ESLint rules for core | `npm run check` passes on an empty project; adding `document.title` in `src/core` fails `typecheck` |
| [ ] 0.2 | Folder structure from ARCHITECTURE.md section 7; `docs/` with the five spec files and `MEMORY.md` | Tree matches; CI step fails if `<<<<<<<` appears in any tracked file |
| [ ] 0.3 | `Rng`: xmur3 seed hashing, sfc32, `int(n)` with rejection sampling, Fisher-Yates `shuffle`, `fork(label)` | Same seed yields the same 1000-value sequence; two forks with different labels are uncorrelated (no equal prefixes in 1e4 samples); chi-square test on `int(10)` within tolerance |
| [ ] 0.4 | `Stack`, `Queue` (ring buffer), `BitSet` on typed arrays | Unit tests for order, growth, empty-pop behavior, 1e6 push/pop under 100 ms |
| [ ] 0.5 | `MinHeap` with `(priority, seq, value)` ordering | Pops fully sorted for 10k random inputs; ties come out in insertion order |
| [ ] 0.6 | `DSU` with path compression and union by rank | Random union/find agrees with a naive component labeling on 1000 trials |
| [ ] 0.7 | `constants.ts` (walls, directions, terrain table, tuning constants) | No numeric literal appears in `core/` outside `constants.ts` and test files (lint rule) |
| [ ] 0.8 | `Grid` with typed-array storage, `neighbor`, `openNeighbors`, `carve`, `build`, `clone`, `fingerprint` | Wall-symmetry test after 10k random carve/build ops; `clone()` is independent; fingerprint stable and sensitive to a 1-bit change |
| [ ] 0.9 | Event types (`GenEvent`, `SolveEvent`) and `drain` / `takeSteps` helpers | A toy generator drains to its return value; `takeSteps(n)` pulls exactly `n` events or reports completion |
| [ ] 0.10 | Expedition Code parser/formatter (`code.ts`) | Round trip for 500 random codes; invalid inputs return specific error codes |
| [ ] 0.11 | `validate()` (symmetry, borders, connectivity, loops, dead ends) | Hand-built ASCII fixtures (perfect, loop, island, leaky border) each produce the expected report |

**Phase 0 exit:** all of the above green; `npm run check` under 10 s.

---

## Phase 1: Generators and Maze Integrity

| ID | Task | Verify / Definition of Done |
|---|---|---|
| [ ] 1.1 | Recursive Backtracker (iterative, stack) | T-G1 spanning-tree property on `{5x5, 7x13, 25x25, 100x100}` x 200 seeds |
| [ ] 1.2 | Randomized Prim's | Same property test |
| [ ] 1.3 | Randomized Kruskal's (DSU) | Same property test, plus T-G2 independent DSU cross-check |
| [ ] 1.4 | Wilson's (loop-erased random walk, `next` array) | Same property test; chi-square on a 3x3 grid over 20k seeds shows a roughly uniform distribution across all 192 spanning trees |
| [ ] 1.5 | Recursive Division (explicit stack) | Same property test; every wall segment has exactly one passage |
| [ ] 1.6 | Braid (`braid()`) with achieved-percentage report | T-B1: loops == knocked walls; achieved % within one dead end of target; deterministic per seed |
| [ ] 1.7 | Terrain and elevation (`assignTerrain`) with value noise; stream isolation | T-G4: changing `terrainPct` leaves the wall fingerprint unchanged; start/end neighborhoods are Plain; terrain density within +/-3 points of target |
| [ ] 1.8 | Golden fingerprints for 20 Expedition Codes committed in `tests/fixtures/golden.json` | T-G3 passes on Node; run once in each browser engine manually and record results in `MEMORY.md` |
| [ ] 1.9 | Generation pipeline function `buildMaze(code)` wiring RULES.md section 3.2 | Output for a code equals the golden fingerprint; invalid perfect output raises an error that includes the code |

**Phase 1 exit:** 100x100 generation under 150 ms median for every generator (`npm run perf`, logged).

---

## Phase 2: Solvers, Scoring Engine, Benchmarks (all headless)

| ID | Task | Verify / Definition of Done |
|---|---|---|
| [ ] 2.1 | DFS solver (stack, parent array, events) | Solves 1000 perfect mazes; path is valid (each step open) |
| [ ] 2.2 | BFS solver (queue) | T-V1 hop-optimality vs brute force |
| [ ] 2.3 | Dijkstra with weights | T-V3: matches the Bellman-Ford oracle on 500 random 6x6 weighted braided mazes |
| [ ] 2.4 | A* with `h = MIN_WEIGHT * Manhattan` | T-V2: cost == Dijkstra on 1000 weighted braided mazes; expansions <= Dijkstra's on average |
| [ ] 2.5 | Wall Follower with `(cell, heading)` loop guard | T-V6 passes, including the constructed trap case |
| [ ] 2.6 | `runSolver`, `PathResult` metrics (hops, cost, expanded, frontierPeak) | Unreachable end returns `found: false` for every solver (T-V4); fingerprints unchanged after solving (T-V5) |
| [ ] 2.7 | `fog.ts` (LOS per RULES.md section 1.6) | T-F1 fixtures: corridor sees through, wall blocks, adjacent open cell always visible, diagonal corner peek behavior |
| [ ] 2.8 | `scoring.ts` and worked example from RULES.md section 2.2 | T-P1: the worked example returns base 781, total 961; clamp edges tested |
| [ ] 2.9 | `phantoms.ts`: build phantom timelines from solver results | T-P2: hand-built maze finish ticks equal the formula; Wallhugger loop yields `LOST` |
| [ ] 2.10 | Solvability invariant for generated Expedition codes | T-E1: 1000 random codes, `budget >= optCost` |
| [ ] 2.11 | `BenchmarkRunner` core (pure function over params, returns samples) with batched timing (>= 5 ms per sample) | Result schema validated; identical parameters give identical metric counts (times may vary) |
| [ ] 2.12 | `RunVerifier`: replay `moves` against a code and recompute the score | T-R1: reproduces recorded score exactly; tampered move strings fail |
| [ ] 2.13 | Comparison cross-check table in tests: BFS == A* == Dijkstra on unit weights, all mazes | T-V1 on 1000 mazes, 0 mismatches |

**Phase 2 exit:** the entire headless engine is complete and tested before any renderer exists. 100x100 solve under 50 ms median per solver.

---

## Phase 3: Renderer and Cartographer Lab (UI foundation)

| ID | Task | Verify / Definition of Done |
|---|---|---|
| [ ] 3.1 | Theme tokens (CSS variables), self-hosted fonts, paper grain, engraved panel component | DESIGN.md QA items 1, 2, 8 pass; no third-party network requests |
| [ ] 3.2 | Layered renderer: L0 maze, L1 heat, L2 entities, L3 fog (double buffering) | Visual check at 25x25 and 100x100, 1x and 2x DPR: walls crisp, no half-pixel seams |
| [ ] 3.3 | Terrain patterns, elevation contours, rulers, scale bar, start/end markers | Matches DESIGN.md sections 3.6 and 4.1; patterns visible with color-blind simulation |
| [ ] 3.4 | `PlaybackTicker` with fixed timestep, speed detents, frame budget, tab-hidden auto-pause | A 100x100 Backtracker playback at `MAX` finishes without a frame over 20 ms (profiling trace attached to `MEMORY.md`) |
| [ ] 3.5 | `EventLog` and scrubbing (rewind, step back, jump to end) | Scrub to step N then forward reproduces the same canvas as continuous play (pixel-hash equal) |
| [ ] 3.6 | Web components: mech-toggle, detent-dial, transport bar, coordinate readout | Keyboard operable; `role`/`aria` verified; reduced motion honored |
| [ ] 3.7 | Lab screen: generate, solve, heat modes (order/frequency), stats ledger, algorithm complexity card | Each algorithm card shows the complexity table from PRD 5.3; stats match `PathResult` |
| [ ] 3.8 | Lab race: lockstep multi-solver on one maze (2 to 4 panes or overlay) | Finish order matches headless run results |
| [ ] 3.9 | Maze editor: toggle walls, drag start/end, paint terrain; live validator report | Edits never break wall symmetry (property test with random edit sequences); unsolvable state shows "No path" |
| [ ] 3.10 | Save/load Maze JSON v2 with validation and v1 migration | Corrupt file shows a specific error; round trip preserves the fingerprint |
| [ ] 3.11 | PNG export with cartouche, 1x/2x/4x, layer toggles | 4x export of 100x100 opens correctly; code readable in the cartouche |

**Performance milestone 3A (double buffering):** steady-state frame canvas work <= 2 ms at 100x100; full L0 rebuild <= 12 ms. Measured with the Performance panel, numbers recorded.

---

## Phase 4: Expedition Mode (the game)

| ID | Task | Verify / Definition of Done |
|---|---|---|
| [ ] 4.1 | `AppMachine`, `ExpeditionController` state machine (Briefing, Playing, Paused, Resolved) | Transition table unit tests; illegal transitions are ignored |
| [ ] 4.2 | Input: WASD, arrows, Vim keys, key repeat 220/110 ms, queue of 1, touch swipe and D-pad | Keyboard-only run completes; no dropped or doubled moves in a 60 s stress script |
| [ ] 4.3 | Movement, stamina, bump handling, win/lose per RULES.md section 1 | Unit tests: exact-stamina exit wins; bump costs 0; ruin becomes rubble after leaving |
| [ ] 4.4 | Fog rendering and remembered map | Visual matches DESIGN.md 4.5; fog state array equals headless `fog.ts` output after a scripted route |
| [ ] 4.5 | Relic placement and pickup effects (Ration, Lantern Oil, Compass) | Relics only on off-path dead ends; effect durations counted in moves; T-E1 still passes with relics ignored |
| [ ] 4.6 | Phantoms on the tick clock plus race strip | Strip positions equal `phantoms.ts` timeline at each tick; dead heat displayed correctly |
| [ ] 4.7 | Briefing and Result screens (cartouche, post-run route comparison) | Score screen numbers equal `scoring.ts` output for the recorded run |
| [ ] 4.8 | Difficulty presets, custom game, Zen option, Daily Expedition | Same UTC day gives the same code on two machines; Zen multiplier applied |
| [ ] 4.9 | Run JSON export and `Verify Run` in the lab | Exported run verifies; edited moves fail verification |
| [ ] 4.10 | Local best-times table (local storage) per code | Persists across reloads; handles disabled storage without errors |
| [ ] 4.11 | Playtest pass: 5 external players, record where they hesitate | Findings logged in `MEMORY.md`; top 3 usability problems fixed |

**Phase 4 exit:** a full Surveyor Expedition playable start to finish with keyboard and touch; replay of the same code gives the same maze.

---

## Phase 5: Final Polish and Portfolio Release

| ID | Task | Verify / Definition of Done |
|---|---|---|
| [ ] 5.1 | Benchmark dashboard UI: parameters, table, Canvas 2D charts, JSON/CSV export | Export reopens in a spreadsheet; summary matches headless numbers |
| [ ] 5.2 | **Web Worker offloading** for benchmark batches and large-maze Briefing computation | Main thread stays under 50 ms long-task during a 20-size x 15-trial x 5-solver batch; cancel works within 100 ms |
| [ ] 5.3 | Sound system (synthesized per DESIGN.md 6.1) and haptics | Rate limiter prevents more than 30 sounds/s; `MAX` playback is silent; toggles persist |
| [ ] 5.4 | Wilson's and Division presented in the lab with bias demos (side-by-side generators, same seed) | Visual difference documented in README with images |
| [ ] 5.5 | Beacons (3 chalk marks) | Placement and removal tested; marks excluded from score |
| [ ] 5.6 | Optional: WebGL2 renderer behind `Renderer` | Passes the same visual checks; falls back to Canvas 2D if unavailable. Drop if schedule is tight |
| [ ] 5.7 | Performance pass: 100x100 Expedition for 30 s, profiling | Average >= 58 FPS; bundle under 150 KB gzipped JS; no long tasks over 50 ms |
| [ ] 5.8 | Accessibility pass: keyboard-only, screen reader smoke test, reduced motion, contrast audit | DESIGN.md QA checklist fully ticked |
| [ ] 5.9 | Cross-browser check (Chrome, Firefox, Safari, Edge) incl. golden fingerprints | All pass; deviations logged and fixed |
| [ ] 5.10 | README: overview, GIFs, controls, Expedition Code format, algorithm table with complexities, how to run tests | A new clone reaches a running app in under 5 minutes following the README |
| [ ] 5.11 | Static deploy (Pages or similar), optional service worker for offline | Loads offline after first visit; fonts same-origin |
| [ ] 5.12 | Final review against PRD success metrics (section 9) and every `T-*` test | Checklist in `MEMORY.md` with evidence per metric |
| [ ] 5.13 | Demo script and evaluator walkthrough (10 minutes): lab race, benchmark, one Expedition, `Verify Run` | Rehearsed once end to end; script saved in `docs/` |

---

## Performance Optimization Milestones (summary)

| Milestone | Where | Target |
|---|---|---|
| P1 Headless speed | Phases 1 and 2 | 100x100: generate <= 150 ms, solve <= 50 ms (median) |
| P2 Canvas double buffering | Phase 3 | Frame canvas work <= 2 ms; L0 rebuild <= 12 ms |
| P3 Playback budget | Phase 3 | No frame > 20 ms at `MAX` speed |
| P4 Worker offload | Phase 5 | No main-thread long task > 50 ms during large benchmark batches |
| P5 End-to-end | Phase 5 | >= 58 FPS average, bundle < 150 KB gz |

---

## Dependency Order (what blocks what)
`Phase 0 -> Phase 1 -> Phase 2` are strictly sequential and fully headless.
`Phase 3` needs Phase 2 events. `Phase 4` needs Phases 2 and 3. `Phase 5` needs everything; items 5.1 and 5.2 can start once Phase 3 is stable.

## Risk Watchlist
| Risk | Trigger | Response |
|---|---|---|
| Determinism drift across browsers | Golden fingerprint mismatch | Find float or iteration-order dependence; fix; do not bump version unless output must change |
| Visual style slips toward generic | DESIGN.md checklist item fails | Block merge; fix before continuing |
| Scope creep | Phase 2 or 3 item started before MVP is green | Move item to the Backlog below |

## Backlog (not scheduled)
- Gamepad support
- Slope surcharge for elevation
- 3D or multi-level mazes
- Shareable "ghost run" overlays
