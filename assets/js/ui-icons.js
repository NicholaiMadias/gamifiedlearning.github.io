/**
 * ui-icons.js — SVG Icon utility for Nexus Arcade V2
 * Resolves element names to inline SVG <use> elements pointing at master-atlas.svg.
 * Supports both inline-sprite (loaded via fetch+inject) and external-href modes.
 * (c) 2026 NicholaiMadias — MIT License
 */

const ATLAS_PATH = '/assets/svg/master-atlas.svg';

/** Element → CSS class map */
const CLASS_MAP = {
  radiant: 'gem-radiant',
  tide:    'gem-tide',
  verdant: 'gem-verdant',
  forge:   'gem-forge',
  aether:  'gem-aether',
  umbra:   'gem-umbra',
  void:    'gem-void',
};

let _atlasInjected = false;

/**
 * Lazily fetches and injects the SVG atlas into the document body as an inline
 * hidden sprite sheet. This enables cross-browser <use href="#icon-…"> references
 * without specifying the external file path in each <use> element.
 * @returns {Promise<void>}
 */
export async function injectAtlas() {
  if (_atlasInjected || typeof document === 'undefined') return;
  try {
    const res  = await fetch(ATLAS_PATH);
    if (!res.ok) {
      console.warn(`[ui-icons] Could not load SVG atlas: HTTP ${res.status}`);
      return;
    }
    const text = await res.text();
    const div  = document.createElement('div');
    div.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
    div.setAttribute('aria-hidden', 'true');
    div.innerHTML = text;
    document.body.insertBefore(div, document.body.firstChild);
    _atlasInjected = true;
  } catch (err) {
    console.warn('[ui-icons] Could not inject SVG atlas:', err);
  }
}

/**
 * Creates an SVG element with a <use> referencing the master atlas icon for an
 * element type. Works with both inline-injected sprites and external-href mode.
 *
 * @param {string} element - Element type ('radiant', 'tide', 'verdant', 'forge', 'aether', 'umbra', 'void')
 * @param {object} [options]
 * @param {string} [options.cls='gem-icon']  - CSS class on the SVG element
 * @param {string} [options.label='']        - Accessible label (sets aria-label + role="img")
 * @param {boolean} [options.external=false] - Use external href (includes file path); set true if atlas is not injected
 * @returns {SVGSVGElement}
 */
export function createIcon(element, { cls = 'gem-icon', label = '', external = false } = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', cls);
  svg.setAttribute('data-element', element);
  svg.setAttribute('focusable', 'false');

  if (label) {
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = label;
    svg.appendChild(title);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);
  } else {
    svg.setAttribute('aria-hidden', 'true');
  }

  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  const href = external
    ? `${ATLAS_PATH}#icon-${element}`
    : `#icon-${element}`;
  use.setAttribute('href', href);
  svg.appendChild(use);

  return svg;
}

/**
 * Returns the CSS class associated with a V2 element type.
 * @param {string} element
 * @returns {string}
 */
export function getElementClass(element) {
  return CLASS_MAP[element] || 'gem-void';
}

/**
 * Creates a gem cell button element pre-populated with an SVG icon.
 * Suitable for use inside the V2 board renderer.
 *
 * @param {string} element - Element type
 * @param {string} label   - Accessible label (e.g. "Radiant, row 1, col 2")
 * @param {object} [options]
 * @param {boolean} [options.external=false]
 * @returns {HTMLButtonElement}
 */
export function createGemButton(element, label, { external = false } = {}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `gem-cell gem-cell-v2 ${getElementClass(element)}`;
  btn.setAttribute('role', 'gridcell');
  btn.setAttribute('aria-label', label);

  const icon = createIcon(element, { label: '', external });
  btn.appendChild(icon);

  return btn;
}
