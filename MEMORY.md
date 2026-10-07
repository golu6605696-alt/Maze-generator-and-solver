# MEMORY: Maze Generator & Solver

Running log of decisions, lessons, and context. Update as the project evolves. Newest entries on top within each section.

## Project Snapshot
- **Name:** Maze Generator & Solver
- **Type:** DSA project
- **Status:** Phase 0 & Phase 1 Complete
- **Language / UI:** JavaScript (ESM, Node.js v24) + HTML5 Canvas & Vanilla CSS
- **Current focus:** Phase 2: Core Grid (see TASK.md)

## Key Decisions
| Date | Decision | Reason |
|---|---|---|
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
