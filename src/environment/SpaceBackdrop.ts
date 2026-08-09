import { MAP_W, PALETTE, TILE, WINDOW_BAND, t } from './constants';
import type { Camera } from './Camera';

interface Star {
  x: number;
  y: number;
  r: number;
  b: number;
  depth: number; // 0.2 far .. 1 near, drives parallax
  tw: number; // twinkle phase
}

interface DistantShip {
  x: number;
  y: number;
  scale: number;
  vx: number;
  vy: number;
  hull: string;
  life: number;
}

const BAND_Y0 = t(WINDOW_BAND.row0);
const BAND_Y1 = t(WINDOW_BAND.row1);
const BAND_H = BAND_Y1 - BAND_Y0;

/**
 * The exterior layer: deep space seen through the arrivals hall viewports.
 * Purely ambient — nothing here is interactive.
 */
export class SpaceBackdrop {
  private stars: Star[] = [];
  private ships: DistantShip[] = [];
  private nextShipIn = 3;
  private time = 0;

  constructor(seed = 7, starCount = 220) {
    let s = seed;
    const rnd = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    for (let i = 0; i < starCount; i++) {
      const depth = 0.2 + rnd() * 0.8;
      this.stars.push({
        x: rnd() * MAP_W * 1.4,
        y: BAND_Y0 + rnd() * BAND_H,
        r: depth > 0.8 ? 1.4 : depth > 0.5 ? 1 : 0.7,
        b: 0.35 + depth * 0.65,
        depth,
        tw: rnd() * Math.PI * 2,
      });
    }
  }

  update(dt: number) {
    this.time += dt;
    this.nextShipIn -= dt;
    if (this.nextShipIn <= 0 && this.ships.length < 3) {
      this.spawnShip();
      this.nextShipIn = 9 + Math.random() * 16;
    }
    for (const ship of this.ships) {
      ship.x += ship.vx * dt;
      ship.y += ship.vy * dt;
      ship.scale += dt * 0.02 * ship.scale; // grows slightly as it approaches
      ship.life += dt;
    }
    this.ships = this.ships.filter(
      (s) => s.life < 90 && s.x > -80 && s.x < MAP_W + 80 && s.scale < 3.2,
    );
  }

  private spawnShip() {
    const fromLeft = Math.random() < 0.5;
    const hulls = ['#9aa7b4', '#b3a08c', '#8fa8b8'];
    this.ships.push({
      x: fromLeft ? -40 : MAP_W + 40,
      y: BAND_Y0 + 18 + Math.random() * (BAND_H - 40),
      scale: 0.35 + Math.random() * 0.3,
      vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 5),
      vy: (Math.random() - 0.5) * 1.2,
      hull: hulls[Math.floor(Math.random() * hulls.length)],
      life: 0,
    });
  }

  /**
   * Draws space, clipped to the viewport band. Call before the interior floor.
   * camX is used for a light parallax so the void feels far away.
   */
  draw(ctx: CanvasRenderingContext2D, camX: number) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, BAND_Y0, MAP_W, BAND_H);
    ctx.clip();

    // void
    const g = ctx.createLinearGradient(0, BAND_Y0, 0, BAND_Y1);
    g.addColorStop(0, '#05070d');
    g.addColorStop(1, '#0a1018');
    ctx.fillStyle = g;
    ctx.fillRect(0, BAND_Y0, MAP_W, BAND_H);

    // a faint nebula wash so the band isn't flat black
    ctx.globalAlpha = 0.16;
    const n = ctx.createRadialGradient(t(9), BAND_Y0 + 40, 4, t(9), BAND_Y0 + 40, 220);
    n.addColorStop(0, '#3a6ea8');
    n.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = n;
    ctx.fillRect(0, BAND_Y0, MAP_W, BAND_H);
    ctx.globalAlpha = 1;

    for (const st of this.stars) {
      const px = ((st.x - camX * st.depth * 0.12) % (MAP_W * 1.4) + MAP_W * 1.4) % (MAP_W * 1.4);
      const twinkle = 0.75 + 0.25 * Math.sin(this.time * 1.6 + st.tw);
      ctx.globalAlpha = st.b * twinkle;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(px), Math.round(st.y), st.r * 2, st.r * 2);
    }
    ctx.globalAlpha = 1;

    for (const ship of this.ships) this.drawShip(ctx, ship);
    ctx.restore();
  }

  /**
   * Draw additional starfield across the full canvas width on the left/right
   * margins (screen-space). Called before the camera transform so it covers
   * any background areas outside the main MAP_W viewport.
   */
  drawSides(ctx: CanvasRenderingContext2D, camera: Camera) {
    const canvasW = ctx.canvas.width;
    const canvasH = ctx.canvas.height;
    // device pixel ratio used by the renderer: canvas.width = viewW * dpr
    const dpr = canvasW / camera.viewW;

    // compute the map display rectangle in canvas pixels
    const centerPx = (camera.viewW / 2) * dpr;
    const mapPxW = MAP_W * camera.zoom * dpr;
    const leftPx = Math.max(0, Math.floor(centerPx - mapPxW / 2));
    const rightPx = Math.min(canvasW, Math.ceil(centerPx + mapPxW / 2));

    // band vertical position in screen (CSS) pixels, convert to device pixels
    const bandTopCss = camera.worldToScreen({ x: 0, y: BAND_Y0 }).y;
    const bandTop = Math.floor(bandTopCss * dpr);
    const bandH = Math.ceil(BAND_H * camera.zoom * dpr);

    const drawBand = (x0: number, w: number) => {
      if (w <= 0) return;
      // void gradient
      const g = ctx.createLinearGradient(x0, bandTop, x0, bandTop + bandH);
      g.addColorStop(0, '#05070d');
      g.addColorStop(1, '#0a1018');
      ctx.fillStyle = g;
      ctx.fillRect(x0, bandTop, w, bandH);

      // faint nebula wash
      ctx.globalAlpha = 0.12;
      const n = ctx.createRadialGradient(x0 + w * 0.25, bandTop + 40, 4, x0 + w * 0.25, bandTop + 40, 220);
      n.addColorStop(0, '#183f6d');
      n.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = n;
      ctx.fillRect(x0, bandTop, w, bandH);
      ctx.globalAlpha = 1;

      // a light starfield — quick procedural dots to mask the black edges
      const starCount = Math.max(30, Math.floor((w / 120) * 40));
      for (let i = 0; i < starCount; i++) {
        const sx = x0 + Math.random() * w;
        const sy = bandTop + Math.random() * bandH;
        const r = Math.random() < 0.07 ? 1.6 : Math.random() < 0.25 ? 1.2 : 0.8;
        const a = 0.35 + Math.random() * 0.65;
        ctx.globalAlpha = a;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(sx), Math.round(sy), r, r);
      }
      ctx.globalAlpha = 1;
    };

    // left margin
    drawBand(0, leftPx);
    // right margin
    drawBand(rightPx, canvasW - rightPx);
  }

  private drawShip(ctx: CanvasRenderingContext2D, s: DistantShip) {
    const w = 22 * s.scale;
    const h = 7 * s.scale;
    const x = Math.round(s.x);
    const y = Math.round(s.y);
    ctx.fillStyle = s.hull;
    ctx.fillRect(x, y, w, h);
    ctx.fillRect(x + w * 0.2, y - h * 0.6, w * 0.45, h * 0.6);
    ctx.fillStyle = PALETTE.glass;
    ctx.fillRect(x + w * 0.62, y + h * 0.25, w * 0.2, h * 0.3);
    // engine glow, trailing behind the direction of travel
    ctx.fillStyle = s.vx > 0 ? PALETTE.teal : PALETTE.amber;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(s.vx > 0 ? x - h * 0.5 : x + w, y + h * 0.3, h * 0.5, h * 0.4);
    ctx.globalAlpha = 1;
  }

  /** Window mullions + frame drawn over the starfield so it reads as glass. */
  drawViewportFrame(ctx: CanvasRenderingContext2D) {
    // glass sheen
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = PALETTE.glass;
    ctx.fillRect(0, BAND_Y0, MAP_W, BAND_H);
    ctx.globalAlpha = 1;

    ctx.fillStyle = PALETTE.frame;
    for (let x = 0; x <= MAP_W; x += TILE * 4) ctx.fillRect(x - 3, BAND_Y0, 6, BAND_H);
    ctx.fillRect(0, BAND_Y0, MAP_W, 5); // top rail
    ctx.fillStyle = PALETTE.wallTrim;
    ctx.fillRect(0, BAND_Y1 - 6, MAP_W, 6); // sill
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = PALETTE.glass;
    ctx.fillRect(0, BAND_Y1 - 8, MAP_W, 2);
    ctx.globalAlpha = 1;
  }
}
