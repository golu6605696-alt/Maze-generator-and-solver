# MEMORY: Maze Generator & Solver

Running log of decisions, lessons, and context. Update as the project evolves. Newest entries on top within each section.

## Project Snapshot
- **Name:** Maze Generator & Solver
- **Type:** DSA project
- **Status:** Planning (docs created)
- **Language / UI:** TBD (decide in Phase 0)
- **Current focus:** see TASK.md

## Key Decisions
| Date | Decision | Reason |
|---|---|---|
| (fill in) | Grid-based, 4-directional movement | Simplest graph model; matches classic maze algorithms |
| (fill in) | Walls as bitmask on each cell | Compact; easy to keep consistent |
| (fill in) | Algorithms emit Step lists; UI replays them | Decouples logic from animation; enables headless tests |
| (fill in) | Visited state kept per solver run | Prevents cross-run contamination |

## Glossary
- **Perfect maze:** exactly one path between any two cells (spanning tree).
- **Braid maze:** maze with loops (dead ends removed).
- **Frontier:** cells adjacent to the carved region, candidates for the next carve (Prim's).
- **Admissible heuristic:** never overestimates true remaining cost (required for A* optimality).
- **DSU:** Disjoint Set Union / Union-Find.

## Lessons Learned
- (add as you go)

## Bugs & Fixes
| Date | Bug | Fix |
|---|---|---|
| | | |

## Dependencies Added
| Name | Why | Date |
|---|---|---|
| | | |

## Open Questions
- Which language and UI framework?
- Max grid size to support smoothly?
- Include weighted terrain in MVP or later?

## Useful References
- Maze generation: Recursive Backtracker, Prim's, Kruskal's, Wilson's
- Pathfinding: BFS, Dijkstra, A*
- Union-Find: path compression and union by rank
