# MEMORY: Maze Generator & Solver

Running log of decisions, lessons, and context. Update as the project evolves. Newest entries on top within each section.

## Project Snapshot
- **Name:** Maze Generator & Solver
- **Type:** DSA project
- **Status:** Phase 0 through Phase 8 Complete (All Phases Complete)
- **Language / UI:** JavaScript (ESM, Node.js v24) + HTML5 Canvas & Vanilla CSS
- **Current focus:** Project Complete (All tasks in TASK.md verified)

## Key Decisions
| Date | Decision | Reason |
|---|---|---|
| 2026-10-13 | 100x100 automated performance test suite | Validates that all 5 generators and all 6 solvers run in < 1000ms with spanning tree and path optimality invariants |
| 2026-10-13 | CLI benchmark runner (`npm run bench`) | Enables quick terminal-based benchmarking across all algorithms with tabular metrics |
| 2026-10-13 | Comprehensive PRD verification audit & demo script | Produces PRD_REVIEW.md and DEMO.md for evaluators and students learning DSA |
| 2026-10-11 | Wilson's algorithm loop erasure | Records uncommitted walk in an array where re-entering a cell overwrites the cycle, guaranteeing uniform spanning trees |
| 2026-10-11 | Recursive division iteratively partitioned | Bisects chambers horizontally or vertically based on aspect ratio, adding single open passages to avoid unreachable subgraphs |
| 2026-10-11 | Wall follower cycle detection | Tracks state triples (row, col, heading) to prune infinite loops in braided mazes |
| 2026-10-11 | Dead-end filling cul-de-sac pruning | Enqueues degree-1 cells and cascades pruning inward, leaving only true solution corridors |
| 2026-10-11 | Two-pass BFS tree diameter in MazeAnalyzer | Efficiently computes longest simple path in O(V) time to assess maze complexity and windingness |
| 2026-10-11 | 3D multi-level grid with stairwell transitions | Models multi-floor labyrinths with vertical connections between (level, row, col) cells |
| 2026-10-11 | Head-to-head Race Mode duel orchestration | Runs two solvers on isolated grid copies and determines winner based on visited count and compute time |
| 2026-10-11 | Dijkstra pathfinding on weighted terrain | Finds minimal cumulative weight path via MinHeap, prioritizing lower-cost routes over raw hop count |
| 2026-10-11 | Braid mode loop generation | Selectively removes dead ends (degree 1) to create cyclic loops without violating wall consistency |
| 2026-10-11 | Deep clone isolation in BenchmarkRunner | Executes solvers on independent grid clones to evaluate fair metrics without cross-solver mutations |
| 2026-10-11 | Standardized JSON schema for MazeIO | Enables deterministic export and import with strict version and dimension validation |
| 2026-10-11 | Dynamic frame step batching in Animator | Dynamically scales steps-per-frame (1 to 250+) to maintain 60fps responsiveness on large grids |
| 2026-10-11 | Device pixel ratio (DPR) Canvas scaling | Ensures crisp walls and markers on Retina / HiDPI displays without blurry canvas artifacts |
| 2026-10-11 | State-driven UI controls locking | Prevents race conditions during active animation while keeping Pause, Speed, and Reset accessible |
| 2026-10-11 | Zero-dependency local Node static server | Enables instant preview via `npm start` with zero external dependencies |
| 2026-10-11 | Manhattan distance heuristic for A* | Admissible & monotonic for 4-directional grids, guaranteeing optimal path length equal to BFS with fewer node expansions |
| 2026-10-11 | Non-throwing graceful empty path on unsolvable mazes | Adheres to Rule 3 returning `{ path: [], found: false, cost: 0 }` instead of throwing exceptions |
| 2026-10-11 | Reverse parent walking in `reconstructPath` | O(L) time and space reconstructs path without recursion stack limits |
| 2026-10-11 | Explicit Stack DFS for Recursive Backtracker | Eliminates recursion depth limits and call stack overflows on large grids (100x100) |
| 2026-10-11 | O(1) swap-and-pop removal for Prim's frontier | Prevents O(N) Array.splice() degradation, reducing 100x100 generation to ~11ms |
| 2026-10-11 | Early termination in Kruskal's on single component | Stops iterating remaining edges once all cells are connected in a spanning tree |
| 2026-10-11 | Bidirectional wall synchronization on `removeWall` / `addWall` | Ensures grid integrity so a wall is guaranteed consistent on both adjoining cells without single-ended open paths |
| 2026-10-11 | Disallow visited flags on `Cell` instances | Visited tracking remains local to solver/generator runs to prevent state leakage and cross-run bugs |
| 2026-10-11 | 4-bit bitmask (N=1, E=2, S=4, W=8) on `Cell` | Bitwise operations allow O(1) checks and compact memory layout for 100x100 grids (10,000 cells) |
| 2026-10-11 | Structured `Step` records with factory methods | Provides strongly validated event contracts for UI playback while keeping generator/solver execution 100% headless |
| 2026-10-07 | JavaScript ESM + Native Canvas + Vanilla CSS | Maximum web portability, zero bundler overhead, shared headless algorithms between browser and Node test runner |
| 2026-10-07 | Native `node:test` runner with 0 external dependencies | Eliminates external build/test bloat, lightning fast headless execution |
| 2026-10-07 | Mulberry32 RNG + FNV-1a string hashing | 32-bit state deterministic pseudo-random generator guaranteeing reproducible mazes across seeds |
| 2026-10-07 | Head-offset Queue with compaction | Avoids O(N) Array.shift() bottlenecks during large BFS traversals while maintaining O(1) amortized enqueue/dequeue |
| 2026-10-07 | Iterative DSU with path compression & union by rank | Prevents call stack overflow on deep paths while giving O(alpha(V)) near-constant time cycle checks for Kruskal's |
| (init) | Grid-based, 4-directional movement | Simplest graph model; matches classic maze algorithms |
| (init) | Walls as bitmask on each cell | Compact; easy to keep consistent |
| (init) | Algorithms emit Step lists; UI replays them | Decouples logic from animation; enables headless tests |
| (init) | Visited state kept per solver run | Prevents cross-run contamination |

## Glossary
- **Perfect maze:** exactly one path between any two cells (spanning tree).
- **Braid maze:** maze with loops (dead ends removed).
- **Frontier:** cells adjacent to the carved region, candidates for the next carve (Prim's).
- **Admissible heuristic:** never overestimates true remaining cost (required for A* optimality).
- **DSU:** Disjoint Set Union / Union-Find.

## Lessons Learned
- Iterative implementations for Stack, DSU, and MinHeap guarantee stability even on 100x100 (10,000 node) mazes without risking recursion depth limits.

## Bugs & Fixes
| Date | Bug | Fix |
|---|---|---|
| | | |

## Dependencies Added
| Name | Why | Date |
|---|---|---|
| None (standard library) | Used Node.js built-in `node:test` and `node:assert/strict` to keep repository zero-dependency | 2026-10-07 |

## Open Questions
- Max grid size to support smoothly (target 100x100 confirmed in PRD)?
- Include weighted terrain in MVP or later (confirmed for Phase 6 Should-Have in PRD)?

## Useful References
- Maze generation: Recursive Backtracker, Prim's, Kruskal's, Wilson's
- Pathfinding: BFS, Dijkstra, A*
- Union-Find: path compression and union by rank
