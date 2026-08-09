import { PALETTE, t } from './constants';
import { drawShadow } from './Tilemap';
import type { Sortable } from './types';

type PropKind = 'crate' | 'bench' | 'kiosk' | 'pipe';

interface Prop {
  kind: PropKind;
  x: number;
  y: number;
  w?: number;
  tone?: string;
}

/** Dressing for the hall. Purely visual — nothing here blocks or reacts. */
const PROPS: Prop[] = [
  { kind: 'crate', x: 2.4, y: 26.4, tone: '#5b6470' },
  { kind: 'crate', x: 3.6, y: 26.9, tone: '#6a5a45' },
  { kind: 'crate', x: 3.0, y: 25.4, tone: '#4f5b66' },
  { kind: 'crate', x: 31.6, y: 26.6, tone: '#5b6470' },
  { kind: 'crate', x: 32.9, y: 27.1, tone: '#4a5560' },
  { kind: 'crate', x: 24.6, y: 6.6, tone: '#4f5b66' },
  { kind: 'bench', x: 24.5, y: 19, w: 3 },
  { kind: 'bench', x: 24.5, y: 22.5, w: 3 },
  { kind: 'bench', x: 30.5, y: 19, w: 3 },
  { kind: 'kiosk', x: 22.6, y: 16 },
  { kind: 'kiosk', x: 30.6, y: 22.6 },
  { kind: 'pipe', x: 1.6, y: 12 },
  { kind: 'pipe', x: 1.6, y: 18 },
];

export function propSortables(): Sortable[] {
  return PROPS.map((p) => {
    const x = t(p.x);
    const y = t(p.y);
    return {
      y,
      draw: (ctx: CanvasRenderingContext2D) => {
        switch (p.kind) {
          case 'crate':
            drawShadow(ctx, x, y, 14);
            drawCrate(ctx, x, y, p.tone ?? '#5b6470');
            break;
          case 'bench':
            drawShadow(ctx, x, y, t((p.w ?? 3) / 2));
            drawBench(ctx, x, y, t(p.w ?? 3));
            break;
          case 'kiosk':
            drawShadow(ctx, x, y, 9);
            drawKiosk(ctx, x, y);
            break;
          case 'pipe':
            drawPipe(ctx, x, y);
            break;
        }
      },
    };
  });
}

function drawCrate(ctx: CanvasRenderingContext2D, x: number, y: number, tone: string) {
  const w = 28;
  const h = 24;
  ctx.fillStyle = tone;
  ctx.fillRect(x - w / 2, y - h - 8, w, h); // front face
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(x - w / 2, y - h - 8, w, 8); // lid seen from above
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(x - w / 2, y - 12, w, 4);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2 + 0.5, y - h - 7.5, w - 1, h - 1);
  ctx.fillStyle = PALETTE.amber;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(x - 7, y - h + 2, 14, 3);
  ctx.globalAlpha = 1;
}

function drawBench(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.fillStyle = '#3a444e';
  ctx.fillRect(x - w / 2, y - 16, w, 10); // seat
  ctx.fillStyle = '#4c5865';
  ctx.fillRect(x - w / 2, y - 18, w, 3);
  ctx.fillStyle = '#2b333b';
  ctx.fillRect(x - w / 2 + 4, y - 7, 4, 7);
  ctx.fillRect(x + w / 2 - 8, y - 7, 4, 7);
}

function drawKiosk(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#242c33';
  ctx.fillRect(x - 9, y - 42, 18, 42);
  ctx.fillStyle = '#38434d';
  ctx.fillRect(x - 9, y - 42, 18, 4);
  ctx.fillStyle = PALETTE.teal;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(x - 6, y - 38, 12, 16);
  ctx.globalAlpha = 1;
  ctx.fillStyle = PALETTE.tealDim;
  ctx.fillRect(x - 6, y - 18, 12, 2);
}

function drawPipe(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#3d4750';
  ctx.fillRect(x - 5, y - 96, 10, 96);
  ctx.fillStyle = '#4e5a65';
  ctx.fillRect(x - 5, y - 96, 3, 96);
  ctx.fillStyle = '#2b333b';
  for (let i = 0; i < 4; i++) ctx.fillRect(x - 7, y - 88 + i * 24, 14, 5);
}
