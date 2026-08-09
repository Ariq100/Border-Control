// Gameplay-only types. Nothing here is known to the environment/rendering layer.

export type Organization = 'SpaceX' | 'NASA' | 'Blue Origin' | 'ULA' | 'Sierra Space';

export interface License {
  name: string;
  birthplace: string;
  birthdate: Date;
  organization: Organization;
  issueDate: Date;
  expiryDate: Date;
}

/**
 * The five states an arrival moves through.
 * `accepted` is the instant of the decision; `movingForward` is the walk to the
 * Entry gate that follows it.
 */
export type NpcPhase =
  | 'queued'
  | 'investigation'
  | 'accepted'
  | 'movingForward'
  | 'detained';

export interface ToolReadings {
  /** Body temperature in °C. Humans never exceed 39. */
  temperatureC: number;
  /** Short breathing-pattern description. */
  breathing: string;
  /** True when the breathing pattern is human-like. */
  breathingHuman: boolean;
}

export interface Arrival {
  id: string;
  /** Hidden ground truth. Never rendered anywhere. */
  isHuman: boolean;
  /** Which sprite they show up as. Some aliens pass visually. */
  appearance: 'human' | 'alien';
  variant: number;
  /** URL of the photograph used on the licence (assigned once on spawn). */
  photo: string;
  license: License;
  readings: ToolReadings;
  phase: NpcPhase;
}

export type ToolId = 'thermometer' | 'stethoscope';

export interface ToolReadout {
  npcId: string;
  tool: ToolId;
  title: string;
  value: string;
  detail: string;
}

export type Decision = 'accept' | 'reject';

/** Which kind of mistake ended the run — decides which cutscene plays. */
export type MistakeType = 'accepted-alien' | 'rejected-human';

export type GamePhase = 'start' | 'playing' | 'cutscene' | 'end';

export interface GameState {
  phase: GamePhase;
  playerName: string;
  arrivals: Arrival[];
  lives: number;
  score: number;
  /** Set only when lives reach 0. */
  fatalMistake: MistakeType | null;
  /** Index of the equipped inventory slot, or null. */
  equippedSlot: number | null;
  readout: ToolReadout | null;
  clock: Date;
  spawnCounter: number;
}
