# 🧭 Maze Quest: Procedural Labyrinths & Algorithm Arena

> **An interactive procedural maze exploration game and DSA algorithm laboratory built with pure vanilla JavaScript, HTML5 Canvas, and modern Web APIs. Zero runtime dependencies, zero build steps.**

---

## ⚡ Highlights & Key Features

### 1. 🧩 Classic Play & Solve Maze (15×15 Grid)
- **100% Visible Classic Labyrinth:** Crisp black walls on clean white corridors modeled after classic pen-and-paper maze puzzles. Zero fog, zero darkness, zero stamina limits.
- **🟢 Entrance & 🔴 Exit:** Green arrow at the top-left entrance (open wall) pointing in; Red arrow at the bottom-right exit pointing out.
- **Player Navigation:** Walk freely with **Arrow Keys**, **W / A / S / D**, or the on-screen **D-Pad**. Smooth blue trail traces your path as you explore.
- **Difficulty by Branching Confusion (All 15×15):**
  - `🟢 EASY`: Clean, straightforward path with 2 choices right at the start and 6–10 simple decision forks. Short dead ends.
  - `🟡 MEDIUM`: Higher branchiness (~18–24 decision points) with 55+ deeper dead ends and subtle alternate routes to deceive the player.
  - `🔴 HARD`: Maximum confusion! Dense branching at nearly every corridor (60+ forks), long deceptive paths that travel deep towards the exit, and 15% braiding loops!
- **Automated Algorithmic Solvers:**
  - 🌊 **BFS (Breadth-First Search):** Finds the guaranteed shortest path.
  - 🦔 **DFS (Depth-First Search):** Explores deeply along corridor branches.
  - 🖐️ **Backtracking (Wall Follower):** Explores systematically and backtracks out of dead ends.
  - Clicking **`💡 SOLVE MAZE`** automatically reveals and traces the **bold red solution path line** from entrance to exit.
  - Clicking **`↺ RETRY`** resets your runner back to Start so you can try solving it yourself.

---

### 2. 🗺️ World Quest Map (15-Level Campaign)
- **5 Themed Worlds & 15 Progressive Stages:**
  - 🌲 **Whispering Woods:** Gentle beginner pathways (*Sunny Glade, Breezy Hollow, Ancient Oak*).
  - 🌊 **Sunken Bridges:** Winding wooden planks over clear water (*Plank Pathway, Twin Canals, Harbor Gate*).
  - 🌾 **Muddy Marshes:** Sticky terrain testing stamina conservation (*Slippery Slough, Willow Bog, Hound Marsh*).
  - 🏰 **Crumbling Castle:** Collapsing stone passages (*Courtyard Maze, Knight Gallery, Dungeon Vault*).
  - 🌌 **Starry Labyrinth:** Twilight maze with dim lanterns and 5 robot racers (*Constellation Run, Supernova Spiral, Infinity Core*).
- **⭐ Star Rating System:** Earn 1 to 3 stars per level based on par times and stamina efficiency.
- **Client-Side Persistence:** Automatically stores unlocked levels, high scores, and best times in browser `localStorage`.

---

### 3. ⚔️ 2-Player Local Race Duel (Same-Keyboard Multiplayer)
- **Head-to-Head Competitive Racing:** Two players explore the same labyrinth simultaneously on one computer keyboard:
  - **Player 1 (Blue Scout):** Controlled with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>.
  - **Player 2 (Red Scout):** Controlled with Arrow Keys (<kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd>).
- **Live Match Telemetry:** Centisecond race stopwatch, individual step counts, and relic tallies.
- **Victory Overlay:** First explorer to touch the golden exit wins with instant rematch and new battle maze generation.

---

### 4. 🧪 Cartographer Lab & Algorithm Studio
- **5 Spanning Tree Generators:**
  - **Recursive Backtracker (`bkt`):** Iterative DFS with explicit stack.
  - **Randomized Prim's (`prm`):** Frontier-set generation.
  - **Randomized Kruskal's (`krk`):** Edge shuffling with Disjoint-Set Union (DSU).
  - **Wilson's Algorithm (`wil`):** Loop-erased random walks producing unbiased Uniform Spanning Trees.
  - **Recursive Division (`div`):** Chamber partitioning with random aperture carving.
- **5 Pathfinding Solvers:**
  - **Depth-First Search (`dfs`):** Winding, memory-efficient exploration.
  - **Breadth-First Search (`bfs`):** Fewest hops guarantee on unweighted edges.
  - **Dijkstra's Algorithm (`dij`):** MinHeap-driven cost-optimal pathfinding.
  - **A\* Search (`ast`):** Admissible Manhattan heuristic for directed exploration.
  - **Wall Follower (`wfl`):** Loop-guarded right-hand rule traversal.
- **Interactive Map Editing:** Direct canvas wall carving, building, and terrain brushing (Plain, Bridge, Mud, Ruins).
- **Cartouche & Map Export:** Export high-resolution PNG maps with decorative border, scale bar, legend, and cryptographic fingerprint.
- **Lockstep Multi-Solver Race:** Benchmark multiple solvers simultaneously on identical maze topology.

---

### 5. ⚡ Performance Benchmark Suite
- Automated statistical testing measuring:
  - **Median Execution Speed** and **IQR Variance** across 20x20, 40x40, and 60x60 mazes.
  - **Expanded Cell Count**, **Path Hops**, and **Total Energy Cost**.
- One-click export to **CSV** and **JSON** formats.

---

### 6. 🎨 4 Handcrafted Color Themes (Anti-AI Aesthetics)
Click **`THEME`** in the top navigation or press <kbd>T</kbd> to cycle between:
1. **Golden Terminal (Default):** Warm amber CRT phosphor glow (`#f59e0b`), deep slate obsidian background (`#070a0f`), and bronze accents.
2. **Treasure Map (Parchment):** Aged archival parchment (`#f4ecd8`), antique iron-gall ink (`#291a10`), and deep sepia accents.
3. **Arcade Cyber Neon:** Electric neon cyan (`#00f5ff`) and arcade pink (`#ff007f`) over deep midnight purple (`#0a0818`).
4. **Emerald Jungle:** Rainforest moss (`#05130e`), glowing jade pathways (`#34d399`), and sunlit amber gems (`#facc15`).

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on Node v20/v22/v24)
- Any modern web browser (Chrome, Firefox, Safari, Edge)

### Running Locally
```bash
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Running Test Suite
Execute the 91 automated unit and property tests with Node's native test runner:
```bash
npm test
```

---

## ⌨️ Controls & Keybindings

### Navigation (Solo Expedition)
| Input | Action |
|---|---|
| <kbd>W</kbd> / <kbd>↑</kbd> | Move North |
| <kbd>D</kbd> / <kbd>→</kbd> | Move East |
| <kbd>S</kbd> / <kbd>↓</kbd> | Move South |
| <kbd>A</kbd> / <kbd>←</kbd> | Move West |
| On-Screen D-Pad | Touch controls for mobile / tablet |
| <kbd>T</kbd> | Cycle Color Theme |

### 2-Player Race Duel
| Player | Controls |
|---|---|
| **Player 1 (Blue Scout)** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> |
| **Player 2 (Red Scout)** | <kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd> (Arrow Keys) |

### Playback & Studio (Lab Mode)
| Input | Action |
|---|---|
| <kbd>Space</kbd> | Start / Pause playback |
| <kbd>→</kbd> / <kbd>Period</kbd> | Advance 1 step |
| <kbd>←</kbd> / <kbd>Comma</kbd> | Step backward |
| <kbd>Esc</kbd> | Cancel / Reset playback |
| Detent Dial | Adjust speed: `1x`, `2x`, `5x`, `10x`, `30x`, `100x`, `MAX` |

---

## 🏗️ Project Architecture

```
Maze/
├── src/
│   ├── structures/           # Core Data Structures
│   │   ├── rng.js            # xmur3 + sfc32 deterministic PRNG with stream forking
│   │   ├── stack.js          # Explicit LIFO Stack (zero call-stack limits)
│   │   ├── queue.js          # Ring-buffer FIFO Queue (O(1) amortized ops)
│   │   ├── minheap.js        # Binary MinHeap with (priority, seq, value) tie-breaking
│   │   ├── dsu.js            # Disjoint-Set Union with path compression & union by rank
│   │   └── bitset.js         # Compact bitset on Uint32Array
│   ├── core/                 # Pure Graph Engine
│   │   ├── constants.js      # Walls, Terrain, Difficulties, Relics, Phantoms, Fog
│   │   ├── grid.js           # Uint8Array-backed Grid with symmetric wall bits
│   │   ├── code.js           # Expedition Code parser & formatter (v1/...)
│   │   ├── braid.js          # Dead-end braiding algorithm
│   │   ├── terrain.js        # Noise terrain & elevation assignment
│   │   ├── relics.js         # Dead-end relic placement off reference path
│   │   ├── fog.js            # Supercover line-of-sight ray-walk
│   │   ├── scoring.js        # Scoring formula & grade determination
│   │   ├── phantoms.js       # Headless finishes & timelines for phantoms
│   │   ├── analyzer.js       # Topological metrics & tree analysis
│   │   ├── pipeline.js       # Canonical buildMaze pipeline
│   │   ├── generators/       # Backtracker, Prim, Kruskal, Wilson, Division
│   │   └── solvers/          # DFS, BFS, Dijkstra, A*, WallFollower
│   ├── app/                  # Application State & Orchestration
│   │   ├── app_machine.js    # Finite state machine (Landing, Campaign, Duel, Solo, Lab, Bench)
│   │   ├── campaign_store.js # 5-world 15-level quest store with star ratings & localStorage
│   │   ├── duel_controller.js# Real-time 2-player local keyboard race engine
│   │   ├── expedition_controller.js # Game engine: stamina, fog, movement, relics
│   │   ├── lab_controller.js # Studio controller: lockstep racing, live editing
│   │   ├── playback_ticker.js# Frame-budgeted animation ticker with speed detents
│   │   ├── event_log.js      # Bidirectional event scrubbing ledger
│   │   ├── run_verifier.js   # Anti-cheat move verification via replay
│   │   ├── maze_io.js        # Schema v2 JSON import/export
│   │   └── benchmark_runner.js # Statistical benchmarking (median, IQR)
│   ├── ui/                   # Rendering & Web Presentation
│   │   ├── theme.js          # 4 Handcrafted Themes (Terminal, Parchment, Cyber, Jungle)
│   │   ├── audio.js          # Web Audio API sound synthesizer
│   │   ├── components/       # Custom web components (<mech-toggle>, <detent-dial>, etc.)
│   │   └── renderer/         # Canvas renderer: L0-L3 layers, patterns, duel racers, cartouche
│   └── main.js               # Application bootstrap & multi-event loader
├── tests/                    # 91 automated tests run via `node --test`
├── docs/                     # Specifications, Rules, and Architecture docs
├── index.html                # Responsive web interface
├── index.css                 # Zero-dependency bespoke styling
└── server.js                 # Zero-dependency static server with cache-busting
```

---

## 📜 License
MIT License.
