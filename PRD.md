# PRD: Maze Generator & Solver

## 1. Overview
An interactive application that generates mazes with multiple algorithms, solves them with multiple algorithms, visualizes every step, and compares algorithm performance. The project exists to demonstrate core data structures and algorithms (DSA) in a tangible, visual way.

## 2. Goals
- Demonstrate graph, stack, queue, priority queue, and disjoint-set concepts through a working product.
- Let users watch generation and solving step by step.
- Provide measurable comparisons between algorithms on the same maze.

## 3. Non-Goals
- Multiplayer or online play.
- Photorealistic or 3D rendering (optional stretch only).
- Mobile-native apps.

## 4. Target Users
- Students learning DSA (primary).
- Instructors/evaluators reviewing the project.
- Hobbyists curious about maze algorithms.

## 5. User Stories
1. As a user, I choose a maze size and a generation algorithm, then see the maze built.
2. As a user, I pick start and end cells (or use defaults).
3. As a user, I pick a solver and watch it explore, then see the final path highlighted.
4. As a user, I control animation speed, and can pause, step, and reset.
5. As a user, I compare solvers on the same maze via a stats table.
6. As a user, I draw or edit walls manually and solve my own maze.
7. As a user, I save and load mazes.

## 6. Functional Requirements
### Must have (MVP)
| ID | Requirement |
|---|---|
| F1 | Generate a perfect maze (no loops) on an N x M grid, size 5 to 100 per side |
| F2 | Generators: Recursive Backtracker (DFS), Randomized Prim's, Randomized Kruskal's |
| F3 | Solvers: DFS, BFS, A* (Manhattan heuristic) |
| F4 | Visualize generation and solving as animation |
| F5 | Controls: generate, solve, reset, speed slider, size input |
| F6 | Show path found, path length, cells visited, time taken |
| F7 | Deterministic generation via an optional seed |

### Should have
| ID | Requirement |
|---|---|
| F8 | Dijkstra with weighted terrain cells |
| F9 | Comparison dashboard (run all solvers on one maze) |
| F10 | Manual maze editor (toggle walls, move start/end) |
| F11 | Save/load maze as JSON |
| F12 | Braid mode (remove dead ends to create loops) |

### Could have
| ID | Requirement |
|---|---|
| F13 | Recursive Division and Wilson's generators |
| F14 | Wall follower and dead-end filling solvers |
| F15 | Race mode: solvers side by side |
| F16 | Maze analytics: dead ends, longest path, difficulty score |
| F17 | Multi-level or 3D maze |

## 7. Non-Functional Requirements
- **Performance:** generate and solve a 100x100 maze in under 1 second (excluding animation).
- **Correctness:** BFS and A* must return paths of equal (optimal) length on unweighted mazes.
- **Usability:** all controls usable without reading docs.
- **Maintainability:** new generators/solvers addable by implementing one interface.
- **Testability:** algorithms run headless, with no UI dependency.

## 8. Success Metrics
- All MVP requirements demonstrated working.
- Every generated perfect maze is fully connected and loop-free (verified by automated tests).
- Solver results match expected optimal path lengths in test suite.

## 9. Constraints & Assumptions
- Grid-based mazes with 4-directional movement.
- Language/UI framework chosen in TASK.md Phase 0.
- Solo or small-team student project; timeline set by the team.

## 10. Risks
| Risk | Mitigation |
|---|---|
| UI work overshadows algorithms | Build and test algorithms headless first |
| Animation lag on large grids | Batch steps per frame; cap visual size |
| Scope creep | Follow MoSCoW tiers above; MVP first |
