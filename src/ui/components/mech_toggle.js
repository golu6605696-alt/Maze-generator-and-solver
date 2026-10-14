/**
 * @file mech_toggle.js
 * <mech-toggle> Web Component.
 * Mechanical toggle switch with 3-frame stepped detent travel and brass indicator.
 * Defined in DESIGN.md section 3.1.
 */

import { sound } from '../audio.js';

export class MechToggle extends HTMLElement {
  static get observedAttributes() {
    return ['checked', 'label', 'disabled'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._checked = false;
  }

  connectedCallback() {
    this.setAttribute('role', 'switch');
    this.setAttribute('tabindex', '0');
    this._checked = this.hasAttribute('checked');
    this.setAttribute('aria-checked', String(this._checked));

    this._render();

    this.addEventListener('click', () => this._toggle());
    this.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this._toggle();
      }
    });
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'checked') {
      this._checked = newVal !== null;
      this.setAttribute('aria-checked', String(this._checked));
      this._updateVisual();
    }
  }

  get checked() {
    return this._checked;
  }

  set checked(val) {
    if (this._checked !== Boolean(val)) {
      this._checked = Boolean(val);
      if (this._checked) {
        this.setAttribute('checked', '');
      } else {
        this.removeAttribute('checked');
      }
      this.setAttribute('aria-checked', String(this._checked));
      this._updateVisual();
    }
  }

  _toggle() {
    if (this.hasAttribute('disabled')) return;
    this.checked = !this.checked;
    sound.play('click');
    this.dispatchEvent(new CustomEvent('change', { detail: { checked: this._checked }, bubbles: true }));
  }

  _updateVisual() {
    const lever = this.shadowRoot.querySelector('.lever');
    const pip = this.shadowRoot.querySelector('.pip');
    const labelOn = this.shadowRoot.querySelector('.label-on');
    const labelOff = this.shadowRoot.querySelector('.label-off');

    if (lever && pip) {
      if (this._checked) {
        lever.classList.add('on');
        pip.classList.add('on');
        if (labelOn) labelOn.classList.add('active');
        if (labelOff) labelOff.classList.remove('active');
      } else {
        lever.classList.remove('on');
        pip.classList.remove('on');
        if (labelOn) labelOn.classList.remove('active');
        if (labelOff) labelOff.classList.add('active');
      }
    }
  }

  _render() {
    const label = this.getAttribute('label') || '';
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          font-family: inherit;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          outline: none;
        }
        :host(:focus-visible) .slot {
          outline: 2px solid var(--brass, #e5a93b);
          outline-offset: 2px;
        }
        .main-label {
          color: var(--text-dim, #8d978f);
          font-weight: 500;
        }
        .switch-group {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .slot {
          position: relative;
          width: 44px;
          height: 22px;
          background: var(--stone-2, #243033);
          border: 1px solid var(--rule-strong, #55645f);
          box-shadow: inset 1px 1px 2px rgba(0,0,0,0.6);
        }
        .lever {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 16px;
          background: var(--stone, #1b2224);
          border: 1px solid var(--rule, #3a4649);
          box-shadow: 1px 1px 0 #000;
          transition: transform 90ms steps(3);
        }
        .lever.on {
          transform: translateX(20px);
          background: var(--brass, #e5a93b);
          border-color: #ffd875;
        }
        .pip {
          width: 6px;
          height: 6px;
          background: var(--rule, #3a4649);
          border: 1px solid #000;
        }
        .pip.on {
          background: var(--brass, #e5a93b);
          box-shadow: 0 0 4px var(--brass, #e5a93b);
        }
        .state-label {
          color: var(--rule-strong, #55645f);
          font-size: 10px;
        }
        .state-label.active {
          color: var(--parchment, #e6e2d8);
          font-weight: bold;
        }
      </style>
      ${label ? `<span class="main-label">${label}</span>` : ''}
      <div class="switch-group">
        <span class="state-label label-off ${!this._checked ? 'active' : ''}">OFF</span>
        <div class="slot">
          <div class="lever ${this._checked ? 'on' : ''}"></div>
        </div>
        <span class="state-label label-on ${this._checked ? 'active' : ''}">ON</span>
        <div class="pip ${this._checked ? 'on' : ''}"></div>
      </div>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('mech-toggle')) {
  customElements.define('mech-toggle', MechToggle);
}
