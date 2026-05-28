/**
 * drag-to-connect.js
 *
 * Minimal pointer-driven "drag to connect" helper:
 * - Starts on pointer down over a cell
 * - Tracks the current hovered cell while dragging
 * - Fires `onConnect(from, to)` once per drag when `canConnect(from,to)` is true
 * - Suppresses the synthetic click that follows a drag-connect (preserves click-to-select UX)
 *
 * No dependencies; safe to use with DOM re-renders as long as the board element persists.
 */

/**
 * @typedef {{ row:number, col:number }} GridCoord
 * @typedef {{ originEl:Element, origin:GridCoord, targetEl:Element|null, target:GridCoord|null }} DragState
 */

/**
 * @param {HTMLElement} board
 * @param {object} opts
 * @param {string} [opts.cellSelector]
 * @param {(el:Element)=>GridCoord|null} opts.getCoord
 * @param {(from:GridCoord, to:GridCoord)=>boolean} opts.canConnect
 * @param {(from:GridCoord, to:GridCoord)=>void} opts.onConnect
 * @param {(state:DragState|null)=>void} [opts.onState]
 * @param {string} [opts.originClass]
 * @param {string} [opts.targetClass]
 * @param {(x:number,y:number)=>Element|null} [opts.getCellAtPoint]
 * @returns {() => void} detach
 */
export function attachDragToConnect(board, opts) {
  const {
    cellSelector = '.gem-cell',
    getCoord,
    canConnect,
    onConnect,
    onState = () => {},
    originClass = 'drag-origin',
    targetClass = 'drag-target',
    getCellAtPoint = null,
  } = opts || {};

  if (!board) throw new Error('attachDragToConnect requires a board element');
  if (typeof getCoord !== 'function') throw new Error('attachDragToConnect requires getCoord(el)');
  if (typeof canConnect !== 'function') throw new Error('attachDragToConnect requires canConnect(from,to)');
  if (typeof onConnect !== 'function') throw new Error('attachDragToConnect requires onConnect(from,to)');

  /** @type {{ pointerId:number, originEl:Element, origin:GridCoord, targetEl:Element|null, target:GridCoord|null, connected:boolean }|null} */
  let drag = null;
  let suppressNextClick = false;

  function setElClass(el, cls, on) {
    if (!el) return;
    if (on) el.classList.add(cls);
    else el.classList.remove(cls);
  }

  function clearDragVisuals() {
    if (!drag) return;
    setElClass(drag.originEl, originClass, false);
    setElClass(drag.targetEl, targetClass, false);
  }

  function setTarget(nextTargetEl, nextTargetCoord) {
    if (!drag) return;
    if (drag.targetEl === nextTargetEl) return;
    setElClass(drag.targetEl, targetClass, false);
    drag.targetEl = nextTargetEl;
    drag.target = nextTargetCoord;
    setElClass(drag.targetEl, targetClass, Boolean(drag.targetEl));
    onState({
      originEl: drag.originEl,
      origin: drag.origin,
      targetEl: drag.targetEl,
      target: drag.target,
    });
  }

  function endDrag() {
    if (!drag) return;
    clearDragVisuals();
    drag = null;
    onState(null);
  }

  function closestCell(el) {
    if (!el || typeof el.closest !== 'function') return null;
    return el.closest(cellSelector);
  }

  function cellAtPoint(x, y) {
    if (typeof getCellAtPoint === 'function') return closestCell(getCellAtPoint(x, y));
    const el = document.elementFromPoint(x, y);
    return closestCell(el);
  }

  // Suppress click that follows a real drag-connect so click-to-select doesn't fire unexpectedly.
  function onClickCapture(e) {
    if (!suppressNextClick) return;
    suppressNextClick = false;
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    const cell = closestCell(e.target);
    if (!cell) return;
    const origin = getCoord(cell);
    if (!origin) return;

    // If a previous drag was somehow left active, clean it up.
    endDrag();

    drag = {
      pointerId: e.pointerId ?? 1,
      originEl: cell,
      origin,
      targetEl: null,
      target: null,
      connected: false,
    };
    setElClass(cell, originClass, true);
    onState({ originEl: cell, origin, targetEl: null, target: null });

    try { board.setPointerCapture(drag.pointerId); } catch (_) {}
  }

  function onPointerMove(e) {
    if (!drag) return;
    if ((e.pointerId ?? 1) !== drag.pointerId) return;

    const cell = cellAtPoint(e.clientX, e.clientY);
    if (!cell) {
      setTarget(null, null);
      return;
    }

    const coord = getCoord(cell);
    if (!coord) {
      setTarget(null, null);
      return;
    }

    const isValidTarget = !(coord.row === drag.origin.row && coord.col === drag.origin.col)
      && canConnect(drag.origin, coord);

    setTarget(isValidTarget ? cell : null, isValidTarget ? coord : null);
  }

  function onPointerUp(e) {
    if (!drag) return;
    if ((e.pointerId ?? 1) !== drag.pointerId) return;
    try { board.releasePointerCapture(drag.pointerId); } catch (_) {}
    if (drag.target && !drag.connected) {
      drag.connected = true;
      suppressNextClick = true;
      onConnect(drag.origin, drag.target);
    }
    endDrag();
  }

  function onPointerCancel(e) {
    if (!drag) return;
    if ((e.pointerId ?? 1) !== drag.pointerId) return;
    try { board.releasePointerCapture(drag.pointerId); } catch (_) {}
    endDrag();
  }

  board.addEventListener('click', onClickCapture, true);
  board.addEventListener('pointerdown', onPointerDown);
  board.addEventListener('pointermove', onPointerMove);
  board.addEventListener('pointerup', onPointerUp);
  board.addEventListener('pointercancel', onPointerCancel);

  return () => {
    endDrag();
    board.removeEventListener('click', onClickCapture, true);
    board.removeEventListener('pointerdown', onPointerDown);
    board.removeEventListener('pointermove', onPointerMove);
    board.removeEventListener('pointerup', onPointerUp);
    board.removeEventListener('pointercancel', onPointerCancel);
  };
}
