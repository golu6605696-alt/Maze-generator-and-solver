/**
 * @file detent_dial.js
 * <detent-dial> Web Component.
 * Tactile speed selector with notched detents: 1, 2, 5, 10, 30, 100, 300, 1000, MAX.
 * Defined in DESIGN.md section 3.2.
 */

import { SPEED_DETENTS } from '../../core/constants.js';
import { sound } from '../audio.js';

export class DetentDial extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._detents = SPEED_DETENTS;
    this._labels = ['1', '2', '5', '10', '30', '100', '300', '1k', 'MAX'];
    this._index = 4; // default 30
  }

  connectedCallback() {
    this.setAttribute('role', 'slider');
    this.setAttribute('tabindex', '0');
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', String(this._detents.length - 1));
    this._updateAria();

    this._render();

    this.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.stepUp();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        this.stepDown();
      }
    });
  }

  get value() {
    return this._detents[this._index];
  }

  set value(val) {
    const idx = this._detents.indexOf(val);
    if (idx !== -1 && idx !== this._index) {
      this._index = idx;
      this._updateAria();
      this._updateVisual();
    }
  }

  stepUp() {
    if (this._index < this._detents.length - 1) {
      this._index++;
      sound.play('tick');
      this._updateAria();
      this._updateVisual();
      this._dispatchChange();
    }
  }

  stepDown() {
    if (this._index > 0) {
      this._index--;
      sound.play('tick');
      this._updateAria();
      this._updateVisual();
      this._dispatchChange();
    }
  }

  setIndex(idx) {
    if (idx >= 0 && idx < this._detents.length && idx !== this._index) {
      this._index = idx;
      sound.play('tick');
      this._updateAria();
      this._updateVisual();
      this._dispatchChange();
    }
  }

  _updateAria() {
    this.setAttribute('aria-valuenow', String(this._index));
    const label = this._labels[this._index];
    this.setAttribute('aria-valuetext', `${label} steps per second`);
  }

  _dispatchChange() {
    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: this.value, label: this._labels[this._index] },
      bubbles: true,
    }));
  }

  _updateVisual() {
    const angle = -120 + (this._index / (this._detents.length - 1)) * 240;
    const pointer = this.shadowRoot.querySelector('.pointer');
    const readout = this.shadowRoot.querySelector('.readout');
    if (pointer) {
      pointer.style.transform = `rotate(${angle}deg)`;
    }
    if (readout) {
      readout.textContent = `SPEED: ${this._labels[this._index]}`;
    }
    const marks = this.shadowRoot.querySelectorAll('.notch');
    marks.forEach((m, i) => {
      if (i === this._index) m.classList.add('active');
      else m.classList.remove('active');
    });
  }

  _render() {
    const angle = -120 + (this._index / (this._detents.length - 1)) * 240;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          user-select: none;
          outline: none;
          font-family: inherit;
        }
        :host(:focus-visible) .dial-body {
          outline: 2px solid var(--brass, #e5a93b);
          outline-offset: 3px;
        }
        .dial-container {
          position: relative;
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .dial-body {
          position: relative;
          width: 44px;
          height: 44px;
          background: var(--stone-2, #243033);
          border: 1px solid var(--rule-strong, #55645f);
          border-radius: 50%;
          box-shadow: 2px 2px 0 #000, inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .pointer {
          position: absolute;
          top: 4px;
          left: 20px;
          width: 4px;
          height: 16px;
          background: var(--brass, #e5a93b);
          transform-origin: 2px 18px;
          transform: rotate(${angle}deg);
          box-shadow: 0 0 2px rgba(0,0,0,0.8);
          transition: transform 60ms steps(3);
        }
        .center-cap {
          position: absolute;
          top: 15px;
          left: 15px;
          width: 14px;
          height: 14px;
          background: var(--stone, #1b2224);
          border: 1px solid var(--rule, #3a4649);
          border-radius: 50%;
        }
        .readout {
          font-size: 11px;
          color: var(--brass, #e5a93b);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-align: center;
        }
        .notches {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .notch {
          position: absolute;
          width: 2px;
          height: 5px;
          background: var(--rule, #3a4649);
          top: 2px;
          left: 28px;
          transform-origin: 1px 27px;
        }
        .notch.active {
          background: var(--brass, #e5a93b);
        }
      </style>
      <div class="dial-container">
        <div class="notches">
          ${this._detents.map((_, i) => {
            const a = -120 + (i / (this._detents.length - 1)) * 240;
            return `<div class="notch ${i === this._index ? 'active' : ''}" style="transform: rotate(${a}deg)"></div>`;
          }).join('')}
        </div>
        <div class="dial-body">
          <div class="pointer"></div>
          <div class="center-cap"></div>
        </div>
      </div>
      <div class="readout">SPEED: ${this._labels[this._index]}</div>
    `;

    this.shadowRoot.querySelector('.dial-container').addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rad = Math.atan2(e.clientY - cy, e.clientX - cx);
      let deg = (rad * 180) / Math.PI + 90;
      if (deg < -180) deg += 360;
      if (deg > 180) deg -= 360;

      // Map deg in [-120, 120] to detent index
      const clamped = Math.max(-120, Math.min(120, deg));
      const fraction = (clamped + 120) / 240;
      const idx = Math.round(fraction * (this._detents.length - 1));
      this.setIndex(idx);
    });
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('detent-dial')) {
  customElements.define('detent-dial', DetentDial);
}
