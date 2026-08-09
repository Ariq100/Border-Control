// Public surface of the environment layer. Gameplay code should import from
// here only — nothing inside needs editing to hook logic in.

export { EnvironmentScene } from './EnvironmentScene';
export type { EnvironmentSceneProps } from './EnvironmentScene';
export { Renderer } from './Renderer';
export { HUD, StationClock } from './HUD';
export { Camera } from './Camera';
export { ActorSystem } from './ActorSystem';
export type { EnvEvent, EnvEventListener } from './ActorSystem';
export { drawCharacter, styleFor } from './characters';
export { buildQueueLane } from './QueueLane';
export type { QueueLaneLayout } from './QueueLane';
export { deskWindow, playerAnchor } from './Desk';
export { entryGateCenter, jailGateCenter, officerPositions } from './Gates';
export { jailCells } from './JailArea';
export { pathToEntryGate, pathToJail } from './paths';
export { preloadCharacterImages, IMAGE_BASE } from './characters';
export * from './constants';
export type {
  EnvNpc,
  EnvironmentState,
  Facing,
  InventoryItem,
  NpcActivity,
  Sortable,
  Species,
  Vec2,
} from './types';
