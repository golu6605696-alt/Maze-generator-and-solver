/**
 * @file transport_bar.js
 * <transport-bar> Web Component.
 * Cassette tape transport bar with tactile hardware-style keys.
 * Defined in DESIGN.md section 3.3.
 */

import { sound } from '../audio.js';

export class TransportBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._playing = false;
  }

  connectedCallback() {
    this._render();
    this._bindEvents();
  }

  setPlaying(playing) {
    this._playing = Boolean(playing);
    const playBtn = this.shadowRoot.querySelector('#btn-play');
    if (playBtn) {
      if (this._playing) {
        playBtn.classList.add('active');
        playBtn.innerHTML = '|| PAUSE';
      } else {
        playBtn.classList.remove('active');
        playBtn.innerHTML = '&#9654; PLAY';
      }
    }
  }

  _bindEvents() {
    this.shadowRoot.querySelector('#btn-rewind')?.addEventListener('click', () => {
      sound.play('click');
      this.dispatchEvent(new CustomEvent('rewind', { bubbles: true }));
    });
    this.shadowRoot.querySelector('#btn-step-back')?.addEventListener('click', () => {
      sound.play('click');
      this.dispatchEvent(new CustomEvent('step-back', { bubbles: true }));
    });
    this.shadowRoot.querySelector('#btn-play')?.addEventListener('click', () => {
      sound.play('click');
      this.dispatchEvent(new CustomEvent('play-pause', { bubbles: true }));
    });
    this.shadowRoot.querySelector('#btn-step')?.addEventListener('click', () => {
      sound.play('click');
      this.dispatchEvent(new CustomEvent('step', { bubbles: true }));
    });
    this.shadowRoot.querySelector('#btn-end')?.addEventListener('click', () => {
      sound.play('click');
      this.dispatchEvent(new CustomEvent('end', { bubbles: true }));
    });
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          gap: 4px;
          user-select: none;
        }
        button {
          background: var(--stone-2, #243033);
          color: var(--parchment, #e6e2d8);
          border: 1px solid var(--rule-strong, #55645f);
          padding: 6px 10px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          box-shadow: 2px 2px 0 #000;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          outline: none;
          min-height: 28px;
        }
        button:hover {
          background: var(--stone, #1b2224);
          border-color: var(--brass, #e5a93b);
        }
        button:active, button.active {
          transform: translate(2px, 2px);
          box-shadow: none;
          background: var(--brass, #e5a93b);
          color: #000;
          border-color: #ffd875;
        }
        button:focus-visible {
          outline: 2px solid var(--brass, #e5a93b);
          outline-offset: 1px;
        }
      </style>
      <button id="btn-rewind" title="Rewind (Home)">|&#9664;</button>
      <button id="btn-step-back" title="Step Back (Left)">&#9664;&#9664;</button>
      <button id="btn-play" title="Play / Pause (Space)">&#9654; PLAY</button>
      <button id="btn-step" title="Step (Right)">&#9654;&#9654;</button>
      <button id="btn-end" title="Jump to End (End)">&#9654;|</button>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('transport-bar')) {
  customElements.define('transport-bar', TransportBar);
}
