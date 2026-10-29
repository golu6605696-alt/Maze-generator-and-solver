# Maze Quest: Procedural Labyrinths & Algorithm Arena

> **An interactive procedural maze exploration game and DSA algorithm laboratory built with pure vanilla JavaScript, HTML5 Canvas, and modern Web APIs. Zero runtime dependencies, zero build steps.**

---

## Highlights & Key Features

### 1. Classic Play & Solve Maze (15×15 Grid)
- **100% Visible Classic Labyrinth:** Crisp black walls on clean white corridors modeled after classic pen-and-paper maze puzzles. Zero fog, zero darkness, zero stamina limits.
- **Entrance & Exit:** Green arrow at the top-left entrance (open wall) pointing in; Red arrow at the bottom-right exit pointing out.
- **Player Navigation:** Walk freely with **Arrow Keys**, **W / A / S / D**, or the on-screen **D-Pad**. Smooth blue trail traces your path as you explore.
- **Difficulty by Branching Confusion (All 15×15):**
  - `🟢 EASY`: Clean, straightforward path with 2 choices right at the start and 6–10 simple decision forks. Short dead ends.
  - `🟡 MEDIUM`: Higher branchiness (~18–24 decision points) with 55+ deeper dead ends and subtle alternate routes to deceive the player.
  - `🔴 HARD`: Maximum confusion! Dense branching at nearly every corridor (60+ forks), long deceptive paths that travel deep towards the exit, and 15% braiding loops!
- **Automated Algorithmic Solvers:**
  - **BFS (Breadth-First Search):** Finds the guaranteed shortest path.
  - **DFS (Depth-First Search):** Explores deeply along corridor branches.
  - **Backtracking (Wall Follower):** Explores systematically and backtracks out of dead ends.
  - Clicking **`SOLVE MAZE`** automatically reveals and traces the **bold red solution path line** from entrance to exit.
  - Clicking **`↺ RETRY`** resets your runner back to Start so you can try solving it yourself.

---

### 2. World Quest Map (15-Level Campaign)
- **5 Themed Worlds & 15 Progressive Stages:**
  - **Whispering Woods:** Gentle beginner pathways (*Sunny Glade, Breezy Hollow, Ancient Oak*).
  - **Sunken Bridges:** Winding wooden planks over clear water (*Plank Pathway, Twin Canals, Harbor Gate*).
  - **Muddy Marshes:** Sticky terrain testing stamina conservation (*Slippery Slough, Willow Bog, Hound Marsh*).
  - **Crumbling Castle:** Collapsing stone passages (*Courtyard Maze, Knight Gallery, Dungeon Vault*).
  - **Starry Labyrinth:** Twilight maze with dim lanterns and 5 robot racers (*Constellation Run, Supernova Spiral, Infinity Core*).
- **Star Rating System:** Earn 1 to 3 stars per level based on par times and stamina efficiency.
- **Client-Side Persistence:** Automatically stores unlocked levels, high scores, and best times in browser `localStorage`.

---

### 3. 3 Handcrafted Color Themes
Click **`THEME`** in the top navigation or press <kbd>T</kbd> to cycle between:
1. **Treasure Map (Parchment, Default):** Aged archival parchment (`#f6ecdc`), warm sandstone (`#211811`), and radiant amber gold accents (`#f59e0b`).
2. **Arcade Cyber Neon:** Electric neon cyan (`#00f5ff`) and arcade pink (`#ff007f`) over deep midnight purple (`#070913`).
3. **Emerald Jungle:** Rainforest moss (`#05130e`), glowing jade pathways (`#34d399`), and sunlit amber gems (`#facc15`).

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on Node v20/v22/v24)
- Any modern web browser (Chrome, Firefox, Safari, Edge)

### Running Locally
```bash
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Running Test Suite
Execute the 101 automated unit and property tests with Node's native test runner:
```bash
npm test
```

---

## ⌨ Controls & Keybindings

### Navigation
| Input | Action |
|---|---|
| <kbd>W</kbd> / <kbd>↑</kbd> | Move North |
| <kbd>D</kbd> / <kbd>→</kbd> | Move East |
| <kbd>S</kbd> / <kbd>↓</kbd> | Move South |
| <kbd>A</kbd> / <kbd>←</kbd> | Move West |
| On-Screen D-Pad | Touch controls for mobile / tablet |
| <kbd>T</kbd> | Cycle Color Theme |

---

## Project Architecture

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

## License
MIT License.
