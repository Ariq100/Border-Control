import { useEffect, useMemo, useRef, useState } from 'react';
import { HUD } from './HUD';
import { Renderer } from './Renderer';
import type { EnvNpc, EnvironmentState } from './types';
import type { EnvEvent } from './ActorSystem';

export interface EnvironmentSceneProps {
  /**
   * Controlled mode: pass live gameplay state and the environment just draws it.
   * Leave undefined to run the built-in ambient demo instead.
   */
  state?: EnvironmentState;
  onSlotPress?: (index: number) => void;
  activeSlot?: number;
  /** Walk-finished events from the floor: reached desk / gate / jail. */
  onEvent?: (event: EnvEvent) => void;
  /** Player clicked a character on the floor. */
  onNpcClick?: (id: string) => void;
  /** Hide the separate held-item slot (gameplay uses slot highlighting instead). */
  showHeldSlot?: boolean;
  /** In-game minutes that pass per real second (demo mode only). */
  clockRate?: number;
}

function makeNpc(n: number): EnvNpc {
  const species = Math.random() < 0.5 ? 'human' : 'alien';
  return {
    id: `npc-${n}`,
    species,
    variant: (n * 3) % 4,
    activity: { kind: 'queued', slot: 0 },
  };
}

/**
 * Drop-in scene. Mount it full-bleed:
 *   <div style={{ position:'relative', width:'100vw', height:'100vh' }}>
 *     <EnvironmentScene />
 *   </div>
 */
export function EnvironmentScene({
  state,
  onSlotPress,
  activeSlot,
  onEvent,
  onNpcClick,
  showHeldSlot = true,
  clockRate = 30,
}: EnvironmentSceneProps) {
  const demo = useDemoState(!state, clockRate);
  const live = state ?? demo;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <Renderer state={live} onEvent={onEvent} onNpcClick={onNpcClick} />
      <HUD
        clock={live.clock}
        inventory={live.inventory}
        heldItem={live.heldItem}
        onSlotPress={onSlotPress}
        activeSlot={activeSlot}
        showHeldSlot={showHeldSlot}
      />
    </div>
  );
}

/**
 * Ambient placeholder so the environment is viewable before gameplay exists:
 * a line that shuffles forward, with the front arrival alternately waved
 * through the entry gate or marched off to detention.
 */
function useDemoState(enabled: boolean, clockRate: number): EnvironmentState {
  const [npcs, setNpcs] = useState<EnvNpc[]>(() =>
    Array.from({ length: 9 }, (_, i) => ({ ...makeNpc(i), activity: { kind: 'queued', slot: i } })),
  );
  const [clock, setClock] = useState(() => new Date(2187, 2, 14, 9, 0, 0));
  const counter = useRef(9);

  useEffect(() => {
    if (!enabled) return;
    const tick = setInterval(() => {
      setClock((c) => new Date(c.getTime() + clockRate * 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [enabled, clockRate]);

  useEffect(() => {
    if (!enabled) return;
    const cycle = setInterval(() => {
      setNpcs((prev) => {
        const queued = prev.filter((n) => n.activity.kind === 'queued');
        if (!queued.length) return prev;
        const frontId = queued.reduce((a, b) =>
          (a.activity as { slot: number }).slot <= (b.activity as { slot: number }).slot ? a : b,
        ).id;
        const sendToJail = Math.random() < 0.4;

        const next = prev
          .map((n) => {
            if (n.id === frontId) {
              return { ...n, activity: { kind: sendToJail ? 'detained' : 'approved' } as const };
            }
            if (n.activity.kind === 'queued') {
              return { ...n, activity: { kind: 'queued' as const, slot: Math.max(0, n.activity.slot - 1) } };
            }
            return n;
          })
          .slice(-14);

        next.push({
          ...makeNpc(counter.current++),
          activity: { kind: 'queued', slot: queued.length },
        });
        return next;
      });
    }, 4200);
    return () => clearInterval(cycle);
  }, [enabled]);

  return useMemo(
    () => ({
      npcs,
      inventory: [null, null, null],
      heldItem: null,
      clock,
    }),
    [npcs, clock],
  );
}
