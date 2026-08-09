import { useCallback, useEffect, useMemo, useReducer } from 'react';
import type { EnvEvent, EnvNpc, InventoryItem } from '../environment';
import { createArrival } from './arrivals';
import { applyDecisionToScore, isDecisionCorrect } from './scoring';
import type { Arrival, Decision, GameState, ToolId, ToolReadout } from './types';

/** How many arrivals may be in the hall at once. */
export const QUEUE_CAPACITY = 8;
const SPAWN_INTERVAL_MS = 2000;
const CLOCK_TICK_MS = 1000;
const IN_GAME_SECONDS_PER_TICK = 60;
const STARTING_LIVES = 3;

export const TOOLS: { id: ToolId; item: InventoryItem }[] = [
  { id: 'thermometer', item: { id: 'thermometer', label: 'Thermo', glyph: '🌡', color: '#ffb648' } },
  { id: 'stethoscope', item: { id: 'stethoscope', label: 'Stetho', glyph: '🩺', color: '#5fe0d0' } },
];

export function initialState(): GameState {
  return {
    phase: 'start',
    playerName: '',
    arrivals: [],
    lives: STARTING_LIVES,
    score: 0,
    fatalMistake: null,
    equippedSlot: null,
    readout: null,
    clock: new Date(2187, 2, 14, 9, 0, 0),
    spawnCounter: 0,
  };
}

export type Action =
  | { type: 'start'; name: string }
  | { type: 'restart' }
  | { type: 'tickClock' }
  | { type: 'spawn' }
  | { type: 'env'; event: EnvEvent }
  | { type: 'equip'; slot: number }
  | { type: 'inspect'; npcId: string }
  | { type: 'closeReadout' }
  | { type: 'decide'; decision: Decision }
  | { type: 'cutsceneDone' };

function currentArrival(state: GameState): Arrival | undefined {
  return state.arrivals.find((a) => a.phase === 'investigation');
}

function buildReadout(arrival: Arrival, tool: ToolId): ToolReadout {
  if (tool === 'thermometer') {
    return {
      npcId: arrival.id,
      tool,
      title: 'Thermal probe',
      value: `${arrival.readings.temperatureC.toFixed(1)} °C`,
      detail: 'Human core temperature does not exceed 39.0 °C.',
    };
  }
  return {
    npcId: arrival.id,
    tool,
    title: 'Auscultation',
    value: arrival.readings.breathing,
    detail: 'Human respiration is regular and paired.',
  };
}

/** Exported so the decision, lives and score rules can be unit-tested. */
export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'start':
      return { ...initialState(), phase: 'playing', playerName: action.name.trim() };

    case 'restart':
      return { ...initialState(), playerName: state.playerName };

    case 'tickClock':
      return {
        ...state,
        clock: new Date(state.clock.getTime() + IN_GAME_SECONDS_PER_TICK * 1000),
      };

    case 'spawn': {
      const waiting = state.arrivals.filter(
        (a) => a.phase === 'queued' || a.phase === 'investigation',
      ).length;
      if (waiting >= QUEUE_CAPACITY) return state;
      return {
        ...state,
        arrivals: [...state.arrivals, createArrival(state.clock, 0.5)],
        spawnCounter: state.spawnCounter + 1,
      };
    }

    case 'env': {
      const { event } = action;
      if (event.type === 'reachedDesk') {
        const front = state.arrivals.find((a) => a.phase === 'queued' || a.phase === 'investigation');
        if (!front || front.id !== event.id || front.phase === 'investigation') return state;
        return {
          ...state,
          arrivals: state.arrivals.map((a) =>
            a.id === event.id ? { ...a, phase: 'investigation' } : a,
          ),
        };
      }
      // walked off through the gate — they're done and removed.
      if (event.type === 'exitedThroughGate') {
        return { ...state, arrivals: state.arrivals.filter((a) => a.id !== event.id) };
      }

      // reachedJail: keep the arrival in the arrivals list so detainees
      // (humans and aliens) remain visible inside the jail.
      if (event.type === 'reachedJail') {
        return state;
      }

      return state;
    }

    case 'equip': {
      const same = state.equippedSlot === action.slot;
      return {
        ...state,
        equippedSlot: same ? null : action.slot,
        readout: same ? null : state.readout,
      };
    }

    case 'inspect': {
      const arrival = currentArrival(state);
      const tool = state.equippedSlot === null ? null : TOOLS[state.equippedSlot]?.id;
      if (!arrival || !tool || arrival.id !== action.npcId) return state;
      return { ...state, readout: buildReadout(arrival, tool) };
    }

    case 'closeReadout':
      return { ...state, readout: null };

    case 'decide': {
      const arrival = currentArrival(state);
      if (!arrival || state.phase !== 'playing') return state;

      const correct = isDecisionCorrect(arrival, action.decision);
      const score = applyDecisionToScore(state.score, arrival, action.decision);
      const lives = correct ? state.lives : state.lives - 1;
      const outOfLives = lives <= 0;

      // no feedback of any kind here — mistakes 1 and 2 are entirely silent
      return {
        ...state,
        score,
        lives,
        readout: null,
        phase: outOfLives ? 'cutscene' : state.phase,
        fatalMistake: outOfLives
          ? action.decision === 'accept'
            ? 'accepted-alien'
            : 'rejected-human'
          : null,
        arrivals: state.arrivals.map((a) =>
          a.id === arrival.id
            ? { ...a, phase: action.decision === 'accept' ? 'movingForward' : 'detained' }
            : a,
        ),
      };
    }

    case 'cutsceneDone':
      return { ...state, phase: 'end' };

    default:
      return state;
  }
}

/** Maps gameplay phases onto the activity flags the environment animates. */
export function toEnvNpcs(arrivals: Arrival[]): EnvNpc[] {
  let slot = 0;
  return arrivals.map((a) => {
    if (a.phase === 'queued' || a.phase === 'investigation') {
      const activitySlot = a.phase === 'investigation' ? 0 : slot;
      slot += 1;
      return {
        id: a.id,
        species: a.appearance,
        variant: a.variant,
        activity: { kind: 'queued', slot: activitySlot },
      };
    }
    if (a.phase === 'detained') {
      return { id: a.id, species: a.appearance, variant: a.variant, activity: { kind: 'detained' } };
    }
    return { id: a.id, species: a.appearance, variant: a.variant, activity: { kind: 'approved' } };
  });
}

export function useBorderControl() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  // in-game clock, used by the player to spot expired licences
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const id = setInterval(() => dispatch({ type: 'tickClock' }), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, [state.phase]);

  // arrivals trickle in through the docking corridor
  useEffect(() => {
    if (state.phase !== 'playing') return;
    dispatch({ type: 'spawn' });
    const id = setInterval(() => dispatch({ type: 'spawn' }), SPAWN_INTERVAL_MS);
    return () => clearInterval(id);
  }, [state.phase]);

  const envNpcs = useMemo(() => toEnvNpcs(state.arrivals), [state.arrivals]);
  const inspecting = useMemo(() => currentArrival(state), [state]);

  const inventory = useMemo<(InventoryItem | null)[]>(
    () => [TOOLS[0].item, TOOLS[1].item, null],
    [],
  );

  return {
    state,
    envNpcs,
    inventory,
    /** The arrival currently at the desk, or undefined. */
    inspecting,
    start: useCallback((name: string) => dispatch({ type: 'start', name }), []),
    restart: useCallback(() => dispatch({ type: 'restart' }), []),
    onEnvEvent: useCallback((event: EnvEvent) => dispatch({ type: 'env', event }), []),
    equipSlot: useCallback((slot: number) => {
      if (slot >= TOOLS.length) return;
      dispatch({ type: 'equip', slot });
    }, []),
    inspectNpc: useCallback((npcId: string) => dispatch({ type: 'inspect', npcId }), []),
    closeReadout: useCallback(() => dispatch({ type: 'closeReadout' }), []),
    decide: useCallback((decision: Decision) => dispatch({ type: 'decide', decision }), []),
    finishCutscene: useCallback(() => dispatch({ type: 'cutsceneDone' }), []),
  };
}
