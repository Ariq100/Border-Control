import { CHARACTER, ENTRY_GATE, ENTRY_OFFICERS, JAIL_GATE, JAIL_OFFICERS, PALETTE, t } from './constants';
import { drawCharacter } from './characters';
import { JAIL_BAR_X } from './constants';
import { drawShadow } from './Tilemap';
import type { Sortable, Vec2 } from './types';

export interface GateState {
  /** 0 = fully closed, 1 = fully open. Gameplay can animate this. */
  entryOpen: number;
  jailOpen: number;
}

export const defaultGateState: GateState = { entryOpen: 0, jailOpen: 0 };

export const entryGateCenter: Vec2 = {
  x: t((ENTRY_GATE.x0 + ENTRY_GATE.x1) / 2 + 0.5),
  y: t(ENTRY_GATE.y),
};

export const jailGateCenter: Vec2 = {
  x: t(JAIL_BAR_X),
  y: t((JAIL_GATE.y0 + JAIL_GATE.y1) / 2),
};

export const officerPositions = {
  entry: ENTRY_OFFICERS.map((p) => ({ x: t(p.x), y: t(p.y) })),
  jail: JAIL_OFFICERS.map((p) => ({ x: t(p.x), y: t(p.y) })),
};

const GATE_H = 54;

/** Entry gate set into the top wall — approved arrivals pass through it. */
export function entryGateSortable(state: GateState): Sortable {
  const x0 = t(ENTRY_GATE.x0);
  const x1 = t(ENTRY_GATE.x1 + 1);
  const y = t(ENTRY_GATE.y);
  const w = x1 - x0;
  const half = w / 2;
  const slide = half * Math.min(1, Math.max(0, state.entryOpen)) * 0.92;

  return {
    y: y + 2,
    draw: (ctx) => {
      // doorway recess
      ctx.fillStyle = '#0c1015';
      ctx.fillRect(x0, y - GATE_H, w, GATE_H);
      ctx.fillStyle = '#101a20';
      ctx.fillRect(x0 + 4, y - GATE_H + 4, w - 8, GATE_H - 4);

      // corridor glow beyond the gate
      const g = ctx.createLinearGradient(0, y - GATE_H, 0, y);
      g.addColorStop(0, 'rgba(95, 224, 208, 0.30)');
      g.addColorStop(1, 'rgba(95, 224, 208, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x0 + 4, y - GATE_H + 4, w - 8, GATE_H - 4);

      // sliding blast doors
      ctx.fillStyle = '#4c5a67';
      ctx.fillRect(x0 + 4, y - GATE_H + 4, half - 4 - slide, GATE_H - 6);
      ctx.fillRect(x0 + half + slide, y - GATE_H + 4, half - 4 - slide, GATE_H - 6);
      ctx.fillStyle = '#5f6f7d';
      ctx.fillRect(x0 + 4, y - GATE_H + 8, half - 4 - slide, 3);
      ctx.fillRect(x0 + half + slide, y - GATE_H + 8, half - 4 - slide, 3);
      ctx.fillStyle = PALETTE.tealDim;
      ctx.fillRect(x0 + half - slide - 3, y - GATE_H + 4, 3, GATE_H - 6);
      ctx.fillRect(x0 + half + slide, y - GATE_H + 4, 3, GATE_H - 6);

      // frame + status lamp
      ctx.fillStyle = PALETTE.wallTrim;
      ctx.fillRect(x0, y - GATE_H, 5, GATE_H);
      ctx.fillRect(x1 - 5, y - GATE_H, 5, GATE_H);
      ctx.fillRect(x0, y - GATE_H - 5, w, 6);
      ctx.fillStyle = state.entryOpen > 0.05 ? PALETTE.teal : PALETTE.red;
      ctx.fillRect(x0 + w / 2 - 4, y - GATE_H - 4, 8, 3);

      ctx.fillStyle = PALETTE.teal;
      ctx.globalAlpha = 0.75;
      ctx.font = 'bold 9px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ENTRY', x0 + w / 2, y - GATE_H - 9);
      ctx.textAlign = 'start';
      ctx.globalAlpha = 1;
    },
  };
}

/** Barred gate into the detention block. */
export function jailGateSortable(state: GateState): Sortable {
  const x = t(JAIL_BAR_X);
  const y0 = t(JAIL_GATE.y0);
  const y1 = t(JAIL_GATE.y1);
  const h = y1 - y0;
  const swing = Math.min(1, Math.max(0, state.jailOpen));

  return {
    y: y1,
    draw: (ctx) => {
      const GATE_BAR_H = 34;
      // hinged at the top post, swings out into the hall
      ctx.save();
      ctx.translate(x, y0);
      ctx.rotate(swing * 0.75);
      ctx.fillStyle = '#1d242b';
      ctx.fillRect(-3, -GATE_BAR_H, 6, h + GATE_BAR_H);
      ctx.fillStyle = PALETTE.bar;
      ctx.fillRect(-3, -GATE_BAR_H, 6, 3);
      ctx.globalAlpha = 0.55;
      for (let yy = 0; yy <= h; yy += 7) ctx.fillRect(-3, yy - GATE_BAR_H, 6, 1.5);
      ctx.globalAlpha = 1;
      ctx.fillStyle = PALETTE.amberDim;
      ctx.fillRect(-4, h - 14 - GATE_BAR_H, 8, 4); // latch bar
      ctx.restore();

      ctx.fillStyle = '#68727d';
      ctx.fillRect(x - 4, y0 - GATE_BAR_H - 4, 8, 5);
      ctx.fillStyle = swing > 0.05 ? PALETTE.amber : PALETTE.red;
      ctx.fillRect(x - 3, y0 - GATE_BAR_H - 8, 6, 3);
    },
  };
}

/** Officers standing post at both gates. */
export function officerSortables(frame: number): Sortable[] {
  const posts = [
    ...officerPositions.entry.map((p) => ({ p, facing: 'down' as const })),
    ...officerPositions.jail.map((p) => ({ p, facing: 'left' as const })),
  ];
  return posts.map(({ p, facing }, i) => ({
    y: p.y,
    draw: (ctx: CanvasRenderingContext2D) => {
      drawShadow(ctx, p.x, p.y, 8);
      // guards shift their weight rather than walking on the spot
      const idle = Math.floor(frame / 3 + i) % 2 === 0 ? 0 : 1;
      drawCharacter(ctx, p.x, p.y, {
        asset: 'police',
        role: 'police',
        height: CHARACTER.policeHeight,
        frame: idle,
        facing,
      });
    },
  }));
}
