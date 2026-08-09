import { PALETTE, QUEUE, t } from './constants';
import type { Sortable, Vec2 } from './types';

export interface Belt {
  a: Vec2;
  b: Vec2;
}

export interface QueueLaneLayout {
  /** World positions. Index 0 is the front of the line, at the desk. */
  slots: Vec2[];
  poles: Vec2[];
  belts: Belt[];
  entrance: Vec2;
}

const POLE_H = 26;
const POLE_R = 4;

/**
 * Builds an airport-style serpentine: horizontal lanes with alternating
 * direction, divider belts between them, and a turn gap at alternating ends.
 */
export function buildQueueLane(cfg = QUEUE): QueueLaneLayout {
  const { xMin, xMax, laneRows, spacing, lastLaneEndX, deskFront, entrance } = cfg;
  const slots: Vec2[] = [];

  laneRows.forEach((row, i) => {
    const rightToLeft = i % 2 === 0; // first lane (from entrance) runs right -> left
    const from = rightToLeft ? xMax : xMin;
    const isLast = i === laneRows.length - 1;
    const to = isLast ? lastLaneEndX : rightToLeft ? xMin : xMax;
    const step = rightToLeft ? -spacing : spacing;
    for (let x = from; rightToLeft ? x >= to - 0.001 : x <= to + 0.001; x += step) {
      slots.push({ x: t(x), y: t(row) });
    }
  });

  slots.push({ x: t(deskFront.x), y: t(deskFront.y) });
  slots.reverse(); // front of the line first

  const belts: Belt[] = [];
  const gap = 1.6; // tiles of clearance at each turn

  // dividers between consecutive lanes
  for (let i = 0; i < laneRows.length - 1; i++) {
    const row = (laneRows[i] + laneRows[i + 1]) / 2;
    const turnLeft = i % 2 === 0; // lane i ended on the left, so leave the left open
    const a = turnLeft ? xMin + gap : xMin - 0.5;
    const b = turnLeft ? xMax + 0.5 : xMax - gap;
    belts.push({ a: { x: t(a), y: t(row) }, b: { x: t(b), y: t(row) } });
  }

  // outer rails
  const bottomRow = laneRows[0] + 1.5;
  const topRow = laneRows[laneRows.length - 1] - 1.5;
  belts.push({ a: { x: t(xMin - 0.5), y: t(bottomRow) }, b: { x: t(xMax - gap), y: t(bottomRow) } });
  belts.push({
    a: { x: t(xMin - 0.5), y: t(topRow) },
    b: { x: t(lastLaneEndX + 0.5), y: t(topRow) },
  });
  belts.push({ a: { x: t(xMin - 0.5), y: t(topRow) }, b: { x: t(xMin - 0.5), y: t(bottomRow) } });
  belts.push({
    a: { x: t(xMax + 0.5), y: t(laneRows[laneRows.length - 2] ?? topRow) },
    b: { x: t(xMax + 0.5), y: t(bottomRow) },
  });

  // poles at every belt end plus regular intervals along each run
  const poles: Vec2[] = [];
  const seen = new Set<string>();
  const addPole = (p: Vec2) => {
    const key = `${Math.round(p.x)}:${Math.round(p.y)}`;
    if (seen.has(key)) return;
    seen.add(key);
    poles.push(p);
  };
  for (const belt of belts) {
    addPole(belt.a);
    addPole(belt.b);
    const len = Math.hypot(belt.b.x - belt.a.x, belt.b.y - belt.a.y);
    const steps = Math.max(1, Math.round(len / (t(3))));
    for (let s = 1; s < steps; s++) {
      addPole({
        x: belt.a.x + ((belt.b.x - belt.a.x) * s) / steps,
        y: belt.a.y + ((belt.b.y - belt.a.y) * s) / steps,
      });
    }
  }

  return { slots, poles, belts, entrance: { x: t(entrance.x), y: t(entrance.y) } };
}

/** Belts sit low, so they're drawn on the floor layer rather than Y-sorted. */
export function drawBelts(ctx: CanvasRenderingContext2D, layout: QueueLaneLayout) {
  ctx.save();
  ctx.lineCap = 'round';
  for (const belt of layout.belts) {
    // slack shadow
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(belt.a.x, belt.a.y + 2);
    ctx.lineTo(belt.b.x, belt.b.y + 2);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = PALETTE.amberDim;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(belt.a.x, belt.a.y - POLE_H * 0.55);
    ctx.lineTo(belt.b.x, belt.b.y - POLE_H * 0.55);
    ctx.stroke();

    ctx.strokeStyle = PALETTE.amber;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(belt.a.x, belt.a.y - POLE_H * 0.55 - 1);
    ctx.lineTo(belt.b.x, belt.b.y - POLE_H * 0.55 - 1);
    ctx.stroke();
  }
  ctx.restore();
}

/** Poles are upright objects, so they're Y-sorted with the characters. */
export function poleSortables(layout: QueueLaneLayout): Sortable[] {
  return layout.poles.map((p) => ({
    y: p.y,
    draw: (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, POLE_R + 2, (POLE_R + 2) * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // weighted base
      ctx.fillStyle = '#2f363d';
      ctx.fillRect(p.x - POLE_R - 1, p.y - 4, POLE_R * 2 + 2, 5);
      // post
      ctx.fillStyle = '#6d7a86';
      ctx.fillRect(p.x - 1.5, p.y - POLE_H, 3, POLE_H - 2);
      ctx.fillStyle = '#98a6b3';
      ctx.fillRect(p.x - 1.5, p.y - POLE_H, 1, POLE_H - 2);
      // head
      ctx.fillStyle = '#aab7c3';
      ctx.fillRect(p.x - 3, p.y - POLE_H - 3, 6, 4);
    },
  }));
}
