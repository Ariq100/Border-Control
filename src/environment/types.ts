// Shared types for the station environment layer.
// Gameplay code should only ever need to import from this file + index.ts.

export interface Vec2 {
  x: number;
  y: number;
}

export type Species = 'human' | 'alien';

/** What an NPC is currently doing. Gameplay owns this; the environment animates it. */
export type NpcActivity =
  | { kind: 'queued'; slot: number } // slot 0 = front of the line, at the desk
  | { kind: 'approved' } // walks to the entry gate and leaves the hall
  | { kind: 'detained' } // escorted by an officer into the jail block
  | { kind: 'gone' }; // off-screen, no longer drawn

export interface EnvNpc {
  id: string;
  species: Species;
  activity: NpcActivity;
  /** Optional 0..3 palette variant so the queue doesn't look cloned. */
  variant?: number;
}

export interface InventoryItem {
  id: string;
  label: string;
  /** Short glyph drawn in the slot, e.g. 'ID', 'ST', 'RG'. */
  glyph?: string;
  color?: string;
}

/** Everything the environment needs from gameplay in order to draw a frame. */
export interface EnvironmentState {
  npcs: EnvNpc[];
  inventory: (InventoryItem | null)[]; // length 3
  heldItem: InventoryItem | null;
  clock: Date;
}

export type Facing = 'up' | 'down' | 'left' | 'right';

/** One thing on the floor that participates in Y-sorting. */
export interface Sortable {
  /** World Y of the object's base (feet). Higher = drawn later = in front. */
  y: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}
