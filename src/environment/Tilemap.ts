import {
  ENTRANCE_GAP,
  FLOOR_ROW0,
  JAIL,
  MAP_COLS,
  MAP_H,
  MAP_ROWS,
  MAP_W,
  PALETTE,
  TILE,
  WALL_ROW,
  t,
} from './constants';

export type TileKind = 'floor' | 'jailFloor' | 'wall' | 'void';

/** Static tile classification for the arrivals hall. */
export function tileAt(col: number, row: number): TileKind {
  if (row < WALL_ROW) return 'void'; // exterior viewport band
  if (row === WALL_ROW) return 'wall';
  if (col === 0 || col === MAP_COLS - 1) return 'wall';
  if (row === MAP_ROWS - 1) {
    return col >= ENTRANCE_GAP.x0 && col <= ENTRANCE_GAP.x1 ? 'floor' : 'wall';
  }
  if (col >= JAIL.x0 - 1 && col <= JAIL.x1 + 1 && row >= JAIL.y0 - 1 && row <= JAIL.y1 + 1) {
    return 'jailFloor';
  }
  return 'floor';
}

function panelTile(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  base: string,
  alt: string,
) {
  const x = t(col);
  const y = t(row);
  ctx.fillStyle = (col + row) % 2 === 0 ? base : alt;
  ctx.fillRect(x, y, TILE, TILE);

  // recessed seam
  ctx.fillStyle = PALETTE.floorSeam;
  ctx.fillRect(x, y, TILE, 1);
  ctx.fillRect(x, y, 1, TILE);

  // rivets on every third panel, keeps the grid from looking printed
  if ((col * 7 + row * 3) % 6 === 0) {
    ctx.fillStyle = PALETTE.floorRivet;
    ctx.fillRect(x + 5, y + 5, 2, 2);
    ctx.fillRect(x + TILE - 7, y + TILE - 7, 2, 2);
  }
}

/** Floor + walls. Only draws tiles inside the visible rect. */
export function drawTilemap(
  ctx: CanvasRenderingContext2D,
  view: { x0: number; y0: number; x1: number; y1: number },
) {
  const c0 = Math.max(0, Math.floor(view.x0 / TILE));
  const c1 = Math.min(MAP_COLS - 1, Math.ceil(view.x1 / TILE));
  const r0 = Math.max(0, Math.floor(view.y0 / TILE));
  const r1 = Math.min(MAP_ROWS - 1, Math.ceil(view.y1 / TILE));

  for (let row = r0; row <= r1; row++) {
    for (let col = c0; col <= c1; col++) {
      const kind = tileAt(col, row);
      if (kind === 'void') continue;
      if (kind === 'floor') panelTile(ctx, col, row, PALETTE.floorA, PALETTE.floorB);
      else if (kind === 'jailFloor') panelTile(ctx, col, row, '#333d47', '#2d363f');
      else drawWallTile(ctx, col, row);
    }
  }

  drawFloorMarkings(ctx);
  drawLighting(ctx);
}

function drawWallTile(ctx: CanvasRenderingContext2D, col: number, row: number) {
  const x = t(col);
  const y = t(row);
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = PALETTE.wallFace;
  ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 10);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(x, y + TILE - 6, TILE, 2);
}

/** Painted deck markings: hazard strip at the entrance, lane arrows, jail hatching. */
function drawFloorMarkings(ctx: CanvasRenderingContext2D) {
  // hazard chevrons across the arrivals corridor
  ctx.save();
  ctx.beginPath();
  ctx.rect(t(ENTRANCE_GAP.x0), MAP_H - t(2), t(ENTRANCE_GAP.x1 - ENTRANCE_GAP.x0 + 1), t(2));
  ctx.clip();
  ctx.globalAlpha = 0.5;
  for (let x = t(ENTRANCE_GAP.x0) - 40; x < t(ENTRANCE_GAP.x1 + 1) + 40; x += 24) {
    ctx.fillStyle = PALETTE.amber;
    ctx.beginPath();
    ctx.moveTo(x, MAP_H);
    ctx.lineTo(x + 12, MAP_H);
    ctx.lineTo(x + 12 + 20, MAP_H - t(2));
    ctx.lineTo(x + 20, MAP_H - t(2));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  // deck label near the desk
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = PALETTE.teal;
  ctx.font = 'bold 18px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SECTOR 7 · ARRIVALS', t(2), t(7.6));
  ctx.globalAlpha = 1;
  ctx.textAlign = 'start';
}

/** Warm pool over the desk, cold wash over the detention block. */
function drawLighting(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const warm = ctx.createRadialGradient(t(13.5), t(10), 20, t(13.5), t(10), t(9));
  warm.addColorStop(0, 'rgba(255, 186, 92, 0.20)');
  warm.addColorStop(1, 'rgba(255, 186, 92, 0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, t(FLOOR_ROW0), MAP_W, MAP_H);

  const entry = ctx.createRadialGradient(t(5), t(6), 10, t(5), t(6), t(6));
  entry.addColorStop(0, 'rgba(120, 255, 226, 0.14)');
  entry.addColorStop(1, 'rgba(120, 255, 226, 0)');
  ctx.fillStyle = entry;
  ctx.fillRect(0, t(FLOOR_ROW0), MAP_W, MAP_H);

  const cold = ctx.createRadialGradient(t(30), t(10), 20, t(30), t(10), t(11));
  cold.addColorStop(0, 'rgba(96, 156, 255, 0.16)');
  cold.addColorStop(1, 'rgba(96, 156, 255, 0)');
  ctx.fillStyle = cold;
  ctx.fillRect(0, t(FLOOR_ROW0), MAP_W, MAP_H);

  ctx.restore();

  // vignette towards the back of the hall
  ctx.save();
  const v = ctx.createLinearGradient(0, MAP_H, 0, MAP_H - t(8));
  v.addColorStop(0, 'rgba(0,0,0,0.45)');
  v.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = v;
  ctx.fillRect(0, MAP_H - t(8), MAP_W, t(8));
  ctx.restore();
}

/** Soft contact shadow used by every standing sprite. */
export function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number) {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, rx * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
