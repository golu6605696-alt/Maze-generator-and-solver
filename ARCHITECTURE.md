# ARCHITECTURE: Maze Generator & Solver

## 1. Principles
- **Separation of concerns:** algorithms know nothing about the UI.
- **Swappable algorithms:** generators and solvers implement common interfaces.
- **Record, then replay:** algorithms output a list of steps; the visualizer replays them.
- **Headless-first:** everything except the UI runs and tests without a display.

## 2. High-Level Layers
```
+---------------------------------------------+
|                    UI Layer                 |
|   Controls | Canvas Renderer | Stats Panel  |
+----------------------+----------------------+
                       |
+----------------------v----------------------+
|              Application Layer              |
|  Controller | Animator (step player) |      |
|  BenchmarkRunner | MazeIO (save/load)       |
+----------------------+----------------------+
                       |
+----------------------v----------------------+
|                 Core Layer                  |
|  Grid / Cell | Generators | Solvers |       |
|  Heuristics | Analyzer                      |
+----------------------+----------------------+
                       |
+----------------------v----------------------+
|                 Utilities                   |
|  SeededRNG | Stack | Queue | MinHeap | DSU  |
+---------------------------------------------+
```

## 3. Core Data Model
### Cell
- `row, col`
- `walls`: bitmask `N=1, E=2, S=4, W=8` (15 = all walls)
- `weight`: movement cost, default 1
- `visited` flags are kept in algorithm-local structures, NOT in the cell, so runs never interfere.

### Grid
- `rows, cols`, 2D array of Cell
- `start, end` coordinates
- `neighbors(cell)`: all in-bounds adjacent cells
- `openNeighbors(cell)`: adjacent cells with no wall between
- `removeWall(a, b)` / `addWall(a, b)`: keeps both cells consistent

### Step (event record)
```
Step { type, cell, extra }
type in: CARVE, VISIT, FRONTIER, BACKTRACK, PATH, WALL_ADDED
```

## 4. Interfaces
```
interface Generator {
  name: string
  generate(grid, rng) -> Step[]      // mutates grid, returns steps
}

interface Solver {
  name: string
  solve(grid, start, end) -> SolveResult
}

SolveResult {
  path: Cell[]          // empty if no path
  visitedCount: int
  steps: Step[]
  timeMs: float
  cost: number          // sum of weights along path
}
```

## 5. Algorithm to Data Structure Map
| Algorithm | Role | Key structure | Complexity (V cells) |
|---|---|---|---|
| Recursive Backtracker | Generator | Stack | O(V) |
| Randomized Prim's | Generator | Frontier list | O(V) average |
| Randomized Kruskal's | Generator | Disjoint Set Union, edge list | O(E alpha(V)) |
| DFS | Solver | Stack, visited set, parent map | O(V) |
| BFS | Solver | Queue, visited set, parent map | O(V) |
| Dijkstra | Solver | Min-heap, distance map | O(V log V) |
| A* | Solver | Min-heap on f = g + h | O(V log V) worst case |

Path reconstruction: walk the `parent` map from end back to start, then reverse.

## 6. Module / Folder Structure
```
maze-project/
  src/
    core/
      cell, grid
      generators/   (backtracker, prim, kruskal, ...)
      solvers/      (dfs, bfs, dijkstra, astar, ...)
      heuristics
      analyzer
    structures/     (stack, queue, minheap, dsu, rng)
    app/
      controller, animator, benchmark, maze_io
    ui/
      renderer, controls, stats_panel
  tests/
    core/, structures/
  docs/
```

## 7. Key Flows
**Generate:** UI -> Controller -> Generator.generate(grid, rng) -> steps -> Animator replays steps -> Renderer draws.
**Solve:** UI -> Controller -> Solver.solve(grid, start, end) -> SolveResult -> Animator replays VISIT steps, then PATH.
**Compare:** BenchmarkRunner copies the same grid, runs each solver, collects SolveResult metrics -> Stats Panel.

## 8. Persistence Format (JSON)
```json
{
  "version": 1,
  "rows": 20, "cols": 20,
  "start": [0, 0], "end": [19, 19],
  "seed": 12345,
  "cells": [{ "w": 13, "wt": 1 }]
}
```

## 9. Error Handling
- Invalid size or coordinates: reject at Controller with a clear message.
- Unsolvable maze (user-edited): solver returns an empty path; UI shows "No path".
- Corrupt save file: validate version and dimensions before loading.

## 10. Testing Strategy
- Unit tests for each data structure.
- Property tests: perfect maze has exactly V-1 open edges and is fully connected.
- Solver tests on hand-built mazes with known shortest paths.
- Cross-check: BFS length == A* length == Dijkstra (weights all 1).
- Seed tests: same seed produces identical maze.
