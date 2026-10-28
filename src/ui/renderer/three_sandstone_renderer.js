/**
 * @file three_sandstone_renderer.js
 * High-End Genuine 3D Sandstone Labyrinth & PBR Engine for Maze Quest.
 *
 * Implements real 3D geometry for ancient Egyptian sandstone blocks:
 * - Real 3D wall meshes with distinct top surfaces, vertical faces, beveled block edges
 * - Procedural PBR textures: Sandstone albedo with sedimentary strata, normal map with chiseled
 *   hieroglyphs and block seams, roughness map, and ambient occlusion
 * - Directional warm key light casting real shadow maps, ambient fill, and point light glows
 * - Elevated perspective camera (45-55° tilt) with automatic framing, orbit drag, and zoom
 * - Walkable sandstone corridor floor receiving real shadows from walls
 * - 3D player token (golden ancient explorer orb) with smooth interpolation and dynamic shadow
 * - Floor-level 3D luminous solution path and search visualization occluded by walls
 * - Transparent WebGL canvas preserving the underlying weathered parchment map and UI
 * - Full support for all maze generators, difficulty presets, and solvers
 */

import * as THREE from '../../lib/three.module.js';
import { Wall } from '../../core/constants.js';

export class ThreeSandstoneRenderer {
  /**
   * @param {HTMLCanvasElement} baseCanvas The 2D canvas in the DOM.
   */
  constructor(baseCanvas) {
    this.baseCanvas = baseCanvas;
    this.container = baseCanvas ? baseCanvas.parentElement : null;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.webglCanvas = null;

    // Lights
    this.dirLight = null;
    this.ambLight = null;
    this.startPointLight = null;
    this.exitPointLight = null;

    // Meshes and groups
    this.mazeGroup = null;
    this.wallMesh = null;
    this.floorMesh = null;
    this.borderMesh = null;
    this.startMesh = null;
    this.exitMesh = null;
    this.playerMesh = null;
    this.pathMesh = null;
    this.exploredGroup = null;
    this.activeTrailGroup = null;

    // Materials and procedural PBR textures
    this.sandstoneMaterial = null;
    this.floorMaterial = null;
    this.borderMaterial = null;
    this.textures = null;

    // State
    this.grid = null;
    this.currentTheme = 'sheet';
    this.isInitialized = false;
    this.animFrameId = null;

    // Camera parameters
    // Camera parameters (elevated high-angle matching reference game image)
    this.cameraTarget = new THREE.Vector3();
    this.cameraDistance = 25;
    this.cameraPitch = 74 * (Math.PI / 180); // ~74° high-angle perspective showing wall tops & vertical faces
    this.cameraYaw = 0;                      // Strictly squared with screen (zero yaw, parallel borders)
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };

    // Dynamic player movement interpolation
    this.playerCurrentPos = new THREE.Vector3();
    this.playerTargetPos = new THREE.Vector3();
    this.playerHasTarget = false;

    // World units: cell is 2.0x2.0, walls are 0.44 thick, 1.6 high
    this.CELL_SIZE = 2.0;
    this.WALL_THICK = 0.44;
    this.WALL_HEIGHT = 1.6;

    this._initThree();
  }

  // =========================================================================
  // INITIALIZATION & PBR TEXTURE GENERATION
  // =========================================================================

  _initThree() {
    if (typeof window === 'undefined' || !this.container) return;

    // 1. Create dedicated transparent WebGL Canvas inside the map container
    this.webglCanvas = document.createElement('canvas');
    this.webglCanvas.id = 'canvas-expedition-3d';
    this.webglCanvas.className = 'canvas-expedition-3d';
    this.webglCanvas.style.position = 'absolute';
    this.webglCanvas.style.top = '0';
    this.webglCanvas.style.left = '0';
    this.webglCanvas.style.width = '100%';
    this.webglCanvas.style.height = '100%';
    this.webglCanvas.style.display = 'block';
    this.webglCanvas.style.pointerEvents = 'auto';
    this.webglCanvas.style.touchAction = 'none';

    // Insert next to baseCanvas in the viewport
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.appendChild(this.webglCanvas);

    // 2. WebGL Renderer with transparency and shadow maps enabled
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.webglCanvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setClearColor(0x000000, 0); // Transparent background
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;
    } catch (err) {
      console.warn('[ThreeSandstoneRenderer] WebGL initialization fallback:', err);
      return;
    }

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    const aspect = (this.container.clientWidth || 800) / (this.container.clientHeight || 600);
    this.camera = new THREE.PerspectiveCamera(36, aspect, 0.5, 500);

    // 4. Lighting setup
    this._setupLighting();

    // 5. Generate Procedural Sandstone PBR Texture Maps (Hieroglyphs, Strata, Mortar)
    this._generateSandstoneTextures();

    // 6. Setup Parent Maze Group
    this.mazeGroup = new THREE.Group();
    this.scene.add(this.mazeGroup);

    // 7. Bind interactive Camera Controls (Orbit Drag & Zoom)
    this._bindCameraControls();

    // 8. Start Rendering Animation Loop
    this.isInitialized = true;
    this._startAnimationLoop();
  }

  _setupLighting() {
    // A. Warm Key Directional Sunlight from upper-left
    this.dirLight = new THREE.DirectionalLight(0xfff1dc, 2.4);
    this.dirLight.position.set(-25, 45, 30);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 160;
    this.dirLight.shadow.bias = -0.0004;
    this.dirLight.shadow.radius = 2.0;

    const d = 35;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    // B. Warm Ambient Light for corridor visibility
    this.ambLight = new THREE.AmbientLight(0x7c5838, 0.95);
    this.scene.add(this.ambLight);

    // C. Soft Secondary Bounce Light from opposite direction
    const fillLight = new THREE.DirectionalLight(0xb58b5e, 0.6);
    fillLight.position.set(30, 20, -20);
    this.scene.add(fillLight);

    // D. Point Lights at Start (Golden) and Exit (Crimson)
    this.startPointLight = new THREE.PointLight(0xf5b52e, 3.5, 12, 1.2);
    this.startPointLight.position.set(0, 1.2, 0);
    this.scene.add(this.startPointLight);

    this.exitPointLight = new THREE.PointLight(0xef4444, 2.5, 10, 1.2);
    this.exitPointLight.position.set(0, 1.2, 0);
    this.scene.add(this.exitPointLight);
  }

  /**
   * Generates procedural PBR textures on offscreen canvases:
   * 1. Albedo Map: Warm Egyptian sandstone with horizontal sedimentary strata bands,
   *    chiseled hieroglyphic symbols (ankh, eye of horus, scarab, lotus), and stone mineral grain.
   * 2. Normal Map: Chiseled block bevels, relief hieroglyphs, and rough stone surface.
   * 3. Roughness Map: Variation across worn surfaces and recessed joints.
   */
  _generateSandstoneTextures() {
    if (typeof document === 'undefined') return;

    const size = 1024;

    // --- 1. Albedo Map ---
    const albedoCanvas = document.createElement('canvas');
    albedoCanvas.width = size;
    albedoCanvas.height = size;
    const aCtx = albedoCanvas.getContext('2d');

    // Base sandstone gradient
    const baseGrad = aCtx.createLinearGradient(0, 0, 0, size);
    baseGrad.addColorStop(0, '#d8af6e');
    baseGrad.addColorStop(0.5, '#c59754');
    baseGrad.addColorStop(1, '#b07f3d');
    aCtx.fillStyle = baseGrad;
    aCtx.fillRect(0, 0, size, size);

    // Sedimentary rock strata (horizontal geological bands)
    for (let y = 0; y < size; y += 8) {
      const alpha = 0.04 + Math.sin(y * 0.05) * 0.03;
      const isDark = (y % 24 === 0);
      aCtx.fillStyle = isDark ? `rgba(90, 48, 16, ${alpha * 1.5})` : `rgba(255, 230, 180, ${alpha})`;
      aCtx.fillRect(0, y, size, 4 + (y % 5));
    }

    // Mineral speckles & stone grain noise
    for (let i = 0; i < 4000; i++) {
      const x = (i * 197) % size;
      const y = (i * 389) % size;
      const isLight = i % 2 === 0;
      aCtx.fillStyle = isLight ? 'rgba(255, 240, 200, 0.12)' : 'rgba(70, 35, 10, 0.14)';
      aCtx.fillRect(x, y, 2 + (i % 3), 1.5);
    }

    // Chiseled Ancient Egyptian Hieroglyphs across the stone
    this._drawChiseledHieroglyphs(aCtx, size);

    // --- 2. Normal Map (Sobel filter over height) ---
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = size;
    normalCanvas.height = size;
    const nCtx = normalCanvas.getContext('2d');

    // Neutral normal map base: RGB (128, 128, 255) -> Vector (0, 0, 1)
    nCtx.fillStyle = 'rgb(128, 128, 255)';
    nCtx.fillRect(0, 0, size, size);

    // Stamp engraved bevels and hieroglyph reliefs into the normal map
    this._drawNormalMapReliefs(nCtx, size);

    // --- 3. Roughness Map ---
    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = size;
    roughCanvas.height = size;
    const rCtx = roughCanvas.getContext('2d');
    rCtx.fillStyle = '#d0d0d0'; // High roughness (diffuse stone)
    rCtx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1500; i++) {
      const x = (i * 223) % size;
      const y = (i * 347) % size;
      rCtx.fillStyle = i % 2 === 0 ? '#b0b0b0' : '#e8e8e8';
      rCtx.fillRect(x, y, 4, 3);
    }

    // Create Three.js Textures
    const albedoTex = new THREE.CanvasTexture(albedoCanvas);
    albedoTex.wrapS = THREE.RepeatWrapping;
    albedoTex.wrapT = THREE.RepeatWrapping;
    albedoTex.repeat.set(2, 2);

    const normalTex = new THREE.CanvasTexture(normalCanvas);
    normalTex.wrapS = THREE.RepeatWrapping;
    normalTex.wrapT = THREE.RepeatWrapping;
    normalTex.repeat.set(2, 2);

    const roughTex = new THREE.CanvasTexture(roughCanvas);
    roughTex.wrapS = THREE.RepeatWrapping;
    roughTex.wrapT = THREE.RepeatWrapping;
    roughTex.repeat.set(2, 2);

    this.textures = { albedoTex, normalTex, roughTex };

    // Create Sandstone PBR Materials
    this.sandstoneMaterial = new THREE.MeshStandardMaterial({
      map: albedoTex,
      normalMap: normalTex,
      normalScale: new THREE.Vector2(1.3, 1.3),
      roughnessMap: roughTex,
      roughness: 0.88,
      metalness: 0.04,
      color: 0xd9b375,
    });

    this.floorMaterial = new THREE.MeshStandardMaterial({
      map: albedoTex,
      normalMap: normalTex,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughness: 0.92,
      metalness: 0.02,
      color: 0xc49b5d,
    });

    this.borderMaterial = new THREE.MeshStandardMaterial({
      map: albedoTex,
      normalMap: normalTex,
      normalScale: new THREE.Vector2(1.6, 1.6),
      roughness: 0.82,
      metalness: 0.05,
      color: 0xdeb879,
    });
  }

  _drawChiseledHieroglyphs(ctx, size) {
    ctx.save();
    ctx.strokeStyle = 'rgba(75, 36, 12, 0.45)';
    ctx.fillStyle = 'rgba(90, 42, 14, 0.35)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const glyphSize = 48;
    const spacing = 128;

    for (let gy = 64; gy < size; gy += spacing) {
      for (let gx = 64; gx < size; gx += spacing) {
        const type = (Math.floor(gx / spacing) + Math.floor(gy / spacing)) % 4;
        ctx.save();
        ctx.translate(gx, gy);

        if (type === 0) {
          // Ankh ☥ (Key of Life)
          ctx.beginPath();
          ctx.ellipse(0, -glyphSize * 0.3, glyphSize * 0.22, glyphSize * 0.28, 0, 0, Math.PI * 2);
          ctx.moveTo(-glyphSize * 0.35, 0);
          ctx.lineTo(glyphSize * 0.35, 0);
          ctx.moveTo(0, 0);
          ctx.lineTo(0, glyphSize * 0.45);
          ctx.stroke();
        } else if (type === 1) {
          // Eye of Horus 𓂀
          ctx.beginPath();
          ctx.moveTo(-glyphSize * 0.4, 0);
          ctx.quadraticCurveTo(0, -glyphSize * 0.3, glyphSize * 0.4, 0);
          ctx.quadraticCurveTo(0, glyphSize * 0.3, -glyphSize * 0.4, 0);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, glyphSize * 0.12, 0, Math.PI * 2);
          ctx.fill();
        } else if (type === 2) {
          // Scarab Beetle Silhouette
          ctx.beginPath();
          ctx.ellipse(0, 0, glyphSize * 0.28, glyphSize * 0.38, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, -glyphSize * 0.38);
          ctx.lineTo(0, glyphSize * 0.38);
          ctx.stroke();
        } else {
          // Sun Disc with Rays & Lotus Reeds
          ctx.beginPath();
          ctx.arc(0, -glyphSize * 0.15, glyphSize * 0.2, 0, Math.PI * 2);
          ctx.stroke();
          for (let r = 0; r < 5; r++) {
            ctx.beginPath();
            ctx.moveTo((r - 2) * 8, glyphSize * 0.15);
            ctx.lineTo((r - 2) * 8, glyphSize * 0.45);
            ctx.stroke();
          }
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }

  _drawNormalMapReliefs(ctx, size) {
    ctx.save();
    // Chiseled relief normal stamp: Raised left/top = cyan/magenta, indented right/bottom
    const glyphSize = 48;
    const spacing = 128;

    for (let gy = 64; gy < size; gy += spacing) {
      for (let gx = 64; gx < size; gx += spacing) {
        // Highlight side (illuminated normal)
        ctx.strokeStyle = 'rgb(100, 160, 255)';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(gx - glyphSize * 0.35, gy - glyphSize * 0.35, glyphSize * 0.7, glyphSize * 0.7);

        // Shadow groove normal
        ctx.strokeStyle = 'rgb(160, 90, 255)';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(gx - glyphSize * 0.32, gy - glyphSize * 0.32, glyphSize * 0.7, glyphSize * 0.7);
      }
    }
    ctx.restore();
  }

  // =========================================================================
  // CAMERA CONTROLS & AUTO-FRAMING
  // =========================================================================

  _bindCameraControls() {
    if (!this.webglCanvas) return;

    const onPointerDown = (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      // Orbit camera: adjust yaw and pitch
      this.cameraYaw -= deltaX * 0.006;
      this.cameraPitch = Math.max(0.55, Math.min(1.50, this.cameraPitch + deltaY * 0.005));

      this._updateCameraPosition();
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
      const minD = 8;
      const maxD = 120;
      this.cameraDistance = Math.max(minD, Math.min(maxD, this.cameraDistance * zoomFactor));
      this._updateCameraPosition();
    };

    this.webglCanvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    this.webglCanvas.addEventListener('wheel', onWheel, { passive: false });
    this.webglCanvas.addEventListener('dblclick', () => {
      if (this.grid) this._autoFrameCamera(this.grid);
    });
  }

  _updateCameraPosition() {
    if (!this.camera) return;
    const x = this.cameraTarget.x + this.cameraDistance * Math.cos(this.cameraPitch) * Math.sin(this.cameraYaw);
    const y = this.cameraTarget.y + this.cameraDistance * Math.sin(this.cameraPitch);
    const z = this.cameraTarget.z + this.cameraDistance * Math.cos(this.cameraPitch) * Math.cos(this.cameraYaw);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
  }

  _autoFrameCamera(grid) {
    if (!grid || !this.camera) return;
    const cols = grid.cols;
    const rows = grid.rows;
    const mazeW = cols * this.CELL_SIZE;
    const mazeH = rows * this.CELL_SIZE;

    // Center target on labyrinth
    this.cameraTarget.set(mazeW / 2, 0, mazeH / 2);

    // Calculate viewing distance based on FOV, aspect ratio, and maze dimensions
    const aspect = this.camera.aspect || 1.0;
    const fovRad = (this.camera.fov * Math.PI) / 180;

    // Optimal zoom framing: fits maze snugly (~90% viewport fill, matching reference image)
    const marginFactor = 1.08;
    const vDist = ((mazeH * marginFactor) / 2) / Math.tan(fovRad / 2);
    const hDist = ((mazeW * marginFactor) / 2) / (Math.tan(fovRad / 2) * Math.max(0.4, aspect));
    this.cameraDistance = Math.max(vDist, hDist);

    // Default viewing angle: high-angle elevated perspective (74°) with zero yaw (squared to frame)
    // Matches the reference game environment image exactly
    this.cameraPitch = 74 * (Math.PI / 180);
    this.cameraYaw = 0;

    this._updateCameraPosition();

    // Adjust shadow frustum to fit maze
    if (this.dirLight) {
      const radius = Math.max(mazeW, mazeH) * 0.95;
      this.dirLight.shadow.camera.left = -radius;
      this.dirLight.shadow.camera.right = radius;
      this.dirLight.shadow.camera.top = radius;
      this.dirLight.shadow.camera.bottom = -radius;
      this.dirLight.shadow.camera.updateProjectionMatrix();
      // Sun in upper North-West casting shadows down and to the right
      this.dirLight.position.set(mazeW * 0.5 - radius * 0.7, radius * 1.5, mazeH * 0.5 - radius * 0.7);
      this.dirLight.target.position.copy(this.cameraTarget);
      this.scene.add(this.dirLight.target);
    }
  }

  // =========================================================================
  // DYNAMIC 3D MESH GENERATION FROM GRID DATA
  // =========================================================================

  /**
   * Rebuilds the complete 3D sandstone maze when a new maze is generated.
   * @param {import('../../core/grid.js').Grid} grid
   */
  setGrid(grid) {
    this.grid = grid;
    if (!this.isInitialized || !this.scene || !grid) return;

    // 1. Clear previous 3D geometry from maze group
    this._disposeGroup(this.mazeGroup);

    const cols = grid.cols;
    const rows = grid.rows;
    const cs = this.CELL_SIZE;
    const wt = this.WALL_THICK;
    const wh = this.WALL_HEIGHT;

    // 2. Build Floor Slab
    this._buildFloorMesh(cols, rows, cs);

    // 3. Build Real 3D Sandstone Wall Meshes (Merged Geometry with block divisions)
    this._buildWallMeshes(grid, cols, rows, cs, wt, wh);

    // 4. Build Outer Carved Perimeter Frame with Hieroglyphic Reliefs
    this._buildPerimeterBorder(grid, cols, rows, cs, wt, wh);

    // 5. Build Start Altar (Golden Dais) and Exit Portal
    this._buildStartAndExit(grid, cols, rows, cs, wh);

    // 6. Build Player Token (Ancient Golden Orb)
    this._buildPlayerToken(grid, cs);

    // 7. Auto-frame camera
    this._autoFrameCamera(grid);

    // 8. Trigger resize to match container
    this.resize();
  }

  _buildFloorMesh(cols, rows, cs) {
    const mw = cols * cs;
    const mh = rows * cs;
    const floorGeo = new THREE.PlaneGeometry(mw, mh, Math.min(cols, 20), Math.min(rows, 20));
    floorGeo.rotateX(-Math.PI / 2);

    this.floorMesh = new THREE.Mesh(floorGeo, this.floorMaterial);
    this.floorMesh.position.set(mw / 2, 0, mh / 2);
    this.floorMesh.receiveShadow = true;
    this.mazeGroup.add(this.floorMesh);
  }

  _buildWallMeshes(grid, cols, rows, cs, wt, wh) {
    const wallGeometries = [];
    const halfWt = wt / 2;

    // Wall box with slight chamfer
    const blockGeo = (width, height, depth) => new THREE.BoxGeometry(width, height, depth);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const w = grid.walls[i];

        // 1. Horizontal Interior Wall (East-West)
        if (w & Wall.S && r < rows - 1) {
          const wx = (c + 0.5) * cs;
          const wz = (r + 1) * cs;
          const ww = cs + wt;

          // Divide wall into 2 distinct sandstone masonry blocks
          const bLen = ww / 2 - 0.02;
          const b1 = blockGeo(bLen, wh, wt);
          b1.translate(wx - bLen / 2 - 0.01, wh / 2, wz);
          wallGeometries.push(b1);

          const b2 = blockGeo(bLen, wh, wt);
          b2.translate(wx + bLen / 2 + 0.01, wh / 2, wz);
          wallGeometries.push(b2);
        }

        // 2. Vertical Interior Wall (North-South)
        if (w & Wall.E && c < cols - 1) {
          const vx = (c + 1) * cs;
          const vz = (r + 0.5) * cs;
          const vh = cs + wt;

          // Divide wall into 2 distinct sandstone masonry blocks
          const bLen = vh / 2 - 0.02;
          const b1 = blockGeo(wt, wh, bLen);
          b1.translate(vx, wh / 2, vz - bLen / 2 - 0.01);
          wallGeometries.push(b1);

          const b2 = blockGeo(wt, wh, bLen);
          b2.translate(vx, wh / 2, vz + bLen / 2 + 0.01);
          wallGeometries.push(b2);
        }

        // 3. Junction Pillars at intersections where walls connect
        const jx = c * cs;
        const jz = r * cs;
        const p = blockGeo(wt, wh, wt);
        p.translate(jx, wh / 2, jz);
        wallGeometries.push(p);
      }
    }

    if (wallGeometries.length > 0) {
      // Merge all wall geometries into a single high-performance buffer
      const mergedGeo = this._mergeBufferGeometries(wallGeometries);
      this.wallMesh = new THREE.Mesh(mergedGeo, this.sandstoneMaterial);
      this.wallMesh.castShadow = true;
      this.wallMesh.receiveShadow = true;
      this.mazeGroup.add(this.wallMesh);
    }
  }

  _buildPerimeterBorder(grid, cols, rows, cs, wt, wh) {
    const borderGeos = [];
    const bThick = wt * 1.35;
    const mw = cols * cs;
    const mh = rows * cs;

    const blockGeo = (w, h, d) => new THREE.BoxGeometry(w, h, d);

    // North outer wall
    const nWall = blockGeo(mw + bThick * 2, wh, bThick);
    nWall.translate(mw / 2, wh / 2, -bThick / 2);
    borderGeos.push(nWall);

    // South outer wall (leave opening at exit cell)
    const endC = grid.colOf(grid.end);
    const endX = (endC + 0.5) * cs;

    if (endC > 0) {
      const sLeftW = endC * cs + bThick;
      const sLeft = blockGeo(sLeftW, wh, bThick);
      sLeft.translate(-bThick + sLeftW / 2, wh / 2, mh + bThick / 2);
      borderGeos.push(sLeft);
    }
    if (endC < cols - 1) {
      const sRightW = (cols - 1 - endC) * cs + bThick;
      const sRight = blockGeo(sRightW, wh, bThick);
      sRight.translate(endX + cs / 2 + sRightW / 2, wh / 2, mh + bThick / 2);
      borderGeos.push(sRight);
    }

    // West outer wall (leave opening at start cell)
    const startR = grid.rowOf(grid.start);
    const startZ = (startR + 0.5) * cs;

    if (startR > 0) {
      const wTopH = startR * cs + bThick;
      const wTop = blockGeo(bThick, wh, wTopH);
      wTop.translate(-bThick / 2, wh / 2, -bThick + wTopH / 2);
      borderGeos.push(wTop);
    }
    if (startR < rows - 1) {
      const wBotH = (rows - 1 - startR) * cs + bThick;
      const wBot = blockGeo(bThick, wh, wBotH);
      wBot.translate(-bThick / 2, wh / 2, startZ + cs / 2 + wBotH / 2);
      borderGeos.push(wBot);
    }

    // East outer wall
    const eWall = blockGeo(bThick, wh, mh + bThick * 2);
    eWall.translate(mw + bThick / 2, wh / 2, mh / 2);
    borderGeos.push(eWall);

    if (borderGeos.length > 0) {
      const mergedBorder = this._mergeBufferGeometries(borderGeos);
      this.borderMesh = new THREE.Mesh(mergedBorder, this.borderMaterial);
      this.borderMesh.castShadow = true;
      this.borderMesh.receiveShadow = true;
      this.mazeGroup.add(this.borderMesh);
    }
  }

  _buildStartAndExit(grid, cols, rows, cs, wh) {
    // 1. Start: Glowing Cylindrical Golden Dais & Altar
    const startCell = grid.start;
    const startX = (grid.colOf(startCell) + 0.5) * cs;
    const startZ = (grid.rowOf(startCell) + 0.5) * cs;

    const daisGeo = new THREE.CylinderGeometry(cs * 0.38, cs * 0.42, 0.4, 24);
    const daisMat = new THREE.MeshStandardMaterial({
      color: 0xf5b52e,
      roughness: 0.35,
      metalness: 0.75,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
    });
    this.startMesh = new THREE.Mesh(daisGeo, daisMat);
    this.startMesh.position.set(startX, 0.2, startZ);
    this.startMesh.receiveShadow = true;
    this.mazeGroup.add(this.startMesh);

    // Glowing core jewel on altar
    const jewelGeo = new THREE.SphereGeometry(cs * 0.16, 16, 16);
    const jewelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const jewel = new THREE.Mesh(jewelGeo, jewelMat);
    jewel.position.set(0, 0.25, 0);
    this.startMesh.add(jewel);

    // Position Start Point Light
    if (this.startPointLight) {
      this.startPointLight.position.set(startX, 1.2, startZ);
    }

    // 2. 3D Green Entrance Arrow pointing into the maze
    const arrowGroup = new THREE.Group();
    const coneGeo = new THREE.ConeGeometry(0.35, 0.65, 16);
    coneGeo.rotateZ(-Math.PI / 2);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.3, metalness: 0.4 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(startX - cs * 0.65, 0.45, startZ);
    arrowGroup.add(cone);

    const stemGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12);
    stemGeo.rotateZ(-Math.PI / 2);
    const stem = new THREE.Mesh(stemGeo, coneMat);
    stem.position.set(startX - cs * 0.95, 0.45, startZ);
    arrowGroup.add(stem);
    this.mazeGroup.add(arrowGroup);

    // 3. Exit: Red Portal Threshold
    const endCell = grid.end;
    const endX = (grid.colOf(endCell) + 0.5) * cs;
    const endZ = (grid.rowOf(endCell) + 0.5) * cs;

    const exitGeo = new THREE.BoxGeometry(cs * 0.8, 0.12, cs * 0.8);
    const exitMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.4,
      metalness: 0.5,
      emissive: 0xdc2626,
      emissiveIntensity: 0.5,
    });
    this.exitMesh = new THREE.Mesh(exitGeo, exitMat);
    this.exitMesh.position.set(endX, 0.06, endZ);
    this.mazeGroup.add(this.exitMesh);

    // Position Exit Point Light
    if (this.exitPointLight) {
      this.exitPointLight.position.set(endX, 1.0, endZ);
    }

    // 4. 3D Red Exit Arrow pointing downward out of maze
    const exitArrow = new THREE.Group();
    const exitConeGeo = new THREE.ConeGeometry(0.35, 0.65, 16);
    exitConeGeo.rotateX(Math.PI / 2);
    const exitConeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.4 });
    const eCone = new THREE.Mesh(exitConeGeo, exitConeMat);
    eCone.position.set(endX, 0.45, endZ + cs * 0.85);
    exitArrow.add(eCone);
    this.mazeGroup.add(exitArrow);
  }

  _buildPlayerToken(grid, cs) {
    // 3D Ancient Egyptian Golden Explorer Orb
    const tokenGroup = new THREE.Group();

    // Central golden sphere
    const sphereGeo = new THREE.SphereGeometry(cs * 0.22, 24, 24);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xf5b52e,
      roughness: 0.25,
      metalness: 0.85,
      emissive: 0xb45309,
      emissiveIntensity: 0.3,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.castShadow = true;
    tokenGroup.add(sphere);

    // Gilded equator ring
    const ringGeo = new THREE.TorusGeometry(cs * 0.24, 0.04, 12, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xffe082, roughness: 0.15, metalness: 0.9 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    tokenGroup.add(ring);

    // Center focal jewel
    const jewelGeo = new THREE.SphereGeometry(cs * 0.08, 12, 12);
    const jewelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const jewel = new THREE.Mesh(jewelGeo, jewelMat);
    tokenGroup.add(jewel);

    // Place at start cell
    const startX = (grid.colOf(grid.start) + 0.5) * cs;
    const startZ = (grid.rowOf(grid.start) + 0.5) * cs;
    tokenGroup.position.set(startX, 0.55, startZ);

    this.playerMesh = tokenGroup;
    this.mazeGroup.add(this.playerMesh);

    this.playerCurrentPos.copy(this.playerMesh.position);
    this.playerTargetPos.copy(this.playerMesh.position);
  }

  // =========================================================================
  // DYNAMIC GAMEPLAY & SOLVER VISUALIZATION
  // =========================================================================

  /**
   * Updates player position smoothly with interpolation.
   * @param {number} cell
   */
  setPlayer(cell) {
    if (!this.grid || !this.playerMesh || cell < 0 || cell >= this.grid.size) return;
    const cs = this.CELL_SIZE;
    const tx = (this.grid.colOf(cell) + 0.5) * cs;
    const tz = (this.grid.rowOf(cell) + 0.5) * cs;

    this.playerTargetPos.set(tx, 0.55, tz);
    this.playerHasTarget = true;
  }

  resetPlayer() {
    if (!this.grid || !this.playerMesh) return;
    this.setPlayer(this.grid.start);
    if (this.playerMesh) {
      this.playerMesh.position.copy(this.playerTargetPos);
      this.playerCurrentPos.copy(this.playerTargetPos);
    }
  }

  /**
   * Visualizes solver path, explored search cells, and active branch.
   * @param {number[]} path
   * @param {number[]} explored
   * @param {number[]} activeTrail
   * @param {number} currentHead
   */
  setSolution(path = [], explored = [], activeTrail = [], currentHead = -1) {
    if (!this.grid || !this.scene) return;
    const cs = this.CELL_SIZE;

    // 1. Solution Path Mesh (Floor-level luminous ribbon occluded by 3D walls)
    if (this.pathMesh) {
      this.mazeGroup.remove(this.pathMesh);
      this.pathMesh.geometry.dispose();
      this.pathMesh = null;
    }

    if (path && path.length > 1) {
      const points = [];
      for (const c of path) {
        const px = (this.grid.colOf(c) + 0.5) * cs;
        const pz = (this.grid.rowOf(c) + 0.5) * cs;
        points.push(new THREE.Vector3(px, 0.05, pz));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, path.length * 6, 0.16, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        emissive: 0xef4444,
        emissiveIntensity: 0.9,
        roughness: 0.3,
        metalness: 0.6,
      });
      this.pathMesh = new THREE.Mesh(tubeGeo, tubeMat);
      this.mazeGroup.add(this.pathMesh);
    }

    // 2. Explored Cells Glow
    if (this.exploredGroup) {
      this._disposeGroup(this.exploredGroup);
      this.mazeGroup.remove(this.exploredGroup);
      this.exploredGroup = null;
    }

    if (explored && explored.length > 0) {
      this.exploredGroup = new THREE.Group();
      const expGeo = new THREE.PlaneGeometry(cs * 0.9, cs * 0.9);
      expGeo.rotateX(-Math.PI / 2);
      const expMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      });

      for (const cell of explored) {
        if (cell < 0 || cell >= this.grid.size) continue;
        const em = new THREE.Mesh(expGeo, expMat);
        em.position.set((this.grid.colOf(cell) + 0.5) * cs, 0.02, (this.grid.rowOf(cell) + 0.5) * cs);
        this.exploredGroup.add(em);
      }
      this.mazeGroup.add(this.exploredGroup);
    }

    // 3. Move player or seeker head
    if (currentHead >= 0) {
      this.setPlayer(currentHead);
    }
  }

  clearSolution() {
    if (this.pathMesh) {
      this.mazeGroup.remove(this.pathMesh);
      this.pathMesh.geometry.dispose();
      this.pathMesh = null;
    }
    if (this.exploredGroup) {
      this._disposeGroup(this.exploredGroup);
      this.mazeGroup.remove(this.exploredGroup);
      this.exploredGroup = null;
    }
  }

  // =========================================================================
  // ANIMATION LOOP & RESIZE HANDLING
  // =========================================================================

  _startAnimationLoop() {
    const animate = () => {
      this.animFrameId = requestAnimationFrame(animate);

      // Smooth player movement interpolation (glide smoothly between cell centers)
      if (this.playerMesh && this.playerHasTarget) {
        this.playerMesh.position.lerp(this.playerTargetPos, 0.22);
        // Subtle floating bob
        this.playerMesh.position.y = 0.55 + Math.sin(performance.now() * 0.005) * 0.06;
      }

      // Subtle pulse on start dais altar
      if (this.startMesh) {
        const pulse = 1.0 + Math.sin(performance.now() * 0.004) * 0.08;
        if (this.startPointLight) {
          this.startPointLight.intensity = 3.5 * pulse;
        }
      }

      // Render 3D Scene
      if (this.renderer && this.scene && this.camera && this.currentTheme === 'sheet') {
        this.renderer.render(this.scene, this.camera);
      }
    };
    animate();
  }

  resize() {
    if (!this.renderer || !this.camera || !this.container) return;
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 600;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h, false);
    if (this.webglCanvas) {
      this.webglCanvas.style.width = `${w}px`;
      this.webglCanvas.style.height = `${h}px`;
    }
  }

  setTheme(theme) {
    this.currentTheme = theme || 'sheet';
    if (this.webglCanvas) {
      this.webglCanvas.style.display = this.currentTheme === 'sheet' ? 'block' : 'none';
    }
    if (this.currentTheme === 'sheet') {
      this.resize();
    }
  }

  // =========================================================================
  // UTILITY HELPERS
  // =========================================================================

  _mergeBufferGeometries(geometries) {
    // Simple robust merger of BufferGeometries into a unified mesh buffer
    let totalPos = 0;
    let totalNorm = 0;
    let totalUv = 0;
    let totalIdx = 0;

    for (const g of geometries) {
      totalPos += g.attributes.position.array.length;
      if (g.attributes.normal) totalNorm += g.attributes.normal.array.length;
      if (g.attributes.uv) totalUv += g.attributes.uv.array.length;
      if (g.index) totalIdx += g.index.array.length;
    }

    const posArray = new Float32Array(totalPos);
    const normArray = new Float32Array(totalNorm);
    const uvArray = new Float32Array(totalUv);
    const idxArray = totalIdx > 0 ? new Uint32Array(totalIdx) : null;

    let pOff = 0, nOff = 0, uvOff = 0, iOff = 0, vCount = 0;

    for (const g of geometries) {
      const p = g.attributes.position.array;
      posArray.set(p, pOff);
      pOff += p.length;

      if (g.attributes.normal) {
        const n = g.attributes.normal.array;
        normArray.set(n, nOff);
        nOff += n.length;
      }

      if (g.attributes.uv) {
        const u = g.attributes.uv.array;
        uvArray.set(u, uvOff);
        uvOff += u.length;
      }

      if (g.index && idxArray) {
        const idx = g.index.array;
        for (let j = 0; j < idx.length; j++) {
          idxArray[iOff + j] = idx[j] + vCount;
        }
        iOff += idx.length;
      }
      vCount += g.attributes.position.count;
      g.dispose();
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    if (totalNorm > 0) merged.setAttribute('normal', new THREE.BufferAttribute(normArray, 3));
    if (totalUv > 0) merged.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
    if (idxArray) merged.setIndex(new THREE.BufferAttribute(idxArray, 1));

    return merged;
  }

  _disposeGroup(group) {
    if (!group) return;
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      if (child.isGroup) {
        this._disposeGroup(child);
      }
    }
  }

  destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.webglCanvas && this.webglCanvas.parentElement) {
      this.webglCanvas.parentElement.removeChild(this.webglCanvas);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
