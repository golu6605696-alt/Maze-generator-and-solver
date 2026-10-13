<<<<<<< HEAD
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
=======
# 🧭 Maze Generator & Solver

An interactive, zero-dependency visualizer and benchmarking suite demonstrating core **Data Structures and Algorithms (DSA)** through maze generation and pathfinding.

Built with **pure JavaScript (ES Modules)**, **HTML5 Canvas**, and the native **Node.js test runner**.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture & Design Principles](#architecture--design-principles)
- [Algorithms & Data Structures](#algorithms--data-structures)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Project Roadmap & Status](#project-roadmap--status)
- [Development Rules & Conventions](#development-rules--conventions)
- [Documentation Index](#documentation-index)
- [License](#license)

---

## Overview

The primary goal of this project is to turn abstract computer science concepts—spanning graph theory, disjoint-set forests, tree generation, and priority queues—into tangible, real-time visual experiences.

Every algorithm runs **headlessly** and outputs discrete step records. The rendering engine replays these steps smoothly onto an HTML5 Canvas, allowing users to watch algorithms think, explore, backtrack, and optimize.

### Core Highlights
- **Zero Runtime Dependencies**: Pure vanilla JavaScript with native web platform standards.
- **Headless-First Design**: Algorithms have zero coupling to DOM or Canvas, making them 100% unit-testable.
- **Event-Driven Step Recording**: Algorithms record their exploration state into immutable `Step` streams that can be paused, stepped forward, or benchmarked instantly.
- **Deterministic Seeded RNG**: Custom 32-bit PRNG (Mulberry32) ensures reproducible maze generation across runs.

---

## Architecture & Design Principles

The application strictly enforces a four-tier decoupled architecture:
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564

```
+-------------------------------------------------------------+
|                          UI Layer                           |
<<<<<<< HEAD
|       ControlsPanel | CanvasRenderer | StatsPanel           |
=======
|       Controls Panel  |  Canvas Renderer  |  Stats Panel     |
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
+------------------------------+------------------------------+
                               |
+------------------------------v------------------------------+
|                      Application Layer                      |
<<<<<<< HEAD
|         Controller | Animator | BenchmarkRunner | MazeIO    |
=======
|    Controller  |  Animator (Step Player)  |  BenchmarkRunner  |
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
+------------------------------+------------------------------+
                               |
+------------------------------v------------------------------+
|                         Core Layer                          |
<<<<<<< HEAD
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
=======
|    Grid / Cell  |  Generators  |  Solvers  |  Heuristics    |
+------------------------------+------------------------------+
                               |
+------------------------------v------------------------------+
|                       Utilities / DSA                       |
|   SeededRNG  |  Stack  |  Queue  |  MinHeap  |  DisjointSet |
+-------------------------------------------------------------+
```

### 1. Separation of Concerns
Algorithms operate purely on logical `Grid` and `Cell` abstractions. They do not manipulate DOM elements, invoke `requestAnimationFrame`, or alter visual canvas states.

### 2. "Record, Then Replay"
Generators and Solvers emit a stream of discrete `Step` events:
```javascript
// Event structure
{
  type: 'CARVE' | 'VISIT' | 'FRONTIER' | 'BACKTRACK' | 'PATH' | 'WALL_ADDED',
  cell: { row, col },
  extra: {}
}
```
The application animator consumes and steps through this stream at configurable playback speeds (from 1 step/second to instantaneous completion).

### 3. Bitmask Cell Representation
Each cell encapsulates its 4-directional walls (`N=1`, `E=2`, `S=4`, `W=8`) in an efficient single-byte bitmask (`15` = all walls intact). Wall mutations are symmetrically synchronized between adjacent neighbors.

### 4. Non-Contaminating State
Solver states (e.g., `visited`, `distance`, `parent`) are encapsulated in local structures per run, leaving the shared `Cell` and `Grid` instances clean for subsequent solver comparisons.

---

## Algorithms & Data Structures

| Algorithm | Category | Primary Data Structure | Time Complexity | Optimality Guarantee |
|---|---|---|---|---|
| **Recursive Backtracker** | Generator | `Stack` (LIFO) | $O(V)$ | Perfect Maze (Spanning Tree) |
| **Randomized Prim's** | Generator | Frontier Array / List | $O(V)$ avg | Perfect Maze (Spanning Tree) |
| **Randomized Kruskal's** | Generator | `DisjointSet` (DSU) + Edge List | $O(E \cdot \alpha(V))$ | Perfect Maze (Spanning Tree) |
| **Recursive Division** | Generator | Recursive Subgrids | $O(V \log V)$ | Perfect Maze |
| **Breadth-First Search (BFS)** | Solver | `Queue` (FIFO) | $O(V)$ | Guaranteed Shortest Path |
| **Depth-First Search (DFS)** | Solver | `Stack` (LIFO) | $O(V)$ | Non-optimal (Exploratory) |
| **A\* Search** | Solver | `MinHeap` (Priority Queue) | $O(V \log V)$ | Guaranteed Shortest (Admissible $h$) |
| **Dijkstra's Algorithm** | Solver | `MinHeap` (Priority Queue) | $O(V \log V)$ | Guaranteed Shortest (Weighted) |

---

## Project Structure

```
Maze-generator-and-solver/
├── docs/                     # Comprehensive architecture and planning specifications
│   ├── ARCHITECTURE.md       # High-level architecture, data models, and system flows
│   ├── DESIGN.md             # UI/UX specifications, layouts, colors, and accessibility
│   ├── MEMORY.md             # Project decisions log, design rationales, and glossary
│   ├── PRD.md                # Product requirements, user stories, and MoSCoW scoping
│   ├── README.md             # Documentation directory index
│   ├── RULES.md              # Engineering standards, coding conventions, and rules
│   └── TASK.md               # Phase-by-phase implementation roadmap and checklist
├── src/
│   ├── app/                  # Application controller, animator, and benchmarking
│   ├── core/                 # Core domain logic
│   │   ├── cell.js           # Cell representation and bitmask walls
│   │   ├── grid.js           # 2D Grid topology and neighborhood queries
│   │   ├── generators/       # Maze generation algorithms (DFS, Prim's, Kruskal's)
│   │   ├── solvers/          # Pathfinding solvers (BFS, DFS, A*, Dijkstra)
│   │   └── heuristics/       # Heuristic distance functions (Manhattan, Euclidean)
│   ├── structures/           # Core Data Structure implementations
│   │   ├── dsu.js            # Disjoint Set Union (Path compression + Union by rank)
│   │   ├── min_heap.js       # Binary Min-Heap / Priority Queue with custom comparator
│   │   ├── queue.js          # Amortized O(1) Queue with head pointer and compaction
│   │   ├── rng.js            # Mulberry32 32-bit Seeded Random Number Generator
│   │   ├── stack.js          # Stack implementation (LIFO)
│   │   └── index.js          # Public structures barrel export
│   └── ui/                   # HTML5 Canvas renderer, controls, and stats dashboard
├── tests/                    # Headless automated test suite
│   ├── core/                 # Tests for Grid, Generators, and Solvers
│   ├── structures/           # Unit tests for core data structures
│   └── smoke.test.js         # Environment and test runner smoke test
├── package.json              # Project metadata, ES module config, and scripts
└── README.md                 # Project README
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
```

---

<<<<<<< HEAD
## 📄 License

MIT License. Designed for computer science education, algorithm analysis, and software engineering portfolios.
=======
## Getting Started

### Prerequisites
- **Node.js**: v18+ (Node.js 20+ or 24 recommended, which includes native `node:test` support).
- **Web Browser**: Any modern browser supporting ES Modules and HTML5 Canvas.

### Running the Test Suite
The project uses the built-in Node.js native test runner (`node --test`), requiring zero external dependencies:

```bash
npm test
```

### Running the Web Application
Because the application is built using standard ES Modules and Vanilla CSS:
1. Start any local static file server from the root directory:
   ```bash
   # Using Python 3
   python -m http.server 3000

   # Or using npx serve
   npx serve .
   ```
2. Open `http://localhost:3000` in your web browser.

---

## 🗺 Project Roadmap & Status

| Phase | Milestone | Focus Area | Status |
|:---:|:---|:---|:---:|
| **Phase 0** | **Setup** | Architecture design, test runner configuration, repository setup | ✅ Complete |
| **Phase 1** | **Data Structures** | Stack, Queue, MinHeap, DSU, SeededRNG + Comprehensive Unit Tests | ✅ Complete |
| **Phase 2** | **Core Grid** | Bitmask Cell, Grid connectivity, Step event recording | 🔄 Next Up |
| **Phase 3** | **Generators (MVP)** | Recursive Backtracker, Prim's, and Kruskal's maze generation | ⏳ Planned |
| **Phase 4** | **Solvers (MVP)** | BFS, DFS, and A* Search pathfinding | ⏳ Planned |
| **Phase 5** | **Visualization (MVP)**| Canvas Renderer, Step-by-step Animator, Controls Panel, Stats | ⏳ Planned |
| **Phase 6** | **Advanced Features** | Dijkstra, Compare All dashboard, Maze editor, JSON save/load | ⏳ Planned |
| **Phase 7** | **Stretch Goals** | Recursive Division, Wilson's, Race mode, Maze analytics | ⏳ Planned |
| **Phase 8** | **Polish & Review** | 100x100 benchmark verification, final documentation, demo | ⏳ Planned |

---

## Development Rules & Conventions

- **Headless First**: Every algorithm and data structure must run and pass tests in headless Node.js without any DOM or Canvas mocks.
- **Iterative Implementations**: Prefer iterative implementations over deep recursion for graph traversals to avoid stack overflow on large grids (e.g. 100x100 = 10,000 cells).
- **Reproducible Seeds**: Randomness must always flow through an injected `SeededRNG` instance, never `Math.random()`.
- **Pure ES Modules**: Always use explicit `.js` extensions in imports.
- **Verification Before Claims**: Tests must always be run and verified before claiming task completion.

---

## Documentation Index

For in-depth specifications and design records, refer to the documents in [`docs/`](file:///docs):
- [`PRD.md`](file:///docs/PRD.md) - Product requirements, MoSCoW prioritization, and user stories.
- [`ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md) - Layer definitions, interfaces, data models, and persistence formats.
- [`DESIGN.md`](file:///docs/DESIGN.md) - Wireframes, interaction patterns, accessibility, and color palette.
- [`TASK.md`](file:///docs/TASK.md) - Active task tracking, phase checklists, and immediate priorities.
- [`RULES.md`](file:///docs/RULES.md) - Project standards, coding constraints, and solver invariants.
- [`MEMORY.md`](file:///docs/MEMORY.md) - Architecture decision records (ADRs), glossary, and technical log.

---

## License

This project is licensed under the [MIT License](LICENSE).
>>>>>>> d9250ebfae4ef4809ed5d6bb83f70152d6982564
