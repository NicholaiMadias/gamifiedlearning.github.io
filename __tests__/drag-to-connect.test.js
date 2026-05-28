/** @jest-environment jsdom */

import { attachDragToConnect } from '../ui/drag-to-connect.js';
import { jest } from '@jest/globals';

function makeCell(row, col) {
  const el = document.createElement('div');
  el.className = 'gem-cell';
  el.dataset.row = String(row);
  el.dataset.col = String(col);
  return el;
}

function makePointerEvent(type, { x = 0, y = 0, pointerId = 1, button = 0 } = {}) {
  // JSDOM supports PointerEvent in recent versions; fall back to MouseEvent when unavailable.
  const Ctor = window.PointerEvent || window.MouseEvent;
  return new Ctor(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    pointerId,
    button,
  });
}

describe('attachDragToConnect', () => {
  test('fires onConnect once when dragging onto a valid target and suppresses the next click', () => {
    const board = document.createElement('div');
    const a = makeCell(0, 0);
    const b = makeCell(0, 1);
    board.appendChild(a);
    board.appendChild(b);
    document.body.appendChild(board);

    const onConnect = jest.fn();
    const onCellClick = jest.fn();
    b.addEventListener('click', onCellClick);

    const detach = attachDragToConnect(board, {
      cellSelector: '.gem-cell',
      getCoord: el => ({ row: Number(el.dataset.row), col: Number(el.dataset.col) }),
      canConnect: (from, to) => Math.abs(from.row - to.row) + Math.abs(from.col - to.col) === 1,
      onConnect,
      getCellAtPoint: (x) => (x < 50 ? a : b),
    });

    a.dispatchEvent(makePointerEvent('pointerdown', { x: 10, y: 10, pointerId: 7 }));
    board.dispatchEvent(makePointerEvent('pointermove', { x: 90, y: 10, pointerId: 7 }));
    expect(onConnect).toHaveBeenCalledTimes(0);
    board.dispatchEvent(makePointerEvent('pointerup', { x: 90, y: 10, pointerId: 7 }));

    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(onConnect).toHaveBeenCalledWith({ row: 0, col: 0 }, { row: 0, col: 1 });

    // Next click should be suppressed
    b.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(onCellClick).toHaveBeenCalledTimes(0);

    detach();
  });

  test('does not suppress clicks when no connect occurred', () => {
    const board = document.createElement('div');
    const a = makeCell(0, 0);
    board.appendChild(a);
    document.body.appendChild(board);

    const onConnect = jest.fn();
    const onCellClick = jest.fn();
    a.addEventListener('click', onCellClick);

    const detach = attachDragToConnect(board, {
      cellSelector: '.gem-cell',
      getCoord: el => ({ row: Number(el.dataset.row), col: Number(el.dataset.col) }),
      canConnect: () => false,
      onConnect,
      getCellAtPoint: () => a,
    });

    // Drag around but never connect
    a.dispatchEvent(makePointerEvent('pointerdown', { x: 10, y: 10, pointerId: 1 }));
    board.dispatchEvent(makePointerEvent('pointermove', { x: 20, y: 10, pointerId: 1 }));
    board.dispatchEvent(makePointerEvent('pointerup', { x: 20, y: 10, pointerId: 1 }));

    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(onCellClick).toHaveBeenCalledTimes(1);
    expect(onConnect).toHaveBeenCalledTimes(0);

    detach();
  });
});
