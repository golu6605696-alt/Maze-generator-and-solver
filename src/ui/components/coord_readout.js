/**
 * @file coord_readout.js
 * <coord-readout> Web Component.
 * Segmented LCD-style bracketed coordinates and telemetry readout.
 * Defined in DESIGN.md section 3.4.
 */

export class CoordReadout extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._render();
  }

  update({ r = 0, c = 0, el = 0, cost = 1, t = 0 }) {
    const pad = (n, len) => String(n).padStart(len, '0');
    const rStr = pad(r, 3);
    const cStr = pad(c, 3);
    const elStr = el >= 0 ? `+${el}` : String(el);
    const costStr = String(cost);
    const tStr = pad(t, 5);

    const span = this.shadowRoot.querySelector('.content');
    if (span) {
      span.textContent = `[R:${rStr} C:${cStr}]  [EL:${elStr}]  [COST:${costStr}]  [T:${tStr}]`;
    }
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--brass, #e5a93b);
          background: var(--ink, #0f1416);
          padding: 4px 8px;
          border: 1px solid var(--rule-strong, #55645f);
          letter-spacing: 0.08em;
          box-shadow: inset 1px 1px 2px rgba(0,0,0,0.8);
          font-variant-numeric: tabular-nums slashed-zero;
          user-select: none;
        }
        .content {
          white-space: pre;
        }
      </style>
      <span class="content">[R:000 C:000]  [EL:+0]  [COST:1]  [T:00000]</span>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('coord-readout')) {
  customElements.define('coord-readout', CoordReadout);
}
