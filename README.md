# 🌀 Maze Generator & Solver

An interactive, high-performance Data Structures & Algorithms (DSA) laboratory that generates mazes with multiple spanning-tree algorithms, solves them with optimal pathfinding strategies, animates every step in real time, and benchmarks algorithm efficiency on grids up to **100x100 (10,000 cells)**.

Built with **vanilla JavaScript (ESM)**, **HTML5 Canvas**, and **Vanilla CSS** with **zero external runtime or test dependencies**.

---

## ⚡ Highlights & Key Features

- **5 Maze Generators:** Recursive Backtracker (DFS), Randomized Prim's, Randomized Kruskal's (DSU), Recursive Division, and Wilson's Algorithm (Uniform Spanning Tree).
- **6 Pathfinding Solvers:** Breadth-First Search (BFS), A* Search (Manhattan heuristic), Dijkstra (Weighted terrain), Depth-First Search (DFS), Wall Follower (Left/Right-hand rule), and Dead-End Filling.
- **Ultra-Fast Performance:** Generates and solves a 100x100 maze (10,000 cells, ~20,000 wall edges) in **under 35 milliseconds** (PRD budget was < 1,000 ms).
- **Headless-First Architecture:** Pure algorithmic separation—every algorithm runs headless in Node.js and records a serializable `Step` stream replayed by the animator.
- **Interactive Tools & Modals:**
  - 📊 **Compare All Dashboard:** Benchmarks all 6 solvers simultaneously on the same grid.
  - 🏁 **Race Mode (Head-to-Head Duel):** Pits any two solvers against each other to declare a victor.
  - 📈 **Topological Analytics:** Calculates composite difficulty score (0-100), dead-end ratio, junction density, corridor count, and tree diameter (two-pass BFS).
  - ✏️ **Manual Maze Editor:** Toggle walls and passages directly on the canvas via mouse clicks.
  - 🔀 **Braid Mode:** Removes cul-de-sacs with configurable probability to inject cyclic loops.
  - 💾 **Save / Load JSON:** Standardized schema for exporting and importing custom labyrinths.
  - 🏢 **3D Multi-Level Grid Support:** Multi-floor grids with vertical stair transitions and 3D BFS.
  - 🌓 **Themes & Canvas Scaling:** Dark & Light visual themes with HiDPI / Retina Device Pixel Ratio (DPR) scaling.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on v24 with native `node:test`)
- Any modern web browser

### Running Locally
Start the zero-dependency local static server:
```bash
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Running Test Suite
Execute the 114 automated headless tests:
```bash
npm test
```

### Running 100x100 Performance Benchmarks
Run the CLI benchmark suite to measure execution times on 10,000-cell grids:
```bash
npm run bench
```

---

## ⏱️ 100x100 (10,000 Cells) Performance Benchmarks

The project requirements specified that all algorithms must execute on a **100x100 grid (10,000 cells)** in **under 1.0 second (1,000 ms)**. Our custom iterative implementations exceed this threshold by **30x to 350x**:

### Generation Benchmarks (100x100)
| Algorithm | Key Data Structure | Passages Carved | Total Reachable | Measured Time | PRD Budget |
|---|---|---|---|---|---|
| **Recursive Backtracker** | Explicit LIFO Stack | 9,999 (V - 1) | 10,000 (100%) | **~8.96 ms** | < 1,000 ms |
| **Randomized Prim's** | O(1) Swap-and-Pop Frontier | 9,999 (V - 1) | 10,000 (100%) | **~8.01 ms** | < 1,000 ms |
| **Randomized Kruskal's** | Disjoint Set Union (DSU) | 9,999 (V - 1) | 10,000 (100%) | **~8.45 ms** | < 1,000 ms |
| **Recursive Division** | Chamber Partitioning | 9,999 (V - 1) | 10,000 (100%) | **~3.34 ms** | < 1,000 ms |
| **Wilson's (UST)** | Loop-Erased Random Walk | 9,999 (V - 1) | 10,000 (100%) | **~9.60 ms** | < 1,000 ms |

### Solver Benchmarks (100x100 Perfect Maze)
| Solver | Key Data Structure | Optimality | Cells Visited | Measured Time | PRD Budget |
|---|---|---|---|---|---|
| **A* (Manhattan)** | MinHeap ($f = g + h$) | **Optimal** | ~9,629 | **~4.19 ms** | < 1,000 ms |
| **BFS** | Offset-Compacted Queue | **Optimal** | ~9,809 | **~5.32 ms** | < 1,000 ms |
| **Dijkstra** | MinHeap (Cost) | **Optimal** | ~9,811 | **~7.20 ms** | < 1,000 ms |
| **DFS** | Explicit LIFO Stack | Sub-optimal | ~6,503 | **~2.78 ms** | < 1,000 ms |
| **Wall Follower** | State Cycle Tracker | Sub-optimal | ~7,398 | **~12.11 ms** | < 1,000 ms |
| **Dead-End Filling** | Inward Degree-1 Cascade | **Optimal** | ~6,103 | **~31.74 ms** | < 1,000 ms |

---

## 🧠 Core Data Structures

All data structures are custom built in [`src/structures/`](file:///c:/Users/Lenovo/Desktop/maze-docs/src/structures/):

1. **`Stack`:** Array-backed explicit LIFO stack that avoids JavaScript recursion call-stack limits on deep traversals.
2. **`Queue`:** FIFO queue using head-pointer offsets and periodic compaction, eliminating the $O(N)$ penalty of `Array.shift()`.
3. **`MinHeap`:** Binary min-heap supporting arbitrary elements and custom comparison lambdas in $O(\log N)$ push/pop time.
4. **`DisjointSetUnion (DSU)`:** Iterative union-find data structure with full **path compression** and **union by rank**, operating in near-constant $O(\alpha(V))$ amortized time.
5. **`SeededRNG`:** Deterministic 32-bit PRNG powered by **Mulberry32** and **FNV-1a** string hashing, ensuring identical maze generation across platforms given the same seed.

---

## 🏗️ Architecture & Design Principles

```
+-------------------------------------------------------------+
|                          UI Layer                           |
|       ControlsPanel | CanvasRenderer | StatsPanel           |
+------------------------------+------------------------------+
                               |
+------------------------------v------------------------------+
|                      Application Layer                      |
|         Controller | Animator | BenchmarkRunner | MazeIO    |
+------------------------------+------------------------------+
                               |
+------------------------------v------------------------------+
|                         Core Layer                          |
|         Grid / Cell | Generators | Solvers | Analyzer       |
+------------------------------+------------------------------+
                               |
+------------------------------v------------------------------+
|                       Data Structures                       |
|         Stack | Queue | MinHeap | DSU | SeededRNG           |
+-------------------------------------------------------------+
```

1. **Decoupled Logic & UI:** Algorithms know nothing about DOM or Canvas. They return a list of `Step` events (`CARVE`, `VISIT`, `FRONTIER`, `BACKTRACK`, `PATH`).
2. **Bitmask Cell Storage:** Each Cell stores its 4 orthogonal walls in a 4-bit bitmask (`N=1, E=2, S=4, W=8`). Wall operations are $O(1)$ bitwise operations.
3. **Bidirectional Consistency:** Grid methods `removeWall(a, b)` and `addWall(a, b)` synchronously update both adjoining cells.
4. **Zero Shared Visited State:** Visited status lives strictly in algorithm-local maps, preventing state contamination across successive runs.

---

## ⌨️ Keyboard Shortcuts & Controls

| Shortcut | Action |
|---|---|
| <kbd>Space</kbd> | Pause / Resume active animation |
| <kbd>→</kbd> (Right Arrow) | Advance animation by single step (when paused) |
| <kbd>R</kbd> | Reset grid and cancel animation |
| Mouse Left Click | Carve/toggle wall in **Edit Mode** |
| Mouse Right Click | Toggle start/end placement in **Edit Mode** |

---

## 📂 Project Structure

```
maze-generator-and-solver/
├── src/
│   ├── app/                 # Controller, Animator, BenchmarkRunner, MazeIO
│   ├── core/
│   │   ├── cell.js          # Bitmask wall representation & weights
│   │   ├── grid.js          # 2D Grid with orthogonal neighbor topology
│   │   ├── grid3d.js        # Multi-level 3D grid with vertical transitions
│   │   ├── analyzer.js      # Topological metric & tree diameter calculations
│   │   ├── heuristics.js    # Manhattan & Euclidean heuristics
│   │   ├── generators/      # Backtracker, Prim, Kruskal, Division, Wilson, Braid
│   │   └── solvers/         # BFS, A*, Dijkstra, DFS, WallFollower, DeadEnd
│   ├── structures/          # Stack, Queue, MinHeap, DSU, SeededRNG
│   ├── ui/                  # CanvasRenderer, ControlsPanel, StatsPanel
│   └── main.js              # Application entry point
├── tests/                   # 114 native tests (node:test)
├── scripts/
│   └── benchmark_100x100.js # CLI 100x100 performance benchmark
├── docs/
│   ├── PRD_REVIEW.md        # Detailed requirements audit against PRD
│   └── DEMO.md              # Live demonstration script & presentation guide
├── index.html               # Main visualizer interface
├── index.css                # Polished dark/light responsive styles
├── server.js                # Zero-dependency local Node server
└── package.json
```

---

## 📄 License

MIT License. Designed for computer science education, algorithm analysis, and software engineering portfolios.