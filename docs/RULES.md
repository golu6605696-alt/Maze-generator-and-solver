# RULES: Maze Generator & Solver

Conventions for everyone working on this project (including AI assistants).

## 1. Maze Rules
1. The grid is rows x cols; movement is 4-directional (N, E, S, W). No diagonals.
2. A wall between two cells is stored on both cells and must always stay consistent.
3. A **perfect maze** has exactly one path between any two cells (spanning tree: V-1 open passages, no loops).
4. A **braid maze** is a perfect maze with some dead ends removed, so loops exist.
5. Start and end must be distinct, in-bounds cells. Defaults: top-left and bottom-right.
6. Cell weights are positive integers (min 1). Unweighted mazes use weight 1.
7. Same seed + same size + same algorithm = identical maze.

## 2. Solver Rules
1. BFS, Dijkstra, and A* must return an optimal path (A* only with an admissible heuristic).
2. DFS and wall follower are NOT required to return the shortest path.
3. If no path exists, return an empty path, never throw.
4. Solvers must not mutate the grid.
5. Visited state lives inside the solver run, never in shared Cell objects.

## 3. Coding Rules
1. Algorithms live in `core/` and must not import any UI code.
2. Every generator implements `Generator`; every solver implements `Solver`.
3. No global mutable state. Randomness comes from the injected seeded RNG, never from the language's global random.
4. Prefer iterative implementations over recursion for DFS-style algorithms (deep recursion overflows on large grids).
5. Functions do one thing and stay under ~40 lines where practical.
6. Names: classes `PascalCase`, functions/variables per language convention, constants `UPPER_SNAKE`.
7. Comment the why, not the what; add a short complexity note on each algorithm.
8. No magic numbers; use named constants (e.g. `WALL_N = 1`).

## 4. Testing Rules
1. Every algorithm ships with at least one test.
2. A bug fix needs a regression test.
3. Tests must pass before merging.
4. Tests run headless (no window, no canvas).

## 5. Git Rules
1. Branches: `feature/<name>`, `fix/<name>`.
2. Commit messages: imperative mood, e.g. "Add BFS solver".
3. One logical change per commit.
4. Do not commit generated files or build artifacts.

## 6. Documentation Rules
1. Update TASK.md when a task is started or finished.
2. Log decisions and lessons in MEMORY.md.
3. If architecture changes, update ARCHITECTURE.md in the same change.

## 7. Scope Rules
1. Finish MVP (PRD Must-haves) before any Should/Could item.
2. Do not add dependencies without noting the reason in MEMORY.md.
3. Do not refactor unrelated code while implementing a feature.

## 8. AI Assistant Rules
1. Read PRD.md, ARCHITECTURE.md, and this file before writing code.
2. Follow the interfaces in ARCHITECTURE.md exactly; ask before changing them.
3. Never claim a test passed without running it.
4. Keep answers and diffs small and focused on the current task in TASK.md.
