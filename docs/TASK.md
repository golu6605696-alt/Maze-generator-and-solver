# TASK: Maze Generator & Solver

Legend: [ ] todo, [~] in progress, [x] done

## Phase 0: Setup
- [x] Choose language and UI approach (record in MEMORY.md)
- [x] Create folder structure from ARCHITECTURE.md
- [x] Set up test runner and git repo

## Phase 1: Data Structures
- [x] Seeded RNG utility
- [x] Stack, Queue
- [x] MinHeap (priority queue)
- [x] Disjoint Set Union (with path compression and union by rank)
- [x] Unit tests for all of the above

## Phase 2: Core Grid
- [ ] Cell with wall bitmask and weight
- [ ] Grid with neighbors, openNeighbors, removeWall, addWall
- [ ] Step record type
- [ ] Tests: wall consistency on both cells

## Phase 3: Generators (MVP)
- [ ] Recursive Backtracker (iterative, stack)
- [ ] Randomized Prim's
- [ ] Randomized Kruskal's (DSU)
- [ ] Tests: connected, V-1 passages, seed reproducibility

## Phase 4: Solvers (MVP)
- [ ] DFS
- [ ] BFS
- [ ] A* with Manhattan heuristic
- [ ] Path reconstruction helper
- [ ] Tests: known mazes; BFS length == A* length

## Phase 5: Visualization (MVP)
- [ ] Canvas renderer for grid and walls
- [ ] Animator that replays Step lists with speed control
- [ ] Controls panel (size, seed, algorithm pickers, buttons)
- [ ] Pause / Step / Reset
- [ ] Stats panel for a single run

## Phase 6: Should-Have Features
- [ ] Dijkstra and weighted terrain
- [ ] Compare All dashboard
- [ ] Manual maze editor
- [ ] Save/Load JSON
- [ ] Braid mode

## Phase 7: Stretch
- [ ] Recursive Division, Wilson's generators
- [ ] Wall follower, dead-end filling solvers
- [ ] Race mode
- [ ] Maze analytics (dead ends, longest path, difficulty)
- [ ] Multi-level / 3D maze

## Phase 8: Finish
- [ ] Performance check on 100x100
- [ ] README with screenshots and usage
- [ ] Final review against PRD success metrics
- [ ] Demo script / presentation notes

## Current Focus
Phase 2: Core Grid

## Blocked / Questions
- (none yet)
