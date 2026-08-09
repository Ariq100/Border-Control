import { JAIL, JAIL_BAR_X, JAIL_CELLS, JAIL_GATE, PALETTE, t } from './constants';
import type { Sortable, Vec2 } from './types';

/** Standing spots inside the block for detained arrivals. */
export const jailCells: Vec2[] = JAIL_CELLS.map((p) => ({ x: t(p.x), y: t(p.y) }));

const BAR_H = 34;

/** Floor-level detail inside the block, drawn with the tilemap. */
export function drawJailFloor(ctx: CanvasRenderingContext2D) {
  const x0 = t(JAIL.x0);
  const y0 = t(JAIL.y0);
  const w = t(JAIL.x1 - JAIL.x0 + 1);
  const h = t(JAIL.y1 - JAIL.y0 + 1);

  // cold wash + cell dividers painted on the deck
  ctx.save();
  const wash = ctx.createLinearGradient(x0 - 24, y0, x0 + w, y0 + h);
  wash.addColorStop(0, 'rgba(127, 178, 255, 0)');
  wash.addColorStop(0.25, 'rgba(127, 178, 255, 0.13)');
  wash.addColorStop(1, 'rgba(90, 140, 220, 0.05)');
  ctx.fillStyle = wash;
  ctx.fillRect(x0 - 24, y0 - 24, w + 24, h + 24);
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#1c242c';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  for (let y = y0 + t(3); y < y0 + h; y += t(3)) {
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + w, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = PALETTE.red;
  ctx.font = 'bold 13px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DETENTION', x0 + w / 2, y0 + h - 10);
  ctx.textAlign = 'start';
  ctx.restore();
}

/** The bar wall separating the block from the hall. Upright, so it's Y-sorted. */
export function jailBarsSortables(): Sortable[] {
  const out: Sortable[] = [];
  const barX = t(JAIL_BAR_X);
  const yTop = t(JAIL.y0 - 1);
  const yBottom = t(JAIL.y1 + 1);

  // The north-south run recedes away from the camera, so it reads as a thin
  // slab with rungs rather than a row of overlapping pickets.
  const segments: [number, number][] = [
    [yTop, t(JAIL_GATE.y0)],
    [t(JAIL_GATE.y1), yBottom],
  ];
  out.push({
    y: yBottom,
    draw: (ctx) => {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#000';
      ctx.fillRect(barX - 1, yTop, 5, yBottom - yTop);
      ctx.globalAlpha = 1;

      for (const [sy0, sy1] of segments) {
        const h = sy1 - sy0;
        ctx.fillStyle = '#1d242b';
        ctx.fillRect(barX - 3, sy0 - BAR_H, 6, h + BAR_H);
        ctx.fillStyle = PALETTE.bar;
        ctx.fillRect(barX - 3, sy0 - BAR_H, 6, 3); // top rail
        ctx.globalAlpha = 0.55;
        for (let y = sy0; y <= sy1; y += 7) ctx.fillRect(barX - 3, y - BAR_H, 6, 1.5);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#6d7883';
        ctx.fillRect(barX - 4, sy0 - BAR_H, 8, 4); // post cap
        ctx.fillRect(barX - 4, sy1 - 4, 8, 5);
      }
    },
  });

  // horizontal run along the bottom of the block
  out.push({
    y: yBottom,
    draw: (ctx) => {
      ctx.fillStyle = PALETTE.bar;
      for (let x = barX; x <= t(JAIL.x1 + 1); x += 8) {
        ctx.fillRect(x, yBottom - BAR_H, 3, BAR_H);
      }
      ctx.fillStyle = '#6d7883';
      ctx.fillRect(barX, yBottom - BAR_H, t(JAIL.x1 + 1) - barX, 4);
    },
  });

  return out;
}
