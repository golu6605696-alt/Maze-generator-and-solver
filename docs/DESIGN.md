# DESIGN: Maze Generator & Solver (UI/UX)

## 1. Design Goals
- Make the algorithms the star: clear, readable animation.
- Minimal controls, instantly understandable.
- Works on a laptop screen; reasonable on tablets.

## 2. Layout
```
+-----------------------------------------------------------+
|  Maze Generator & Solver                      [theme]     |
+-------------------+---------------------------------------+
|  CONTROLS         |                                       |
|  Size: [ 25 ]     |                                       |
|  Seed: [ random ] |            MAZE CANVAS                |
|  Generator: [v]   |                                       |
|  [ Generate ]     |                                       |
|  ---------------  |                                       |
|  Solver: [v]      |                                       |
|  [ Solve ]        |                                       |
|  Speed: --o-----  +---------------------------------------+
|  [Pause][Step]    |  STATS                                |
|  [Reset]          |  Algo | Visited | Path | Cost | Time   |
|  Mode: View/Edit  |  BFS  |   ...                         |
|  [Save] [Load]    |  A*   |   ...         [Compare All]   |
+-------------------+---------------------------------------+
```

## 3. Color Palette
| Element | Color | Hex |
|---|---|---|
| Background | Near-white / dark slate (dark theme) | #FAFAFA / #1E1E2E |
| Walls | Dark gray | #2B2B2B |
| Unvisited cell | Light | #FFFFFF |
| Generation carve | Soft blue | #8EC5FF |
| Frontier cell | Amber | #FFC857 |
| Visited by solver | Light teal | #9BE3D0 |
| Current cell | Orange | #FF8A3D |
| Final path | Strong green | #2EB85C |
| Start | Blue | #1E6FFF |
| End | Red | #E5484D |
| Weighted terrain | Brown/blue gradient by weight | n/a |

Do not rely on color alone: start/end also get letter markers (S / E).

## 4. Interaction Design
- **Generate:** animates carving; controls are disabled except Pause/Speed.
- **Solve:** animates exploration (visited fills in), then draws the final path.
- **Speed slider:** 1 step/sec up to instant.
- **Step button:** advances one step when paused.
- **Edit mode:** click a wall to toggle; drag S or E markers to move; right-click or modifier to set cell weight.
- **Compare All:** runs every solver on a copy of the current maze and fills the stats table; rows are sortable.

## 5. States
| State | UI behavior |
|---|---|
| Idle | All controls enabled |
| Generating | Generate/Solve disabled; Pause/Speed enabled |
| Solving | Same as above |
| Paused | Step and Resume enabled |
| No path | Message "No path found" and visited cells remain shown |
| Error | Inline message near the offending input |

## 6. Rendering Notes
- Draw on a single canvas; cell size = min(canvasWidth / cols, canvasHeight / rows).
- Walls drawn as lines; thickness scales down for large grids.
- For grids above ~60x60, process multiple steps per frame to keep the animation smooth.
- Redraw only changed cells where possible.

## 7. Accessibility
- Keyboard: Space = pause/resume, Right arrow = step, R = reset.
- Sufficient contrast in both themes.
- Labels on all inputs; stats table readable by screen readers.

## 8. Optional Polish
- Dark/light theme toggle.
- Legend explaining colors.
- Race mode with 2 to 4 mini canvases.
- Export maze as PNG.
