import { CHARACTER } from './constants';
import { drawCharacter } from './characters';
import { drawShadow } from './Tilemap';
import { officerPostForEscort, pathToEntryGate, pathToJail } from './paths';
import { jailCells } from './JailArea';
import type { QueueLaneLayout } from './QueueLane';
import type { EnvNpc, Facing, Sortable, Species, Vec2 } from './types';

type Mode = 'queued' | 'approved' | 'detained' | 'done';

/** Events the gameplay layer listens for. Purely "the animation finished". */
export type EnvEvent =
  | { type: 'reachedDesk'; id: string }
  | { type: 'exitedThroughGate'; id: string }
  | { type: 'reachedJail'; id: string };

export type EnvEventListener = (event: EnvEvent) => void;

interface Actor {
  id: string;
  species: Species;
  variant: number;
  pos: Vec2;
  path: Vec2[];
  mode: Mode;
  facing: Facing;
  walkTime: number;
  moving: boolean;
  escort?: { pos: Vec2; path: Vec2[]; returning: boolean };
  fade: number;
  slot: number;
  announcedDesk: boolean;
  announcedEnd: boolean;
}

const ARRIVE_EPS = 1.2;

function stepTowards(pos: Vec2, target: Vec2, dist: number): boolean {
  const dx = target.x - pos.x;
  const dy = target.y - pos.y;
  const len = Math.hypot(dx, dy);
  if (len <= dist || len < 0.001) {
    pos.x = target.x;
    pos.y = target.y;
    return true;
  }
  pos.x += (dx / len) * dist;
  pos.y += (dy / len) * dist;
  return false;
}

function facingFrom(from: Vec2, to: Vec2, fallback: Facing): Facing {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return fallback;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

/**
 * Owns only presentation state: where each NPC currently *is* on the floor and
 * how it's animating. Gameplay decides approve/reject; this walks them there.
 */
export class ActorSystem {
  private actors = new Map<string, Actor>();
  private detainedCount = 0;
  private listener?: EnvEventListener;

  /** Gameplay subscribes here instead of polling. */
  setListener(listener?: EnvEventListener) {
    this.listener = listener;
  }

  private emit(event: EnvEvent) {
    this.listener?.(event);
  }

  private jailEscortStart(): Vec2 {
    const cell = jailCells[0];
    return { x: cell.x - 4, y: cell.y };
  }

  /** Current floor position of every live actor, for pointer hit-testing. */
  positions(): { id: string; pos: Vec2; height: number }[] {
    const out: { id: string; pos: Vec2; height: number }[] = [];
    for (const a of this.actors.values()) {
      if (a.mode === 'done') continue;
      out.push({ id: a.id, pos: { ...a.pos }, height: CHARACTER.npcHeight });
    }
    return out;
  }

  /** Reconcile against the gameplay-owned NPC list, then advance animation. */
  update(dt: number, npcs: EnvNpc[], queue: QueueLaneLayout) {
    const live = new Set<string>();

    for (const npc of npcs) {
      if (npc.activity.kind === 'gone') continue;
      live.add(npc.id);
      let actor = this.actors.get(npc.id);

      if (!actor) {
        actor = {
          id: npc.id,
          species: npc.species,
          variant: npc.variant ?? 0,
          pos: { ...queue.entrance },
          path: [],
          mode: 'queued',
          facing: 'up',
          walkTime: 0,
          moving: false,
          fade: 1,
          slot: Number.MAX_SAFE_INTEGER,
          announcedDesk: false,
          announcedEnd: false,
        };
        this.actors.set(npc.id, actor);
      }

      switch (npc.activity.kind) {
        case 'queued': {
          const index = Math.min(npc.activity.slot, queue.slots.length - 1);
          const slot = queue.slots[index];
          actor.mode = 'queued';
          actor.slot = npc.activity.slot;
          // walk straight to the assigned queue slot (no zigzag multi-waypoint)
          actor.path = [slot];
          break;
        }
        case 'approved': {
          if (actor.mode !== 'approved' && actor.mode !== 'done') {
            actor.mode = 'approved';
            actor.path = pathToEntryGate(actor.pos);
          }
          break;
        }
        case 'detained': {
          if (actor.mode !== 'detained') {
            actor.mode = 'detained';
            actor.path = pathToJail(actor.pos, this.detainedCount++);
            const start = this.jailEscortStart();
            actor.escort = {
              pos: { ...start },
              path: [officerPostForEscort()],
              returning: false,
            };
          }
          break;
        }
      }
    }

    // drop actors gameplay no longer tracks
    for (const id of [...this.actors.keys()]) {
      if (!live.has(id)) this.actors.delete(id);
    }

    const dist = CHARACTER.walkSpeed * dt;
    for (const actor of this.actors.values()) {
      const next = actor.path[0];
      if (next) {
        actor.facing = facingFrom(actor.pos, next, actor.facing);
        const far = Math.hypot(next.x - actor.pos.x, next.y - actor.pos.y) > ARRIVE_EPS;
        actor.moving = far;
        if (far) {
          if (stepTowards(actor.pos, next, dist)) actor.path.shift();
          actor.walkTime += dt;
        } else {
          // close enough — consume the waypoint so the route can finish
          actor.pos.x = next.x;
          actor.pos.y = next.y;
          actor.path.shift();
        }
      } else {
        actor.moving = false;
      }

      // --- events ---
      if (actor.mode === 'queued' && actor.slot === 0 && !actor.moving && !actor.announcedDesk) {
        actor.announcedDesk = true;
        this.emit({ type: 'reachedDesk', id: actor.id });
      }
      if (actor.mode === 'detained' && actor.path.length === 0 && !actor.announcedEnd) {
        actor.announcedEnd = true;
        this.emit({ type: 'reachedJail', id: actor.id });
      }

      if (actor.mode === 'approved' && actor.path.length === 0) {
        actor.fade = Math.max(0, actor.fade - dt * 2);
        if (actor.fade === 0) {
          actor.mode = 'done';
          if (!actor.announcedEnd) {
            actor.announcedEnd = true;
            this.emit({ type: 'exitedThroughGate', id: actor.id });
          }
        }
      }
      if (actor.mode === 'queued') actor.facing = 'up';

      // escorting officer trails just behind the detainee, then walks back
      if (actor.escort) {
        const esc = actor.escort;
        if (!esc.returning && esc.path.length === 0 && actor.path.length === 0) {
          esc.returning = true;
          esc.path = [this.jailEscortStart()];
        }

        const target = esc.returning
          ? esc.path[0]
          : esc.path.length > 0
            ? esc.path[0]
            : { x: actor.pos.x - 14, y: actor.pos.y + 6 };

        if (target) {
          const arrived = stepTowards(esc.pos, target, dist * 1.05);
          if (arrived && esc.path.length > 0) esc.path.shift();
          if (esc.returning && esc.path.length === 0 && arrived) {
            actor.escort = undefined;
          }
        }
      }
    }
  }

  /** Y-sortable draw calls for every visible actor (and their escort). */
  sortables(): Sortable[] {
    const out: Sortable[] = [];
    for (const actor of this.actors.values()) {
      if (actor.mode === 'done') continue;
      const frame = actor.moving ? Math.floor(actor.walkTime * 7) % 4 : 0;

      out.push({
        y: actor.pos.y,
        draw: (ctx) => {
          ctx.save();
          ctx.globalAlpha = actor.fade;
          drawShadow(ctx, actor.pos.x, actor.pos.y, 7);
          drawCharacter(ctx, actor.pos.x, actor.pos.y, {
            asset: actor.species,
            species: actor.species,
            variant: actor.variant,
            height: CHARACTER.npcHeight,
            frame,
            facing: actor.facing,
          });
          ctx.restore();
        },
      });

      if (actor.escort) {
        const esc = actor.escort;
        out.push({
          y: esc.pos.y,
          draw: (ctx) => {
            drawShadow(ctx, esc.pos.x, esc.pos.y, 8);
            drawCharacter(ctx, esc.pos.x, esc.pos.y, {
              asset: 'police',
              role: 'police',
              height: CHARACTER.policeHeight,
              frame,
              facing: esc.returning ? 'left' : 'right',
            });
          },
        });
      }
    }
    return out;
  }

  /** True while anyone is being walked to a gate — handy for opening doors. */
  isAnyoneAtEntryGate(): boolean {
    for (const a of this.actors.values()) {
      if (a.mode === 'approved' && a.path.length <= 2) return true;
    }
    return false;
  }

  isAnyoneAtJailGate(): boolean {
    for (const a of this.actors.values()) {
      if (a.mode === 'detained' && a.path.length <= 2) return true;
    }
    return false;
  }
}
