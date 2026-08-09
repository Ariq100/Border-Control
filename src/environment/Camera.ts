import { MAP_H, MAP_W, ZOOM } from './constants';
import type { Vec2 } from './types';

/**
 * Viewport for the interior scene. Holds a centre point in world pixels and
 * converts to screen space. Clamps so the hall never scrolls past its walls.
 */
export class Camera {
  x: number;
  y: number;
  zoom: number;
  viewW = 0;
  viewH = 0;

  constructor(center: Vec2, zoom = ZOOM) {
    this.x = center.x;
    this.y = center.y;
    this.zoom = zoom;
  }

  resize(w: number, h: number) {
    this.viewW = w;
    this.viewH = h;
    // Set zoom so the map width exactly matches the view width (left/right
    // edges touch the screen). This zoom may crop vertically; we'll position
    // the camera so the top of the map touches the top of the screen.
    const targetZoom = Math.max(0.1, w / MAP_W);
    this.zoom = targetZoom;

    // Center X stays at map center so left/right align.
    this.x = MAP_W / 2;
    // Set camera Y so the top of the map aligns with the top of the view:
    // world y=0 -> screen y=0 => (0 - y)*zoom + viewH/2 = 0 => y = viewH/(2*zoom)
    this.y = this.viewH / (2 * this.zoom);
  }

  /** Ease towards a world point. dt in seconds. */
  follow(target: Vec2, dt: number, stiffness = 6) {
    const k = 1 - Math.exp(-stiffness * dt);
    this.x += (target.x - this.x) * k;
    this.y += (target.y - this.y) * k;
    this.clamp();
  }

  snapTo(target: Vec2) {
    this.x = target.x;
    this.y = target.y;
    this.clamp();
  }

  clamp() {
    const halfW = this.viewW / (2 * this.zoom);
    const halfH = this.viewH / (2 * this.zoom);
    this.x = halfW * 2 >= MAP_W ? MAP_W / 2 : Math.min(Math.max(this.x, halfW), MAP_W - halfW);
    this.y = halfH * 2 >= MAP_H ? MAP_H / 2 : Math.min(Math.max(this.y, halfH), MAP_H - halfH);
  }

  /** Apply the camera transform to a context that has already been reset. */
  apply(ctx: CanvasRenderingContext2D, dpr = 1) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(this.viewW / 2, this.viewH / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  /** Visible world rectangle, padded a little so tiles don't pop at the edges. */
  visibleRect(pad = 64) {
    const halfW = this.viewW / (2 * this.zoom);
    const halfH = this.viewH / (2 * this.zoom);
    return {
      x0: this.x - halfW - pad,
      y0: this.y - halfH - pad,
      x1: this.x + halfW + pad,
      y1: this.y + halfH + pad,
    };
  }

  worldToScreen(p: Vec2): Vec2 {
    return {
      x: (p.x - this.x) * this.zoom + this.viewW / 2,
      y: (p.y - this.y) * this.zoom + this.viewH / 2,
    };
  }

  screenToWorld(p: Vec2): Vec2 {
    return {
      x: (p.x - this.viewW / 2) / this.zoom + this.x,
      y: (p.y - this.viewH / 2) / this.zoom + this.y,
    };
  }
}
