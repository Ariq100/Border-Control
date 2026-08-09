import { DESK, PALETTE, PLAYER_ANCHOR, t } from './constants';
import type { Sortable, Vec2 } from './types';

/** Where the player character stands (behind the desk, facing the queue). */
export const playerAnchor: Vec2 = { x: t(PLAYER_ANCHOR.x), y: t(PLAYER_ANCHOR.y) };

/** Where the NPC at the front of the line stops to be processed. */
export const deskWindow: Vec2 = { x: t(DESK.x0 + (DESK.x1 - DESK.x0) / 2), y: t(DESK.y + 1.6) };

const x0 = t(DESK.x0);
const x1 = t(DESK.x1);
const baseY = t(DESK.y) + t(DESK.h);
const w = x1 - x0;
const h = t(DESK.h);

/**
 * The desk is a billboard object: flat top surface plus a front face with
 * height, which is what sells the 3/4 angle.
 */
export function deskSortable(): Sortable {
  return {
    y: baseY,
    draw: (ctx) => {
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = '#000';
      ctx.fillRect(x0 - 3, baseY - 4, w + 6, 8);
      ctx.restore();

      // top surface (seen from above, slightly foreshortened)
      ctx.fillStyle = PALETTE.deskTop;
      ctx.fillRect(x0, baseY - h - 14, w, 16);
      ctx.fillStyle = PALETTE.deskEdge;
      ctx.fillRect(x0, baseY - h - 14, w, 2);

      // front face
      ctx.fillStyle = PALETTE.deskFace;
      ctx.fillRect(x0, baseY - h + 2, w, h - 2);
      ctx.fillStyle = '#3b444d';
      for (let x = x0 + 6; x < x1 - 4; x += 18) ctx.fillRect(x, baseY - h + 6, 2, h - 12);

      // amber counter light strip
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = PALETTE.amber;
      ctx.fillRect(x0 + 2, baseY - h + 1, w - 4, 1.5);
      ctx.globalAlpha = 1;

      // service window glass on the queue side
      ctx.fillStyle = 'rgba(143, 208, 255, 0.18)';
      ctx.fillRect(x0 + w * 0.36, baseY - h - 30, w * 0.28, 18);
      ctx.strokeStyle = PALETTE.wallTrim;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x0 + w * 0.36, baseY - h - 30, w * 0.28, 18);

      // terminal on the officer's side
      ctx.fillStyle = '#242c33';
      ctx.fillRect(x0 + 10, baseY - h - 26, 22, 14);
      ctx.fillStyle = PALETTE.teal;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(x0 + 12, baseY - h - 24, 18, 10);
      ctx.globalAlpha = 1;

      // stamp pad + document tray
      ctx.fillStyle = PALETTE.red;
      ctx.fillRect(x1 - 30, baseY - h - 20, 10, 6);
      ctx.fillStyle = '#d8d3c6';
      ctx.fillRect(x1 - 56, baseY - h - 18, 16, 5);
    },
  };
}

/** Stanchion sign hanging over the desk — reads as signage, drawn above everything. */
export function drawDeskSign(ctx: CanvasRenderingContext2D) {
  const cx = (x0 + x1) / 2;
  const y = baseY - h - 118; // mounted high on the back wall, above the officer
  ctx.fillStyle = '#1d2329';
  ctx.fillRect(cx - 54, y, 108, 20);
  ctx.strokeStyle = PALETTE.tealDim;
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 54, y, 108, 20);
  ctx.fillStyle = PALETTE.teal;
  ctx.font = 'bold 10px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BORDER CONTROL', cx, y + 13);
  ctx.textAlign = 'start';
}
