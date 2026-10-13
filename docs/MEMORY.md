# MEMORY: Maze Generator & Solver

Running log of decisions, lessons, and context. Update as the project evolves. Newest entries on top within each section.

## Project Snapshot
- **Name:** Maze Generator & Solver
- **Type:** DSA project
- **Status:** In Progress (Phase 1 complete, starting Phase 2)
- **Language / UI:** JavaScript (ES Modules) + HTML5 Canvas & Vanilla CSS
- **Current focus:** see TASK.md

## Key Decisions
| Date | Decision | Reason |
|---|---|---|
| 2026-10-11 | Mulberry32 algorithm for SeededRNG | 32-bit state, deterministic, fast, uniform distribution across platforms |
| 2026-10-11 | Queue with head pointer + compaction | Amortized O(1) dequeue without O(N) Array.prototype.shift() overhead |
| 2026-10-11 | MinHeap with custom comparator | Flexible priority queue supporting numbers, cell objects, and weighted pathfinding nodes |
| 2026-10-11 | DSU with path compression + union by rank | Near-linear O(alpha(V)) time complexity; supports numeric IDs or coordinate string keys |
| 2026-10-11 | JavaScript (ESM) + HTML5 Canvas + Vanilla CSS | Zero build steps needed; runs natively in modern browsers; completely portable |
| 2026-10-11 | Native Node.js test runner (`node:test`) | Zero external dependencies; fast, built-in headless testing in Node 24 |
| 2026-10-11 | Grid-based, 4-directional movement | Simplest graph model; matches classic maze algorithms |
| 2026-10-11 | Walls as bitmask on each cell | Compact; easy to keep consistent |
| 2026-10-11 | Algorithms emit Step lists; UI replays them | Decouples logic from animation; enables headless tests |
| 2026-10-11 | Visited state kept per solver run | Prevents cross-run contamination |

## Glossary
- **Perfect maze:** exactly one path between any two cells (spanning tree).
- **Braid maze:** maze with loops (dead ends removed).
- **Frontier:** cells adjacent to the carved region, candidates for the next carve (Prim's).
- **Admissible heuristic:** never overestimates true remaining cost (required for A* optimality).
- **DSU:** Disjoint Set Union / Union-Find.

## Lessons Learned
- Node 24 has first-class native test running (`node --test`) with zero configuration or dependencies required.

## Bugs & Fixes
| Date | Bug | Fix |
|---|---|---|
| | | |

## Dependencies Added
| Name | Why | Date |
|---|---|---|
| None | Project uses pure standard library & native platform APIs | 2026-10-11 |

## Open Questions
- Max grid size to support smoothly without dropping animation frames? (Start with 5x5 to 100x100)
- Include weighted terrain in MVP or later? (Marked for Phase 6 / Should-Have in TASK.md)

## Useful References
- Maze generation: Recursive Backtracker, Prim's, Kruskal's, Wilson's
- Pathfinding: BFS, Dijkstra, A*
- Union-Find: path compression and union by rank
