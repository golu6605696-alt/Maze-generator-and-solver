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

```
+-------------------------------------------------------------+
|                          UI Layer                           |
|       Controls Panel  |  Canvas Renderer  |  Stats Panel     |
+------------------------------+------------------------------+
                               |
+------------------------------v------------------------------+
|                      Application Layer                      |
|    Controller  |  Animator (Step Player)  |  BenchmarkRunner  |
+------------------------------+------------------------------+
                               |
+------------------------------v------------------------------+
|                         Core Layer                          |
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
```

---

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
