import { JAIL_BAR_X, t, DESK } from './constants';
import { entryGateCenter } from './Gates';
import { jailCells } from './JailArea';
import type { Vec2 } from './types';

/** Clear corridor row behind the desk that both routes use. */
const CONCOURSE_Y = t(7.2);

/** Approved: step behind the desk, cross the concourse, exit through the entry gate. */
export function pathToEntryGate(from: Vec2): Vec2[] {
  // route around the desk: pick left or right flank based on origin X
  const deskCenterX = t((DESK.x0 + DESK.x1) / 2);
  const flankX = from.x < deskCenterX ? t(DESK.x0 - 1.4) : t(DESK.x1 + 1.4);
  return [
    { x: from.x, y: CONCOURSE_Y },
    { x: flankX, y: CONCOURSE_Y },
    { x: entryGateCenter.x, y: CONCOURSE_Y },
    { x: entryGateCenter.x, y: entryGateCenter.y - t(0.4) },
    { x: entryGateCenter.x, y: entryGateCenter.y - t(2.2) }, // walks off into the station
  ];
}

/** Rejected: marched along the concourse and through the barred gate into a cell. */
export function pathToJail(from: Vec2, cellIndex: number): Vec2[] {
  const cell = jailCells[cellIndex % jailCells.length];
  return [
    { x: from.x, y: CONCOURSE_Y + t(1.2) },
    { x: t(JAIL_BAR_X - 1.6), y: CONCOURSE_Y + t(1.2) },
    { x: t(JAIL_BAR_X - 1.6), y: t(10) },
    { x: t(JAIL_BAR_X + 1.2), y: t(10) },
    cell,
  ];
}

/** Where an escorting officer starts from and returns to. */
export function officerPostForEscort(): Vec2 {
  return { x: t(JAIL_BAR_X - 1.1), y: t(8.6) };
}
