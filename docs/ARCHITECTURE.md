# ARCHITECTURE: Expedition Cartographer

> Supersedes the earlier architecture. The old Step-array "record then replay" model is replaced by lazy generator functions, so the UI pulls exactly as many steps as a frame can afford.

---

## 1. Principles

1. **Headless core.** Algorithms know nothing about DOM, canvas, audio or time.
2. **Lazy steps.** Generators and solvers are JavaScript generator functions. The caller decides how many steps to pull per frame.
3. **Determinism first.** Same Expedition Code gives identical output everywhere (PRD section 8).
4. **One engine, two modes.** Expedition and Cartographer are different controllers over the same core.
5. **Typed arrays over objects** in hot paths. `Cell` is a view, not a stored object.
6. **Zero runtime dependencies.** Dev tooling only.
7. **Enforced boundaries.** `core/` compiles with no DOM lib, so accidental DOM use fails the build.

---

## 2. Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Language | TypeScript (strict) | Interfaces here are contracts; compile-time safety on grid indexing and event unions |
| Build/dev | Vite | Instant dev server, static output, worker bundling built in |
| UI | Vanilla TS modules + native Web Components for controls (mechanical toggle, dial, readout) | No framework weight; the control set is small and bespoke |
| Rendering | Canvas 2D, layered, with OffscreenCanvas where available. WebGL2 renderer optional (Phase 3) behind the `Renderer` interface | 100 x 100 is only 10k cells; 2D canvas with dirty rects is enough and keeps the paper/CRT look easy to control |
| Concurrency | Web Workers (module workers) | Benchmarks and bulk generation off the main thread |
| Audio | Web Audio API, synthesized (no sample files) | Tiny bundle, tunable timbre, see DESIGN.md |
| Tests | Vitest (Node environment) + fast-check for property tests | Headless, fast, no browser needed for core |
| Lint | ESLint with `no-restricted-globals` / `no-restricted-imports` for core | Backs up the tsconfig boundary |
| Fonts | Self-hosted WOFF2 (Fraunces, JetBrains Mono) | Offline, no third-party requests, no layout shift (preload) |

Runtime dependency count target: **0**.

---

## 3. Layered Blueprint

```
+----------------------------------------------------------------------+
| UI LAYER (DOM + Canvas)                                              |
|  Screens | Controls (web components) | Renderer | Audio | Haptics    |
+----------------------------------+-----------------------------------+
                                   | commands down, events up
+----------------------------------v-----------------------------------+
| APPLICATION LAYER                                                    |
|  AppMachine | ExpeditionController | LabController                   |
|  PlaybackTicker | BenchmarkRunner (+Worker) | MazeIO | RunVerifier    |
+----------------------------------+-----------------------------------+
                                   | pure function calls, iterators
+----------------------------------v-----------------------------------+
| CORE (headless, deterministic, no DOM lib)                           |
|  Grid | Generators | Solvers | Heuristics | Terrain | Validators      |
|  Fog (LOS) | Scoring | Phantoms | Analyzer                           |
+----------------------------------+-----------------------------------+
                                   |
+----------------------------------v-----------------------------------+
| STRUCTURES                                                           |
|  Rng (sfc32 + xmur3) | Stack | Queue | MinHeap | DSU | BitSet        |
+----------------------------------------------------------------------+
```

Dependency direction is strictly downward. `core/` and `structures/` import nothing from `app/` or `ui/`.

---

## 4. Data Structures and Interfaces

All of these live in `core/types.ts`. Interface names follow the project brief; the one deliberate deviation is `MazeGenerator`, because `Generator` is already a built-in TypeScript type (the return type of generator functions) and shadowing it causes confusion.

```ts
// ---------- primitives ----------
export type CellIndex = number;          // row * cols + col, or -1 for "none"
export const NONE: CellIndex = -1;

/** Wall bitmask per cell. Bit set = wall present. */
export const Wall = { N: 1, E: 2, S: 4, W: 8, ALL: 15 } as const;
export type WallBit = typeof Wall[Exclude<keyof typeof Wall, "ALL">];

export const DIRS = [Wall.N, Wall.E, Wall.S, Wall.W] as const;  // canonical order
export const DR = [-1, 0, 1, 0] as const;
export const DC = [0, 1, 0, -1] as const;
export const OPPOSITE: Readonly<Record<WallBit, WallBit>> = {
  [Wall.N]: Wall.S, [Wall.E]: Wall.W, [Wall.S]: Wall.N, [Wall.W]: Wall.E,
};

/** A passage or wall between two orthogonally adjacent cells. Always a < b. */
export interface WallEdge { readonly a: CellIndex; readonly b: CellIndex; }

// ---------- terrain ----------
export const TerrainType = { PLAIN: 0, BRIDGE: 1, MUD: 2, RUINS: 3 } as const;
export type TerrainType = typeof TerrainType[keyof typeof TerrainType];

export interface TerrainSpec {
  readonly id: TerrainType;
  readonly key: "plain" | "bridge" | "mud" | "ruins";
  readonly cost: number;          // positive integer, >= MIN_WEIGHT
  readonly rubbleCost?: number;   // RUINS only: cost after first traversal (Expedition mode)
}

export const TERRAIN: Readonly<Record<TerrainType, TerrainSpec>> = {
  [TerrainType.PLAIN]:  { id: 0, key: "plain",  cost: 1 },
  [TerrainType.BRIDGE]: { id: 1, key: "bridge", cost: 2 },
  [TerrainType.MUD]:    { id: 2, key: "mud",    cost: 3 },
  [TerrainType.RUINS]:  { id: 3, key: "ruins",  cost: 4, rubbleCost: 6 },
};
export const MIN_WEIGHT = 1;

// ---------- grid ----------
/** Read-only convenience view; the Grid does not store Cell objects. */
export interface Cell {
  readonly index: CellIndex;
  readonly row: number;
  readonly col: number;
  readonly walls: number;         // bitmask
  readonly terrain: TerrainType;
  readonly weight: number;        // TERRAIN[terrain].cost
  readonly elevation: 0 | 1 | 2 | 3;
}

export interface Grid {
  readonly rows: number;
  readonly cols: number;
  readonly size: number;                     // rows * cols (V)
  start: CellIndex;
  end: CellIndex;

  // storage (struct of arrays; length === size)
  readonly walls: Uint8Array;
  readonly terrain: Uint8Array;
  readonly elevation: Uint8Array;

  index(row: number, col: number): CellIndex;
  rowOf(i: CellIndex): number;
  colOf(i: CellIndex): number;
  inBounds(row: number, col: number): boolean;

  /** Neighbor in direction `dir` (a Wall bit), or NONE if out of bounds. */
  neighbor(i: CellIndex, dir: WallBit): CellIndex;
  hasWall(i: CellIndex, dir: WallBit): boolean;

  /** Writes open neighbors in N,E,S,W order into `out`; returns the count. No allocation. */
  openNeighbors(i: CellIndex, out: Int32Array): number;
  /** Same, ignoring walls (in-bounds adjacency). */
  neighbors(i: CellIndex, out: Int32Array): number;

  /** Both cells updated together; the only legal way to change walls. */
  carve(a: CellIndex, b: CellIndex): void;
  build(a: CellIndex, b: CellIndex): void;

  weightAt(i: CellIndex): number;
  cell(i: CellIndex): Cell;
  clone(): Grid;
  /** FNV-1a over walls, terrain, elevation, start, end. Used by golden tests. */
  fingerprint(): number;
}

// ---------- randomness ----------
export interface Rng {
  nextU32(): number;
  /** Uniform integer in [0, n). Uses rejection sampling to avoid modulo bias. */
  int(n: number): number;
  shuffle<T>(arr: T[]): void;
  /** Independent child stream; deterministic in (parent seed, label). */
  fork(label: string): Rng;
}

// ---------- generation ----------
export type GenEvent =
  | { readonly t: "CARVE";        readonly from: CellIndex; readonly to: CellIndex }
  | { readonly t: "FRONTIER_ADD"; readonly cell: CellIndex }
  | { readonly t: "BACKTRACK";    readonly cell: CellIndex }
  | { readonly t: "WALL_ADD";     readonly a: CellIndex; readonly b: CellIndex }  // Recursive Division
  | { readonly t: "WALK";         readonly cell: CellIndex }                       // Wilson's random walk
  | { readonly t: "ERASE";        readonly cell: CellIndex }                       // Wilson's loop erasure
  | { readonly t: "UNION";        readonly a: CellIndex; readonly b: CellIndex }   // Kruskal's accepted edge
  | { readonly t: "REJECT";       readonly a: CellIndex; readonly b: CellIndex };  // Kruskal's cycle edge

export interface GenOptions {
  readonly start?: CellIndex;
  /** Percent of the perfect maze's dead ends to remove afterwards (0..100). Applied by braid(), not by generators. */
  readonly braidPct?: number;
}

export interface GenSummary {
  readonly passages: number;      // open edges after generation
  readonly steps: number;         // events yielded
}

export interface Complexity {
  readonly time: string;          // e.g. "O(V)"
  readonly space: string;
  readonly note?: string;
}

export interface MazeGenerator {
  readonly id: "bkt" | "prm" | "krk" | "wil" | "div";
  readonly name: string;
  readonly complexity: Complexity;
  /** Starts from a fully walled grid; mutates it via carve/build; yields events lazily. */
  generate(grid: Grid, rng: Rng, opts?: GenOptions): Generator<GenEvent, GenSummary, void>;
}

// ---------- solving ----------
export type SolveEvent =
  | { readonly t: "ENQUEUE";   readonly cell: CellIndex }
  | { readonly t: "VISIT";     readonly cell: CellIndex; readonly g?: number; readonly h?: number }
  | { readonly t: "RELAX";     readonly cell: CellIndex; readonly g: number }       // improved cost found
  | { readonly t: "BACKTRACK"; readonly cell: CellIndex }                            // DFS / wall follower retreat
  | { readonly t: "PATH";      readonly cell: CellIndex };                           // emitted end -> start order reversed

export interface SolveOptions {
  readonly weighted: boolean;     // false: every cell costs 1 (BFS-comparable runs)
  readonly maxEvents?: number;    // safety valve for runaway wall-follower loops
}

export interface PathResult {
  readonly solverId: string;
  readonly found: boolean;
  readonly path: readonly CellIndex[];   // start..end inclusive; empty if not found
  readonly hops: number;                 // path.length - 1 (0 if not found)
  readonly cost: number;                 // sum of weights of cells ENTERED (start excluded)
  readonly expanded: number;             // cells popped/visited
  readonly frontierPeak: number;         // max frontier/stack size
  readonly eventCount: number;
}

export interface Solver {
  readonly id: "dfs" | "bfs" | "dij" | "ast" | "wfl";
  readonly name: string;
  readonly complexity: Complexity;
  readonly guarantees: { readonly optimalHops: boolean; readonly optimalCost: boolean };
  /** Must not mutate the grid. Returns found=false (never throws) when unreachable. */
  solve(grid: Readonly<Grid>, opts: SolveOptions): Generator<SolveEvent, PathResult, void>;
}

// ---------- validation ----------
export interface ValidationReport {
  readonly symmetric: boolean;       // every wall bit mirrored on the neighbor
  readonly bordersClosed: boolean;
  readonly connected: boolean;       // BFS reaches all V cells
  readonly islands: number;          // connected components - 1
  readonly openPassages: number;
  readonly loops: number;            // cyclomatic number: openPassages - V + components
  readonly isPerfect: boolean;       // connected && openPassages === V - 1
  readonly deadEnds: number;
  readonly startEndValid: boolean;
  readonly solvable: boolean;
}
```

### Helper contracts
```ts
export function drain<T, R>(it: Generator<T, R, void>): R;                 // run to completion, return value
export function takeSteps<T, R>(it: Generator<T, R, void>, n: number,
                                sink: (e: T) => void): IteratorResult<T, R> | null;
export function runSolver(solver: Solver, grid: Readonly<Grid>, opts: SolveOptions): PathResult;
export function validate(grid: Readonly<Grid>): ValidationReport;
export function braid(grid: Grid, pct: number, rng: Rng): { removed: number; deadEndsBefore: number; achievedPct: number };
export function assignTerrain(grid: Grid, density: number, rng: Rng): void;   // uses rng.fork("terrain") internally
export function placeRelics(grid: Grid, count: number, rng: Rng): readonly CellIndex[];
```

### Algorithm to structure map

| Algorithm | Structure(s) | Where implemented |
|---|---|---|
| Recursive Backtracker | `Stack<CellIndex>` (Int32Array-backed) | `core/generators/backtracker.ts` |
| Prim's | Frontier `Int32Array` with swap-remove | `prim.ts` |
| Kruskal's | `DSU`, shuffled edge list | `kruskal.ts` |
| Wilson's | `next: Int32Array`, `inTree: BitSet` | `wilson.ts` |
| Recursive Division | `Stack<Rect>` | `division.ts` |
| DFS | `Stack`, `BitSet`, `parent: Int32Array` | `solvers/dfs.ts` |
| BFS | `Queue` (ring buffer), `BitSet`, `parent` | `bfs.ts` |
| Dijkstra | `MinHeap<(dist, seq, cell)>`, `dist: Int32Array` | `dijkstra.ts` |
| A* | `MinHeap` on `f = g + h`, `g: Int32Array` | `astar.ts` |
| Wall Follower | heading, `BitSet` of (cell, heading) states | `wallfollower.ts` |
| Fog LOS | `Uint8Array` visibility, Bresenham walk | `fog.ts` |

---

## 5. State Management

State lives in small explicit machines. No global store, no reactive framework. Each machine is a pure transition function plus a thin dispatcher: `next(state, event) -> state`, with side effects in subscribers.

### 5.1 AppMachine

| State | Event to leave | Next |
|---|---|---|
| `Boot` | `ASSETS_READY` | `Menu` |
| `Menu` | `ENTER_EXPEDITION` | `Expedition.Briefing` |
| `Menu` | `ENTER_LAB` | `Lab.Idle` |
| `Expedition.*` / `Lab.*` | `BACK` | `Menu` (confirm if a run is active) |

### 5.2 Expedition game loop

| State | Entry actions | Events | Next |
|---|---|---|---|
| `Briefing` | Build grid from code (generate, braid, terrain, relics, validate); compute `optCost` and stamina budget off-thread if size > 60 | `START` | `Playing` |
| `Playing` | Start wall-clock timer; init fog; phantoms at tick 0 | `MOVE(dir)`, `PAUSE`, `QUIT` | self / `Paused` / `Menu` |
| `Paused` | Stop wall-clock timer, dim map | `RESUME`, `QUIT` | `Playing` / `Menu` |
| `Resolved.Won` | Stop timer, compute score, write run record | `REPLAY`, `NEW`, `OPEN_IN_LAB` | `Briefing` / `Menu` / `Lab.Idle` |
| `Resolved.Lost` | Reveal full map and optimal route | same | same |

`MOVE` is turn-based. One accepted move advances the world clock by the entered cell's weight, steps phantoms accordingly, updates fog, checks relic pickup, then checks win/lose (RULES.md).

### 5.3 PlaybackTicker (Lab)

States: `Stopped`, `Playing`, `Paused`, `Stepping`, `Done`.

- Fixed-timestep accumulator driven by `requestAnimationFrame`. Speed is steps per second from a detent table: `1, 2, 5, 10, 30, 100, 300, 1000, MAX`.
- Per frame it pulls `min(stepsOwed, STEP_CAP_PER_FRAME)` events using `takeSteps`. `MAX` pulls until a time budget of `FRAME_BUDGET_MS = 6` is spent, so the main thread never blocks past one frame.
- **Scrubbing:** events are appended to an `EventLog` (typed-array backed). Scrubbing backward re-renders from the log; no inverse algorithm is needed.
- `visibilitychange` forces `Paused`; resume resets the accumulator so no catch-up burst occurs.

### 5.4 BenchmarkRunner

States: `Idle`, `Preparing`, `Warmup`, `Measuring`, `Complete`, `Cancelled`, `Failed`.

- Runs in `workers/benchmark.worker.ts`. Messages are discriminated unions: `START {params}`, `PROGRESS {done,total}`, `SAMPLE {solverId,size,trial,ms,metrics}`, `DONE {summary}`, `CANCEL`.
- Maze for each (size, trial) is derived from `seed + trial index`, so results are reproducible and comparable across solvers.
- Cancellation is cooperative: the worker checks a `SharedArrayBuffer` flag when available, otherwise between samples.

---

## 6. Rendering Engine

### 6.1 Layer stack (dual-layer minimum, five-layer actual)

| Layer | Canvas | Redraw policy | Contents |
|---|---|---|---|
| L0 `maze` | Offscreen, cached | Only when the grid changes (generate, edit, theme, resize) | Terrain patterns, elevation contours, walls, rulers |
| L1 `heat` | Offscreen, incremental | Append-only per event; full rebuild on scrub | Explored-cell heat map |
| L2 `entities` | Visible, main | Dirty rects each frame | Path line, player, phantoms, relics, trail particles, start/end markers |
| L3 `fog` | Offscreen at 1 px per cell, scaled with smoothing disabled | When visibility changes | Fog mask with hatched edge |
| L4 `chrome` | DOM | Event-driven | HUD, readouts, rulers labels |

Compositing order into the visible canvas: `L0 -> L1 -> L2 -> L3`. The visible canvas itself is the **front buffer**; `L0`, `L1`, `L3` are **back buffers** (double buffering), copied with `drawImage` only over dirty rectangles.

### 6.2 Performance rules
- Device pixel ratio handled once at canvas creation; all coordinates are CSS pixels scaled by a single transform.
- Cell size is an integer number of device pixels so walls are crisp (`ctx.translate(0.5, 0.5)` offset rule for odd widths).
- Walls are batched into one path per color; terrain patterns are `createPattern` tiles cached per cell size.
- Heat layer writes through a `Uint32Array` over `ImageData` at 1 px per cell, then scales up with `imageSmoothingEnabled = false`. Cost is O(events), not O(V) per frame.
- Trail particles use a fixed ring buffer (64 entries); no allocation per frame.
- `OffscreenCanvas` is used when `typeof OffscreenCanvas !== "undefined"`; the fallback is a detached `<canvas>` with the same API.
- 100 x 100 budget: full `L0` rebuild <= 12 ms (happens rarely); steady-state frame <= 2 ms of canvas work.

### 6.3 Renderer interface
```ts
export interface Renderer {
  resize(cssW: number, cssH: number, dpr: number): void;
  setTheme(t: Theme): void;
  drawMaze(grid: Readonly<Grid>): void;               // L0 rebuild
  applyGenEvent(e: GenEvent): void;                   // incremental
  applySolveEvent(e: SolveEvent, mode: HeatMode): void;
  setFog(vis: Uint8Array | null): void;
  frame(state: EntityFrame, dtMs: number): void;      // L2 + composite
  exportPng(scale: 1 | 2 | 4, layers: LayerToggles, cartouche: CartoucheInfo): Promise<Blob>;
  dispose(): void;
}
```
The Canvas 2D implementation ships first; a WebGL2 implementation may replace it without touching controllers.

---

## 7. Module / Folder Structure

```
expedition-cartographer/
  src/
    structures/        rng.ts stack.ts queue.ts minheap.ts dsu.ts bitset.ts
    core/
      types.ts grid.ts terrain.ts validate.ts braid.ts relics.ts
      generators/      backtracker.ts prim.ts kruskal.ts wilson.ts division.ts index.ts
      solvers/         dfs.ts bfs.ts dijkstra.ts astar.ts wallfollower.ts index.ts
      heuristics.ts fog.ts scoring.ts phantoms.ts analyzer.ts code.ts   (Expedition Code parse/format)
    app/
      app-machine.ts expedition-controller.ts lab-controller.ts
      playback-ticker.ts event-log.ts benchmark-runner.ts maze-io.ts run-verifier.ts
    workers/           benchmark.worker.ts
    ui/
      renderer/        canvas-renderer.ts layers.ts patterns.ts particles.ts
      components/      mech-toggle.ts detent-dial.ts readout.ts transport.ts ruler.ts
      screens/         menu.ts briefing.ts play.ts lab.ts bench.ts
      audio.ts haptics.ts theme.ts
    main.ts
  public/fonts/        Fraunces-*.woff2  JetBrainsMono-*.woff2
  tests/
    structures/ core/ app/ fixtures/        (fixtures: golden fingerprints, hand-built mazes)
  docs/                PRD.md ARCHITECTURE.md DESIGN.md RULES.md TASK.md MEMORY.md
  tsconfig.json  tsconfig.core.json  vite.config.ts  vitest.config.ts
```

`tsconfig.core.json` covers `src/structures` and `src/core` with `"lib": ["ES2022"]` (no `DOM`), so any use of `document`, `window` or `performance` there is a type error.

---

## 8. Persistence Formats

**Maze JSON v2**
```json
{
  "format": "expedition-maze",
  "version": 2,
  "code": "v1/25x25/bkt/7K3Q9M2D/b20/t15",
  "rows": 25, "cols": 25,
  "start": 0, "end": 624,
  "walls": "base64(Uint8Array[V])",
  "terrain": "base64(Uint8Array[V])",
  "elevation": "base64(Uint8Array[V])",
  "relics": [{ "cell": 142, "kind": "ration" }],
  "edited": false,
  "fingerprint": "9f3a21c4"
}
```
`edited: true` means the walls no longer match what the code regenerates, so the code is informational only.

**Run JSON v1**
```json
{
  "format": "expedition-run", "version": 1,
  "code": "v1/25x25/bkt/7K3Q9M2D/b20/t15/srv",
  "moves": "EESSSWNN...",
  "score": { "base": 812, "E": 0.91, "T": 0.74, "X": 0.88, "mult": 1.0, "relics": 2, "total": 892, "grade": "A" },
  "phantoms": [{ "id": "ast", "finishTick": 61, "beaten": true }]
}
```

**Migration from the earlier format (v1 `cells: [{w, wt}]`)**: loader maps `w` to walls, `wt` to the closest terrain by cost, sets `edited: true`. Unknown versions are rejected with a message.

**Validation on load:** version, dimensions in range, array lengths equal `rows * cols`, wall symmetry, borders closed, start/end distinct and in bounds.

---

## 9. Testing Architecture

All tests run in Node via Vitest. There is no DOM, canvas or window in the core test environment.

### 9.1 Layout and commands
```
npm run typecheck      tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.core.json
npm run test           vitest run
npm run test:prop      vitest run tests/core/properties   (more fast-check runs)
npm run check          typecheck + lint + test
```

### 9.2 Required test classes

| ID | Class | What it asserts |
|---|---|---|
| T-S1 | Structures | Stack/Queue order and growth; MinHeap pops sorted for random input; DSU find/union with compression; RNG reproducibility and fork independence |
| T-G1 | **Spanning tree (all perfect generators)** | For sizes in `{5x5, 7x13, 25x25, 100x100}` x 200 seeds: `openPassages === V - 1`, `connected === true`, `loops === 0`, `symmetric === true`, `bordersClosed === true` |
| T-G2 | Independent acyclicity check | A DSU built from open edges never sees a union of two already-joined cells (separate from the generator's own DSU, so Kruskal cannot grade itself) |
| T-G3 | Seed determinism | Same code produces equal fingerprints; different seeds differ; golden fingerprints from `fixtures/golden.json` match |
| T-G4 | Stream independence | Changing `terrainPct` leaves `walls` fingerprint unchanged; changing `braidPct` leaves terrain unchanged |
| T-B1 | Braid | `loops` equals removed count (each removal adds exactly one loop) minus coincident fixes; achieved % within one dead end of target or reported as capped |
| T-V1 | Solver optimality | On perfect mazes BFS, Dijkstra, A* return identical paths; on braided unit-weight mazes hops equal across BFS, Dijkstra, A* |
| T-V2 | Weighted optimality | On braided weighted mazes Dijkstra cost == A* cost <= BFS cost; DFS cost >= Dijkstra cost |
| T-V3 | Brute-force oracle | On 6x6 mazes, an exhaustive Bellman-Ford oracle equals Dijkstra cost, 500 seeds |
| T-V4 | Unreachable | Wall off the end; every solver returns `found: false`, empty path, no throw |
| T-V5 | Purity | Grid fingerprint before and after each solver is equal (solvers never mutate) |
| T-V6 | Wall follower | Solves every perfect maze up to 50x50; terminates with `found: false` via loop guard on a constructed trapped-loop case |
| T-F1 | Fog | Open corridor sees through; wall blocks; adjacent open cell always visible; visibility stable under repeated calls |
| T-P1 | Scoring | Known inputs give known scores; boundaries of `E`, `T`, `X` clamps |
| T-P2 | Phantom timing | Hand-built maze with known path: phantom finish tick equals the formula in RULES.md |
| T-R1 | Run verification | Replaying `moves` for a recorded run reproduces the recorded score exactly |
| T-C1 | Expedition Code | Parse/format round trip; invalid codes rejected with specific errors |
| T-E1 | Solvability invariant | 1000 random Expedition codes: budget >= optimal cost without any relic |

### 9.3 Fixtures
`tests/fixtures/` holds hand-built mazes as ASCII art parsed by a test helper, each with a known shortest path and known cost, for example a corridor, a room with a loop, a trap loop for the wall follower, and a weighted detour where BFS and Dijkstra disagree.

### 9.4 Performance tests
A non-blocking suite (`npm run perf`) logs headless generate/solve times for 100 x 100 and fails only if a median exceeds 3x the budget in PRD section 6, to avoid flaky CI.

---

## 10. Error Handling

| Situation | Layer | Behavior |
|---|---|---|
| Invalid size/seed/code | Controller | Reject with an inline message; no state change |
| Solver finds no path | Core | `found: false`, empty `path` |
| Wall follower loop | Core | Guard set hit or `maxEvents` exceeded: `found: false` |
| Corrupt save | MazeIO | Validation report with the first failing check |
| Worker crash | BenchmarkRunner | State `Failed`, main-thread fallback offered |
| Unexpected exception in a generator | Controller | Caught at the ticker boundary; state returns to `Idle`; error shown with the Expedition Code so it can be reproduced |

---

## 11. Decision Log Pointers
Record in `docs/MEMORY.md`: choice of Vanilla TS over a framework, the `MazeGenerator` naming decision, sfc32 selection, any added dev dependency with its reason.
