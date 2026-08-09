import { useEffect, useRef } from 'react';
import { ActorSystem } from './ActorSystem';
import { Camera } from './Camera';
import { CHARACTER, PALETTE, ZOOM } from './constants';
import { deskSortable, drawDeskSign, playerAnchor } from './Desk';
import {
  defaultGateState,
  entryGateSortable,
  jailGateSortable,
  officerSortables,
  type GateState,
} from './Gates';
import { drawJailFloor, jailBarsSortables } from './JailArea';
import { propSortables } from './Props';
import { buildQueueLane, drawBelts, poleSortables } from './QueueLane';
import { SpaceBackdrop } from './SpaceBackdrop';
import { drawShadow, drawTilemap } from './Tilemap';
import { drawCharacter, preloadCharacterImages } from './characters';
import type { EnvironmentState, Sortable } from './types';
import type { EnvEvent } from './ActorSystem';

export interface RendererProps {
  /** Live gameplay state. Read every frame, never mutated here. */
  state: EnvironmentState;
  /** Optional hook called once per frame after the environment updates. */
  onFrame?: (dt: number) => void;
  /** Fired when an NPC finishes a walk: reached the desk, the gate, or the jail. */
  onEvent?: (event: EnvEvent) => void;
  /** Fired when the player clicks/taps a character on the floor. */
  onNpcClick?: (id: string) => void;
  zoom?: number;
}

export function Renderer({ state, onFrame, onEvent, onNpcClick, zoom = ZOOM }: RendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  const frameRef = useRef<((dt: number) => void) | undefined>(undefined);
  const eventRef = useRef<((event: EnvEvent) => void) | undefined>(undefined);
  const clickRef = useRef<((id: string) => void) | undefined>(undefined);
  stateRef.current = state;
  frameRef.current = onFrame;
  eventRef.current = onEvent;
  clickRef.current = onNpcClick;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    preloadCharacterImages();

    const queue = buildQueueLane();
    const poles = poleSortables(queue);
    const props = propSortables();
    const bars = jailBarsSortables();
    const desk = deskSortable();
    const actors = new ActorSystem();
    actors.setListener((event) => eventRef.current?.(event));
    const backdrop = new SpaceBackdrop();
    const camera = new Camera({ x: playerAnchor.x, y: playerAnchor.y + 120 }, zoom);
    const gates: GateState = { ...defaultGateState };

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      camera.resize(rect.width, rect.height);
      camera.clamp();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // pointer picking: nearest character whose billboard box contains the tap
    const onPointerDown = (e: PointerEvent) => {
      if (!clickRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const world = camera.screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      let best: { id: string; d: number } | null = null;
      for (const a of actors.positions()) {
        const halfW = a.height * 0.4;
        if (
          world.x >= a.pos.x - halfW &&
          world.x <= a.pos.x + halfW &&
          world.y >= a.pos.y - a.height &&
          world.y <= a.pos.y + 6
        ) {
          const d = Math.hypot(world.x - a.pos.x, world.y - a.pos.y);
          if (!best || d < best.d) best = { id: a.id, d };
        }
      }
      if (best) clickRef.current(best.id);
    };
    canvas.addEventListener('pointerdown', onPointerDown);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      elapsed += dt;

      const env = stateRef.current;
      backdrop.update(dt);
      actors.update(dt, env.npcs, queue);

      // doors ease open only while someone is actually walking through
      const entryTarget = actors.isAnyoneAtEntryGate() ? 1 : 0;
      const jailTarget = actors.isAnyoneAtJailGate() ? 1 : 0;
      gates.entryOpen += (entryTarget - gates.entryOpen) * Math.min(1, dt * 4);
      gates.jailOpen += (jailTarget - gates.jailOpen) * Math.min(1, dt * 4);

      camera.follow({ x: playerAnchor.x, y: playerAnchor.y + 130 }, dt);
      frameRef.current?.(dt);

      // ---- draw ----
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // draw side starfields in screen space to mask black borders
      backdrop.drawSides(ctx, camera);

      camera.apply(ctx, dpr);
      const view = camera.visibleRect();

      // 1. exterior seen through the viewports
      backdrop.draw(ctx, camera.x);
      backdrop.drawViewportFrame(ctx);

      // 2. flat floor grid + painted deck detail
      drawTilemap(ctx, view);
      drawJailFloor(ctx);
      drawBelts(ctx, queue);

      // 3. everything with height, sorted back-to-front by base Y
      const sortables: Sortable[] = [
        ...poles,
        ...props,
        ...bars,
        desk,
        entryGateSortable(gates),
        jailGateSortable(gates),
        ...officerSortables(Math.floor(elapsed * 2)),
        ...actors.sortables(),
        playerSortable(elapsed),
      ];
      sortables.sort((a, b) => a.y - b.y);
      for (const s of sortables) s.draw(ctx);

      // 4. signage hangs above the crowd
      drawDeskSign(ctx);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [zoom]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        imageRendering: 'pixelated',
        background: '#05070d',
        touchAction: 'none',
        cursor: onNpcClick ? 'pointer' : 'default',
      }}
    />
  );
}

/** The player: larger than the queued arrivals, planted behind the desk. */
function playerSortable(elapsed: number): Sortable {
  return {
    y: playerAnchor.y,
    draw: (ctx: CanvasRenderingContext2D) => {
      drawShadow(ctx, playerAnchor.x, playerAnchor.y, 10);
      const breathe = Math.floor(elapsed * 1.6) % 2;
      drawCharacter(ctx, playerAnchor.x, playerAnchor.y, {
        asset: 'player',
        role: 'player',
        height: CHARACTER.playerHeight,
        frame: breathe,
        facing: 'down',
      });
      // rank flash on the desk edge in front of the player
      ctx.fillStyle = PALETTE.amber;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(playerAnchor.x - 5, playerAnchor.y - CHARACTER.playerHeight - 6, 10, 2);
      ctx.globalAlpha = 1;
    },
  };
}
