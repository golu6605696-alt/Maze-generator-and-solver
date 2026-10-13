# Demo Script & Presentation Notes

**Project:** Maze Generator & Solver  
**Target Audience:** DSA Students, Evaluators, Technical Interviewers, and Instructors  
**Prerequisites:** Node.js (v18+) installed. Dev server running via `npm start` at `http://localhost:3000`.

---

## 1. Presentation Overview & Agendas

### A. 5-Minute Lightning Demo
1. **0:00 - 1:00:** Problem statement & architecture (Headless DSA algorithms + Event playback).
2. **1:00 - 2:30:** Live maze generation (Backtracker vs Prim's) and pathfinding solve (A*).
3. **2:30 - 3:30:** Race Mode (BFS vs A* head-to-head duel).
4. **3:30 - 5:00:** 100x100 performance stats (< 10ms execution) & Q&A.

### B. 10-Minute Comprehensive Demo
1. **0:00 - 2:00:** Motivation, spanning tree principles, bitmask cell representation.
2. **2:00 - 4:30:** Comparing generation paradigms (DFS Backtracker, Prim's frontier, Kruskal's DSU, Wilson's UST).
3. **4:30 - 6:30:** Comparing pathfinding strategies (Unweighted BFS vs Heuristic A* vs Weighted Dijkstra vs Dead-End Filling).
4. **6:30 - 8:00:** Interactive features: Manual Editor, Braid Mode (cyclic loops), Topological Analytics.
5. **8:00 - 10:00:** Benchmark comparison table & 100x100 scalability results.

### C. 15-Minute Technical Defense
Includes the 10-minute agenda plus code deep dives into:
- Iterative DSU with path compression & union by rank.
- Amortized O(1) Queue compaction (eliminating `Array.shift()` degradation).
- Admissible Manhattan distance heuristic and optimality proofs.
- Headless event architecture and DPR Canvas scaling.

---

## 2. Step-by-Step Live Walkthrough Script

### Act 1: The Spanning Tree Fundamentals
- **Action:** Open `http://localhost:3000`. Keep the default 25x25 size. Select **Recursive Backtracker (DFS)**. Click **⚡ Generate Maze**.
- **Talking Point:**
  > *"Every perfect maze is mathematically a Spanning Tree: for a grid of V cells, exactly V - 1 passages are carved with zero cycles. Notice how Recursive Backtracker generates deep, winding passages with long corridors and few dead ends because it pursues single paths deeply before backtracking via an explicit Stack."*

- **Action:** Switch generator to **Randomized Prim's**. Click **⚡ Generate Maze**.
- **Talking Point:**
  > *"Contrast this with Prim's algorithm. Prim's expands outward from a frontier, producing a more radial, bushy maze with many short dead ends and high branching factor."*

- **Action:** Switch generator to **Randomized Kruskal's (DSU)**. Click **⚡ Generate Maze**.
- **Talking Point:**
  > *"Kruskal's views the grid as an edge list. Using our custom Disjoint Set Union data structure with path compression and union by rank, it joins isolated trees until a single connected component remains, running in near-linear O(E α(V)) time."*

---

### Act 2: Pathfinding and Heuristic Pruning
- **Action:** Keep the generated maze. Select **Breadth-First Search (BFS)**. Click **🚀 Solve Maze**.
- **Talking Point:**
  > *"BFS guarantees the shortest path on unweighted graphs by exploring all equidistant frontiers level-by-level using our custom FIFO Queue with offset compaction."*
- **Observation:** Note the number of visited cells in the footer (e.g., ~400 visited cells).

- **Action:** Click **↺ Reset**, select **A* Search (Manhattan - Optimal)**, and click **🚀 Solve Maze**.
- **Talking Point:**
  > *"A* uses a priority queue (MinHeap) ordered by f(n) = g(n) + h(n), where h(n) is the admissible Manhattan distance to the target. Because h(n) never overestimates the true distance, A* finds the exact same optimal path length as BFS, but expands significantly fewer cells because it focuses exploration towards the destination."*

---

### Act 3: Head-to-Head Duel (Race Mode)
- **Action:** Click the **🏁 Race Mode** button at the top right of the canvas.
- **Action:** Set **Racer A** to `BFS (Breadth-First)` and **Racer B** to `A* (Manhattan)`.
- **Action:** Click **⚡ Duel!**.
- **Talking Point:**
  > *"Race Mode clones the identical grid and executes both solvers concurrently in isolated headless environments. A* is declared the victor because its heuristic pruning visited substantially fewer cells to achieve the exact same optimal path."*
- **Action:** Close the Race modal.

---

### Act 4: Special DSA Features (Braid, Editor, Analytics)
- **Action:** Click **🔀 Apply Braid Mode (Loops)**.
- **Talking Point:**
  > *"A pure perfect maze has no loops. Braid Mode scans all dead ends (cells with degree 1) and removes walls with a 50% probability, transforming the tree into a cyclic graph. Now multiple alternative routes exist."*

- **Action:** Click **📈 Analytics**.
- **Talking Point:**
  > *"The Analytics engine computes topological invariants: dead end percentage, junction density, corridor length, and computes the tree diameter using a two-pass BFS algorithm to find the longest simple path in the entire labyrinth."*

---

### Act 5: Scalability & Performance on 100x100 Grids
- **Action:** Open terminal and run `npm run bench`.
- **Talking Point:**
  > *"Our PRD required generating and solving a 100x100 grid (10,000 cells and nearly 20,000 wall edges) in under 1 second. As you can see from our benchmark suite, all 5 generators and all 6 solvers finish in 3 to 30 milliseconds—over 30 times faster than the required budget."*

---

## 3. Evaluator Q&A Defense Guide

### Q1: Why not use recursion for Recursive Backtracker?
> **Answer:** In JavaScript, the call stack limit is approximately 10,000 frames. On a 100x100 maze with 10,000 cells, a recursive backtracker can easily trigger `RangeError: Maximum call stack size exceeded`. We built an explicit, heap-allocated `Stack` class that handles arbitrary grid sizes without call stack limitations.

### Q2: How does your Cell representation save memory?
> **Answer:** Each Cell stores its four walls as a 4-bit bitmask (`N=1, E=2, S=4, W=8`). Wall checks and removals are single bitwise operations (`walls & ~mask`), keeping cell memory minimal and wall mutations O(1).

### Q3: Why does `Array.shift()` hurt BFS performance, and how did you solve it?
> **Answer:** Standard JavaScript `Array.shift()` is an O(N) operation because all remaining elements must be reindexed in memory. For a 100x100 grid, BFS enqueues thousands of cells, turning BFS into an O(V²) operation. Our `Queue` uses a head pointer offset that achieves O(1) amortized dequeue, automatically compacting the array only when deleted elements exceed a defined threshold.

### Q4: Why does Kruskal's need Disjoint Set Union?
> **Answer:** Kruskal's must avoid adding edges that create cycles. Testing connectivity via BFS would take O(V) per edge. DSU with path compression and union by rank determines whether two cells are already in the same connected component in amortized O(α(V)) time, where α is the inverse Ackermann function (effectively constant, ≤ 4 for any practical universe size).

### Q5: How do you guarantee deterministic seed reproducibility?
> **Answer:** We implemented Mulberry32, a 32-bit state pseudo-random number generator, initialized with 32-bit FNV-1a hash of any input string or number. It produces identical pseudo-random streams across all platforms and runs without touching `Math.random()`.
