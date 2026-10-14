# RULES: Expedition Cartographer

> Supersedes the earlier conventions file. Sections 1 to 4 are **game and algorithm rules** (they are the spec for `core/`). Section 5 keeps the **engineering rules** that apply to everyone, including AI assistants.
> Every number here is a named constant in `core/constants.ts` (no magic numbers). Tests reference the constants, not literals.

---

## 1. Core Game and Exploration Mechanics

### 1.1 Movement
1. The grid is `rows x cols`, 4-directional (N, E, S, W). No diagonals.
2. A move succeeds only if there is no wall between the two cells. A blocked move is a **bump**: cost 0, no tick advance, counted in stats only.
3. Input is queued (max 1 pending); a move is applied atomically (stamina, tick clock, fog, pickups, win/lose) before the next input is read.
4. There is no undo. Retracing costs stamina like any other move.
5. Start and end are distinct, in-bounds cells. Defaults: top-left and bottom-right.

### 1.2 Terrain Cost Table
Cost is charged for the cell **entered**. The start cell is never charged.

| Terrain | Cost | Notes |
|---|---|---|
| Plain | 1 | Default |
| Bridge | 2 | Only on straight corridor cells inside mud patches (35 percent of such cells) |
| Mud | 3 | Coherent patches from the terrain noise field |
| Ruins | 4 | After the scout **leaves** a ruin cell it becomes Rubble, cost 6, for the rest of the run |
| Rubble | 6 | Never generated directly |

Invariants:
- All costs are positive integers; `MIN_WEIGHT = 1`.
- Crumbling never affects optimality of a reference path: a shortest path is simple (visits each cell once), so no cell on it is entered after crumbling. Phantoms and the optimal-cost computation therefore use the pristine costs.
- Terrain never changes walls or connectivity.

### 1.3 Stamina
```
optCost  = Dijkstra cost from start to end on the pristine maze (weights on)
budget   = ceil(optCost * SLACK[difficulty])
spent   += cost(entered cell)      on every successful move
```
| Rule | Detail |
|---|---|
| Win | Entering the end cell with `spent <= budget` (check happens after the move, so landing on the exit with exactly 0 stamina wins) |
| Lose | After any move, `spent >= budget` while not on the end cell |
| Solvability invariant | `budget >= optCost` always, so every Expedition is completable with zero relics. Verified by test T-E1 |

### 1.4 Difficulty Table

| Difficulty (code) | Maze size (default) | Lantern radius | Stamina slack | Braid % | Terrain % | Phantoms | Score multiplier `M` |
|---|---|---|---|---|---|---|---|
| Scout (`scn`) | 21 x 21 | 6 | 2.50 | 15 | 10 | Hound | 0.8 |
| Surveyor (`srv`) | 31 x 31 | 5 | 1.75 | 20 | 15 | Hound, Surveyor | 1.0 |
| Pathfinder (`pth`) | 45 x 45 | 4 | 1.35 | 25 | 20 | Hound, Surveyor, Pathfinder | 1.2 |
| Nightmare (`nmr`) | 61 x 61 | 3 | 1.15 | 30 | 25 | All five | 1.5 |

Players may override size (5 to 100) in custom games; custom games get `M = 1.0` and are marked `CUSTOM` on the result.

### 1.5 Relics
Relic count `= clamp(round(V / 120), 3, 24)`, placed by `rng.fork("relics")` on dead-end cells **off** the optimal path (so they always cost a detour). A relic is collected by entering its cell; it can be seen only while visible.

| Relic | Effect | Score |
|---|---|---|
| Ration | `budget += 6` (extra stamina) | +40 |
| Lantern Oil | Lantern radius `+2` for the next 25 moves | +40 |
| Compass | Shows bearing and straight-line cell distance to the exit for 15 moves | +40 |

Relic mix per maze: 50 percent Ration, 30 percent Lantern Oil, 20 percent Compass (rounded, at least one Ration).

### 1.6 Fog-of-War and Line of Sight

States per cell: `UNSEEN` (0), `REMEMBERED` (1), `VISIBLE` (2). Computed after every move.

1. **Candidates:** cells with `dr^2 + dc^2 <= R^2`, where `R` is the current lantern radius.
2. **Self and neighbors:** the scout's cell is always visible; any adjacent cell reachable through an open passage is always visible.
3. **Ray test:** for each other candidate, walk the supercover line (Bresenham variant that lists every cell edge crossed) from the scout's cell center to the candidate's cell center.
   - An orthogonal step is blocked if the wall bit between the two cells is set.
   - A diagonal step is blocked only if **both** L-shaped routes around the corner are blocked (this lets light peek around corners without leaking through solid wall junctions).
4. A candidate is `VISIBLE` if no step is blocked. Previously `VISIBLE` cells that are no longer visible become `REMEMBERED`. `REMEMBERED` cells never return to `UNSEEN`.
5. **Walls** belonging to a visible cell are visible; the wall on the far side of a visible cell is visible too (you see the face of a wall you are looking at).
6. Relics, phantoms and rubble state are drawn only for `VISIBLE` cells. The terrain of `REMEMBERED` cells is shown as last seen.
7. Cost: O(R^2 * R) per move, well under 0.1 ms for R <= 6.

Lab mode may disable fog entirely ("Fog assist: ON = reveal all").

---

## 2. Algorithm Competition Rules

### 2.1 Clocks
There are two independent clocks:

| Clock | Unit | Used for |
|---|---|---|
| **World tick clock** | Ticks. Entering a cell of weight `w` advances the clock by `w` for the player and for all phantoms | Phantom race and race strip |
| **Wall clock** | Seconds of active play (paused during Pause and menus) | The time term `T` of the score |

The game is turn-based on the tick clock: nothing moves unless the player moves, so phantoms never punish slow thinking. The wall clock is what rewards decisiveness.

### 2.2 Scoring Formula

Let:
- `L` = number of cells on a reference optimal path (start and end included)
- `optCost` = reference optimal cost (section 1.3), `playerCost` = total stamina spent
- `D` = distinct cells the scout entered (including start), `Rv` = number of moves into already-visited cells
- `t` = active wall-clock seconds, `tPar = TPAR_PER_CELL * L` with `TPAR_PER_CELL = 0.45`

```
E = clamp(optCost / playerCost, 0, 1)                 step (cost) efficiency
T = clamp(tPar / t, 0.20, 1)                          time-to-solve factor
W = max(0, D - L) + Rv                                wasted exploration
X = clamp(1 - W / (2 * L), 0, 1)                      exploration factor

base  = round(1000 * (0.50*E + 0.25*T + 0.25*X))
total = round(base * M) + 40 * relicsCollected + 100 * phantomsBeaten
```
Zen option (no wall clock): `T = 1` and `M` is multiplied by 0.9.

Grade is assigned from `base` (the multiplier and bonuses do not change the grade):

| Grade | Base |
|---|---|
| S | >= 920 |
| A | >= 800 |
| B | >= 650 |
| C | >= 500 |
| D | < 500 |

A loss scores 0 but records `E`, `X` and the distance reached for the post-run view.

Worked example: `optCost = 60`, `playerCost = 75` -> `E = 0.80`; `L = 40`, `t = 24 s`, `tPar = 18` -> `T = 0.75`; `D = 52`, `Rv = 6` -> `W = 18`, `X = 0.775`; `base = round(1000 * (0.40 + 0.1875 + 0.19375)) = 781`, grade B; Surveyor (`M = 1.0`), two relics, one phantom beaten: `total = 781 + 80 + 100 = 961`.

### 2.3 Phantom Timing Rules

Phantoms are computed at Briefing time by running the real solvers headless (so they use the same code as the Lab). They then replay on the tick clock.

Let `SURVEY_RATE = 0.25` ticks per expanded cell.

| Phantom | Type | Finish tick formula |
|---|---|---|
| Hound (DFS) | Physical walker | Sum of entry weights along its full trace including backtracking moves (retreating into a cell charges that cell's weight) |
| Wallhugger (Wall Follower) | Physical walker | Sum of entry weights along its walk; if the loop guard trips, it never finishes (shown as `LOST`) |
| Surveyor (BFS, weighted off, i.e. unit hops) | Surveyor | `ceil(SURVEY_RATE * expanded) + cost of its found path under real terrain weights` |
| Pathfinder (A*) | Surveyor | Same formula with its own `expanded` count and optimal path |
| Auditor (Dijkstra) | Surveyor | Same formula with its own `expanded` count and optimal path |

Surveyor phantoms stand still while surveying, then walk the found path one cell per cell-weight.

Consequences students can see: A* arrives earlier than Dijkstra with the same path cost (fewer expansions); BFS ignores terrain, so it can lose when mud is on its hop-shortest route; the Hound wins only by luck.

- Phantoms never interact with the scout (no blocking, no pickups).
- Phantom result for the player: `beaten = playerFinishTick < phantomFinishTick`. Equal ticks are a dead heat (`beaten = false`, no penalty). A phantom marked `LOST` is beaten by any finish.
- The player's finish tick equals `playerCost`.
- Phantom seeds: any randomness (the Hound's DFS neighbor order) uses `rng.fork("phantom")`, so phantom behavior is reproducible for a given code.

### 2.4 Lab Race Rules (Cartographer)
- Selected solvers advance one **event** per race tick in lockstep (not per cell weight) so expansion behavior is directly comparable.
- Finish order is by ticks to completion; ties show a dead heat. The panel also lists final cost, hops, expanded and optimality flag.
- The Wall Follower may be listed as `NO PATH (LOOP)` on braided mazes.

---

## 3. Maze Generation Rules

### 3.1 Definitions

| Term | Definition |
|---|---|
| Perfect maze | Spanning tree of the cell graph: exactly `V - 1` open passages, connected, no loops |
| Dead end | A cell with exactly one open neighbor |
| Braid maze | A perfect maze with some dead ends removed, creating loops |
| Cyclomatic number (loops) | `openPassages - V + components`; equals 0 for a perfect maze |

### 3.2 Generation Pipeline (fixed order)
1. Start from a fully walled grid; borders closed.
2. Run the chosen generator with `rng.fork("gen")`.
3. **Validate** (section 3.3). A perfect-generator failure is an engine bug and aborts with the Expedition Code attached.
4. Record `deadEndsBefore` for the braid step.
5. **Braid** with `rng.fork("braid")` if `braid% > 0`.
6. **Terrain and elevation** with `rng.fork("terrain")`.
7. **Reference solve** (Dijkstra) to get `optCost` and `L`; **relics** with `rng.fork("relics")`.
8. Re-validate; compute the fingerprint.

Because each stage owns its own RNG stream, changing a later parameter never alters an earlier stage's output.

### 3.3 Graph Validity Checks (`validate()`)

| Check | Rule | Failure meaning |
|---|---|---|
| Symmetry | For every adjacent pair, the wall bit on `a` toward `b` equals the wall bit on `b` toward `a` | Data corruption |
| Borders | All outer edges have walls | Maze leaks outside |
| Connectivity | BFS from any cell reaches `V` cells | Islands exist |
| Acyclicity (perfect only) | `openPassages == V - 1` **and** connected (equivalent to a tree); independently cross-checked with a DSU over open edges that never unions an already-joined pair | Loop or missing passage |
| Start/end | Distinct, in bounds, and (for Expedition) connected to each other | Invalid endpoints |
| Terrain | Every weight is a positive integer from the table | Bad weights |

Perfect-generator output must pass **all** checks. Braided and edited mazes must pass symmetry, borders, start/end; the lab reports connectivity, island count and loop count instead of failing.

### 3.4 Braid Rules and Percentage
```
D0         = dead ends in the perfect maze
braidPct   = 100 * (D0 - D) / D0            (D = dead ends now)
target     = round(D0 * pct / 100)
```
Algorithm: visit the dead-end cells of the perfect maze in an order shuffled by `rng.fork("braid")`. For each cell that is **still** a dead end, knock down the wall to a neighbor, preferring a neighbor that is also a dead end (this removes two dead ends with one wall); otherwise choose among the cell's closed neighbors uniformly with the RNG. Stop when the target is met. Each knocked wall adds exactly one loop.

- Because one removal can fix two dead ends, the achieved percentage may exceed the target by at most one dead end; it may be less only if no candidates remain. The achieved value is always reported.
- Edited mazes with unknown `D0` report **dead-end density** `D / V` and loop count instead of `braidPct`.

### 3.5 Per-Generator Rules

| Generator | Rules |
|---|---|
| Recursive Backtracker | Iterative with an explicit stack. Choose a uniformly random unvisited neighbor; backtrack when none. Emits `CARVE` and `BACKTRACK` events |
| Prim's | Start from a seeded random cell. Maintain a frontier array; remove a uniformly random frontier cell by swap-remove; connect it to a uniformly random in-tree neighbor |
| Kruskal's | Build the list of all internal edges, shuffle with the RNG, accept an edge if the DSU says its cells are in different sets (then union); emit `REJECT` otherwise |
| Wilson's | Pick a start cell in the tree; for each remaining cell in index order, do a random walk recording `next[cell]`; on reaching the tree, retrace `next` pointers and carve (this performs loop erasure implicitly). Emit `WALK` and `ERASE` events |
| Recursive Division | Start from an open grid; split rectangles with a wall containing exactly one passage; choose orientation by aspect ratio (ties by RNG); stop at 1-cell width. Uses an explicit stack. Emits `WALL_ADD` |

All generators must be iterative (no recursion), allocation-light, and produce identical results across runs for identical inputs.

### 3.6 Terrain Generation Rules
1. A coarse integer value-noise field (lattice spacing 4 cells, bilinear integer interpolation, no floats) is seeded from `rng.fork("terrain")`.
2. Elevation tier = field value quantized to `0..3`.
3. Mud: cells in the top `t%` of a separate low-frequency field. Density `t` is the target fraction of non-plain cells.
4. Ruins: about 3 percent of cells, chosen only from straight corridor cells (exactly two opposite open neighbors).
5. Bridge: inside mud patches, straight corridor cells convert to Bridge with probability 35 percent.
6. The start cell, end cell and their immediate neighbors are always Plain, so no run begins or ends in a penalty.

---

## 4. Solver Rules

1. BFS, Dijkstra and A* must return an optimal path under their model: BFS minimizes hops; Dijkstra and A* minimize cost. A* is optimal only with an admissible heuristic: `h = MIN_WEIGHT * Manhattan`.
2. DFS and Wall Follower are **not** required to return a shortest path.
3. If no path exists, return `found: false` and an empty path. **Never throw.**
4. Solvers must not mutate the grid; visited state lives inside the run (`BitSet`, arrays), never in shared cells.
5. Neighbor order is N, E, S, W. Heap ties break by insertion sequence, then cell index.
6. Solvers yield events lazily and count expansions at **pop/visit** time, so `expanded` is comparable across algorithms.
7. Wall Follower: right-hand rule; keep a `BitSet` of `(cell, heading)` states and stop with `found: false` on a repeat. Complete only on simply connected (perfect) mazes.
8. Weighted runs: BFS ignores weights but reports the true cost of the hop-shortest path it found, with `optimalCost: false` shown in the UI when that cost exceeds Dijkstra's.

---

## 5. Engineering Rules (all contributors, including AI assistants)

### 5.1 Code
1. `core/` and `structures/` never import `app/` or `ui/`, and compile without the DOM lib (`tsconfig.core.json`).
2. No `Math.random`, `Date`, or `performance.now` inside `core/`. Randomness comes from the injected `Rng`. Cosmetic randomness in the renderer uses a separate render-only RNG and never touches game state.
3. Integer arithmetic only in generation, terrain, solving and scoring paths.
4. No global mutable state.
5. Prefer iterative implementations; no recursion in algorithms.
6. Functions do one thing and stay under about 40 lines where practical.
7. Naming: types `PascalCase`, variables and functions `camelCase`, constants `UPPER_SNAKE`; no magic numbers.
8. Comment the why, not the what. Each algorithm file starts with a short complexity note.
9. Zero runtime dependencies. A new dev dependency needs a one-line justification in `docs/MEMORY.md`.

### 5.2 Testing
1. Every algorithm ships with at least one test; every generator ships with the spanning-tree property test (ARCHITECTURE section 9).
2. A bug fix needs a regression test. A golden-fingerprint change needs a version stamp bump (`v1` to `v2`) and a note in `docs/MEMORY.md`.
3. Tests must pass (`npm run check`) before merging.
4. Tests run headless in Node: no window, no canvas.
5. Never claim a test passed without running it.

### 5.3 Git
1. Branches: `feature/<name>`, `fix/<name>`.
2. Commit messages in imperative mood ("Add Wilson's generator"); one logical change per commit.
3. No generated files or build artifacts in commits.

### 5.4 Documentation
1. Update `TASK.md` when a task starts and when it finishes (legend: `[ ]` todo, `[~]` in progress, `[x]` done). Only mark `[x]` when the task's verification criterion has been run and passed.
2. Log decisions and lessons in `docs/MEMORY.md`.
3. If an interface changes, update `ARCHITECTURE.md` in the same commit.
4. Resolve merge conflicts in docs before committing (no conflict markers in tracked files; CI greps for `<<<<<<<`).

### 5.5 Scope
1. Finish MVP features before Phase 2 and Phase 3 items (PRD section 5.1).
2. Do not refactor unrelated code while implementing a feature.
3. UI changes must pass the DESIGN.md QA checklist (section 8).

### 5.6 AI Assistant Rules
1. Read PRD.md, ARCHITECTURE.md, DESIGN.md and this file before writing code.
2. Follow the interfaces in ARCHITECTURE.md exactly; ask before changing them.
3. Never introduce a banned color, font or effect from DESIGN.md section 1.1.
4. Keep diffs small and focused on the current TASK.md item.
