// Tile metrics, palette and the fixed layout of the arrivals hall.
// All layout below is expressed in TILES; use t() to get world pixels.

export const TILE = 32;
export const MAP_COLS = 36;
export const MAP_ROWS = 30;
export const MAP_W = MAP_COLS * TILE;
export const MAP_H = MAP_ROWS * TILE;

/** Nearest-neighbour upscale factor for the whole scene. */
export const ZOOM = 2;

/** Tiles -> world pixels. */
export const t = (n: number) => n * TILE;

export const PALETTE = {
  // flooring
  floorA: '#3b444e',
  floorB: '#424c57',
  floorSeam: '#2a3138',
  floorRivet: '#4e5a66',
  // structure
  wall: '#20262c',
  wallFace: '#2c343c',
  wallTrim: '#59697a',
  frame: '#1a1f24',
  // accents
  amber: '#ffb648',
  amberDim: '#7a5320',
  teal: '#5fe0d0',
  tealDim: '#1e5b57',
  red: '#e2564a',
  // furniture
  deskTop: '#6e7d8c',
  deskFace: '#47535e',
  deskEdge: '#8ea0b1',
  glass: '#8fd0ff',
  bar: '#8b98a6',
  // characters
  police: '#15181c',
  policeTrim: '#2c3340',
  skin: '#e8b48c',
  alienSkin: '#7fd07a',
} as const;

/** Rows 0..3 are the exterior viewport band (space is visible through it). */
export const WINDOW_BAND = { row0: 0, row1: 4 };
/** Row 4 is the wall lip under the windows; the hall floor starts at row 5. */
export const WALL_ROW = 4;
export const FLOOR_ROW0 = 5;
export const FLOOR_ROW1 = MAP_ROWS - 1;

/** Border control desk (tiles). NPCs approach from below, player stands above. */
export const DESK = { x0: 10, x1: 17, y: 9, h: 1.4 };
export const PLAYER_ANCHOR = { x: 13.5, y: 7.7 };

/** Entry gate in the top wall — approved arrivals walk through here. */
export const ENTRY_GATE = { x0: 3, x1: 7, y: FLOOR_ROW0 };
export const ENTRY_OFFICERS = [
  { x: 2.2, y: 5.9 },
  { x: 7.8, y: 5.9 },
];

/** Detention block, right hand side, behind bars. */
export const JAIL = { x0: 26, x1: 34, y0: 6, y1: 14 };
export const JAIL_BAR_X = 25.5;
export const JAIL_GATE = { y0: 9, y1: 11 };
export const JAIL_OFFICERS = [
  { x: 24.4, y: 8.6 },
  { x: 24.4, y: 11.6 },
];
/** Where detained NPCs end up standing, inside the block. */
export const JAIL_CELLS = [
  { x: 28, y: 8.5 },
  { x: 30, y: 8.5 },
  { x: 32, y: 8.5 },
  { x: 28, y: 11.5 },
  { x: 30, y: 11.5 },
  { x: 32, y: 11.5 },
  { x: 28, y: 13.5 },
  { x: 30, y: 13.5 },
];

/** Zigzag queue. laneRows is ordered from the entrance towards the desk. */
export const QUEUE = {
  xMin: 5,
  xMax: 21,
  laneRows: [22, 19, 16, 13],
  spacing: 2,
  lastLaneEndX: 13.5,
  deskFront: { x: 13.5, y: 11.2 },
  entrance: { x: 20, y: 27.5 },
};

/** Arrivals corridor cut into the bottom wall. */
export const ENTRANCE_GAP = { x0: 18, x1: 22 };

export const CHARACTER = {
  npcHeight: 34, // world px, small queued arrivals
  playerHeight: 46, // clearly larger, stands behind the desk
  policeHeight: 40,
  walkSpeed: 46, // world px / second
};
